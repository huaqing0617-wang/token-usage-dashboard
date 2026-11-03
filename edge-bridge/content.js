/* DSH Official Usage Bridge — runs only on platform.deepseek.com. */
(() => {
  'use strict';

  const BRIDGE_URL = 'http://127.0.0.1:17654/api/official-usage/ingest';
  const BRIDGE_TOKEN = 'dsh-official-bridge-9f4c1e6b7a2d8c5f4e3b1a0d9c8b7a6f';
  const CACHE_KEY = 'dshOfficialUsageBridgeV1';
  const REFRESH_MS = 30_000;

  let refreshing = false;
  let allTimeCache = null;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const todayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const localToken = () => {
    try {
      const raw = localStorage.getItem('userToken');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return typeof parsed === 'string' ? parsed : parsed?.value ?? null;
    } catch {
      return null;
    }
  };
  const headers = () => {
    const token = localToken();
    return {
      accept: 'application/json',
      'x-client-platform': 'web',
      ...(token === null ? {} : { authorization: `Bearer ${token}` }),
    };
  };

  async function getJSON(path, attempts = 4) {
    let lastError;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        const response = await fetch(path, { credentials: 'include', headers: headers() });
        if (response.status === 202) {
          lastError = new Error('Platform WAF challenge');
          await sleep(1200 * 2 ** attempt);
          continue;
        }
        if (response.status === 429 || response.status >= 500) {
          lastError = new Error(`HTTP ${response.status}`);
          await sleep(1200 * 2 ** attempt);
          continue;
        }
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      } catch (error) {
        lastError = error;
        if (attempt + 1 < attempts) await sleep(1000 * 2 ** attempt);
      }
    }
    throw lastError ?? new Error('request failed');
  }

  function number(value) {
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  const DAY_MS = 24 * 60 * 60 * 1000;
  const MAX_WINDOWS = 48;
  const WINDOW_DELAY_MS = 900;
  const WINDOW_CACHE_MS = 6 * 60 * 60 * 1000;

  function localMidnight(time) {
    const date = new Date(time);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }

  function todayWindowEnd() {
    return localMidnight(Date.now()) + DAY_MS;
  }

  async function fetchWindow(endMs) {
    const start = endMs - 30 * DAY_MS;
    const tz = -new Date(endMs).getTimezoneOffset() * 60;
    const query = `start=${Math.floor(start / 1000)}&end=${Math.floor(endMs / 1000)}&tz=${tz}`;
    const [amount, cost] = await Promise.all([
      getJSON(`/api/v0/usage/by_api_key/amount?${query}`),
      getJSON(`/api/v0/usage/by_api_key/cost?${query}`),
    ]);
    return parseWindow(amount, cost);
  }

  async function loadWindow(endMs, cache, force) {
    const key = String(endMs);
    const cached = cache.windows[key];
    if (!force && cached !== undefined && Date.now() - cached.at < WINDOW_CACHE_MS) return cached.data;
    const data = await fetchWindow(endMs);
    cache.windows[key] = { at: Date.now(), data };
    await chrome.storage.local.set({ [CACHE_KEY]: cache });
    return data;
  }

  function addParsedWindow(target, parsed) {
    for (const entry of parsed.daily) {
      const existing = target.days.get(entry.date);
      if (existing === undefined) target.days.set(entry.date, { ...entry });
      else {
        existing.tokens += entry.tokens;
        existing.cost += entry.cost;
        existing.requests += entry.requests;
      }
    }
    for (const key of parsed.keys) {
      let existing = target.keys.get(key.id);
      if (existing === undefined) {
        existing = { id: key.id, name: key.name, tokens: 0, cost: 0, requests: 0, models: new Set() };
        target.keys.set(key.id, existing);
      }
      existing.tokens += key.tokens;
      existing.cost += key.cost;
      existing.requests += key.requests;
      for (const model of key.models) existing.models.add(model);
    }
    for (const model of parsed.models) {
      let existing = target.models.get(model.model);
      if (existing === undefined) {
        existing = { model: model.model, tokens: 0, cost: 0 };
        target.models.set(model.model, existing);
      }
      existing.tokens += model.tokens;
      existing.cost += model.cost;
    }
  }

  function aggregateTarget(target, errors, complete, scannedWindows) {
    const days = [...target.days.values()].sort((a, b) => a.date.localeCompare(b.date));
    const keys = [...target.keys.values()].map((key) => ({ ...key, models: [...key.models] })).sort((a, b) => b.cost - a.cost || b.tokens - a.tokens);
    const models = [...target.models.values()].sort((a, b) => b.cost - a.cost || b.tokens - a.tokens);
    const allTime = days.reduce((total, day) => ({
      tokens: total.tokens + day.tokens,
      requests: total.requests + day.requests,
      cost: total.cost + day.cost,
    }), { tokens: 0, requests: 0, cost: 0 });
    return {
      allTime: { ...allTime, cost: Number(allTime.cost.toFixed(8)), costAvailable: days.length > 0 },
      days,
      keys,
      models,
      errors,
      coverage: {
        from: days[0]?.date ?? '',
        to: days.at(-1)?.date ?? '',
        months: scannedWindows,
        complete,
      },
    };
  }

  /**
   * Aggregate the full history from consecutive 30-day by-key windows.
   * This endpoint is the one the installed extension has already proven it can
   * call successfully; the monthly aggregate endpoints are the ones the WAF
   * was challenging. Windows are fetched oldest-first one at a time with
   * retries, and the current window is supplied by the caller.
   */
  async function collectAllTime(currentWindow, onProgress) {
    const cache = allTimeCache ?? (await chrome.storage.local.get(CACHE_KEY))[CACHE_KEY] ?? { windows: {} };
    if (cache.windows === undefined || cache.windows === null || typeof cache.windows !== 'object') cache.windows = {};
    allTimeCache = cache;
    const target = { days: new Map(), keys: new Map(), models: new Map() };
    const errors = [];
    let windowData = currentWindow;
    let endMs = todayWindowEnd();
    let scanned = 0;
    let emptyStreak = 0;
    let complete = false;

    for (let index = 0; index < MAX_WINDOWS; index += 1) {
      try {
        if (windowData === null) windowData = await loadWindow(endMs, cache, false);
        addParsedWindow(target, windowData);
        scanned += 1;
        const nonEmpty = windowData.daily.some((day) => day.tokens > 0 || day.requests > 0 || day.cost > 0);
        emptyStreak = nonEmpty ? 0 : emptyStreak + 1;
        if (index === 0 || index % 4 === 0) onProgress?.(aggregateTarget(target, errors, false, scanned));
        if (emptyStreak >= 3) {
          complete = errors.length === 0;
          break;
        }
      } catch (error) {
        errors.push(`${new Date(endMs - 30 * DAY_MS).toISOString().slice(0, 10)}: ${String(error)}`);
        emptyStreak = 0;
      }
      endMs -= 30 * DAY_MS;
      windowData = null;
      await sleep(WINDOW_DELAY_MS);
    }

    const aggregate = aggregateTarget(target, errors, complete, scanned);
    if (onProgress) onProgress(aggregate);
    return aggregate;
  }

  function parseWindow(amountPayload, costPayload) {
    const amountSeries = amountPayload?.data?.biz_data?.series ?? [];
    const costBlocks = costPayload?.data?.biz_data?.data ?? [];
    const block = costBlocks.find((c) => c?.currency === 'CNY') ?? costBlocks[0];
    const currency = typeof block?.currency === 'string' ? block.currency : 'CNY';
    const keys = new Map();
    const days = new Map();
    const models = new Map();
    const today = todayKey();
    let todayTokens = 0;
    let todayRequests = 0;
    let todayCost = 0;
    let totalTokens = 0;
    let totalRequests = 0;
    const day = (date) => {
      let entry = days.get(date);
      if (entry === undefined) {
        entry = { date, tokens: 0, cost: 0, requests: 0 };
        days.set(date, entry);
      }
      return entry;
    };
    const keyEntry = (key) => {
      let entry = keys.get(key.id);
      if (entry === undefined) {
        entry = { id: key.id, name: key.name, tokens: 0, cost: 0, requests: 0, models: new Set() };
        keys.set(key.id, entry);
      }
      return entry;
    };
    const identity = (value) => {
      if (typeof value === 'string') return { id: value, name: value };
      return { id: String(value?.tracking_id ?? value?.name ?? 'unknown'), name: String(value?.name ?? value?.tracking_id ?? '') };
    };
    for (const series of Array.isArray(amountSeries) ? amountSeries : []) {
      const modelName = String(series?.model ?? 'unknown');
      const key = identity(series?.api_key);
      const keyInfo = keyEntry(key);
      keyInfo.models.add(modelName);
      for (const bucket of Array.isArray(series?.buckets) ? series.buckets : []) {
        if (!Number.isFinite(bucket?.time)) continue;
        const date = new Date(bucket.time * 1000);
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        for (const [type, raw] of Object.entries(bucket?.usage ?? {})) {
          const value = Math.floor(number(raw));
          if (value === 0) continue;
          if (type === 'REQUEST') {
            totalRequests += value;
            day(dateStr).requests += value;
            keyInfo.requests += value;
            if (dateStr === today) todayRequests += value;
          } else if (type === 'PROMPT_CACHE_HIT_TOKEN' || type === 'PROMPT_CACHE_MISS_TOKEN' || type === 'RESPONSE_TOKEN') {
            totalTokens += value;
            day(dateStr).tokens += value;
            keyInfo.tokens += value;
            const model = models.get(modelName) ?? { model: modelName, tokens: 0, cost: 0 };
            model.tokens += value;
            models.set(modelName, model);
            if (dateStr === today) todayTokens += value;
          }
        }
      }
    }
    for (const costSeries of Array.isArray(block?.series) ? block.series : []) {
      const modelName = String(costSeries?.model ?? 'unknown');
      const key = identity(costSeries?.api_key);
      const keyInfo = keyEntry(key);
      keyInfo.models.add(modelName);
      for (const bucket of Array.isArray(costSeries?.buckets) ? costSeries.buckets : []) {
        if (!Number.isFinite(bucket?.time)) continue;
        const value = number(bucket?.cost);
        const date = new Date(bucket.time * 1000);
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        day(dateStr).cost += value;
        keyInfo.cost += value;
        const model = models.get(modelName) ?? { model: modelName, tokens: 0, cost: 0 };
        model.cost += value;
        models.set(modelName, model);
        if (dateStr === today) todayCost += value;
      }
    }
    const daily = [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
    const last30 = daily.reduce((t, d) => ({ tokens: t.tokens + d.tokens, cost: t.cost + d.cost, requests: t.requests + d.requests }), { tokens: 0, cost: 0, requests: 0 });
    return {
      currency,
      today: { tokens: todayTokens, cost: Number(todayCost.toFixed(8)), requests: todayRequests, costAvailable: true },
      last30Days: { tokens: last30.tokens, cost: Number(last30.cost.toFixed(8)), requests: last30.requests, costAvailable: true },
      keys: [...keys.values()].map((key) => ({ ...key, models: [...key.models] })),
      models: [...models.values()],
      daily,
    };
  }

  async function collectBalance() {
    const summary = await getJSON('/api/v0/users/get_user_summary');
    const data = summary?.data?.biz_data;
    const wallets = new Map();
    for (const [kind, list] of [['normal', data?.normal_wallets], ['bonus', data?.bonus_wallets]]) {
      for (const wallet of Array.isArray(list) ? list : []) {
        const currency = String(wallet?.currency ?? '');
        if (currency.length === 0) continue;
        const entry = wallets.get(currency) ?? { currency, normal: 0, bonus: 0, total: 0 };
        const amount = number(wallet?.balance);
        entry[kind] += amount;
        entry.total += amount;
        wallets.set(currency, entry);
      }
    }
    return { wallets: [...wallets.values()] };
  }

  function currentMonthWindow() {
    const end = new Date();
    end.setHours(24, 0, 0, 0);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 29);
    return {
      start: Math.floor(start.getTime() / 1000),
      end: Math.floor(end.getTime() / 1000),
      tz: -new Date().getTimezoneOffset() * 60,
    };
  }

  function makeSnapshot(all, current, balance, errors, scanning) {
    const todayKeyValue = todayKey();
    const todayFromHistory = all.days.find((day) => day.date === todayKeyValue) ?? { tokens: 0, cost: 0, requests: 0 };
    const recent = all.days.slice(-30);
    const last30FromHistory = recent.reduce((total, day) => ({
      tokens: total.tokens + day.tokens,
      cost: total.cost + day.cost,
      requests: total.requests + day.requests,
    }), { tokens: 0, cost: 0, requests: 0 });
    return {
      version: 1,
      fetchedAt: Date.now(),
      source: { browser: 'Microsoft Edge', profile: 'Platform web session', url: location.href },
      currency: current?.currency || (all.models.length > 0 ? 'CNY' : 'CNY'),
      balance,
      allTime: all.allTime,
      today: current?.today ?? { ...todayFromHistory, cost: Number(todayFromHistory.cost.toFixed(8)), costAvailable: all.days.length > 0 },
      last30Days: current?.last30Days ?? { ...last30FromHistory, cost: Number(last30FromHistory.cost.toFixed(8)), costAvailable: all.days.length > 0 },
      apiKeyCount: all.keys.length,
      topModel: all.models[0]?.model ?? current?.models[0]?.model ?? null,
      keys: all.keys,
      models: all.models,
      daily: all.days,
      coverage: { ...all.coverage, complete: !scanning && all.coverage.complete === true },
      syncErrors: errors,
    };
  }

  async function postSnapshot(snapshot) {
    const response = await fetch(BRIDGE_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-dsh-bridge-token': BRIDGE_TOKEN },
      body: JSON.stringify(snapshot),
    });
    if (!response.ok) throw new Error(`bridge HTTP ${response.status}`);
  }

  async function refresh() {
    if (refreshing) return;
    refreshing = true;
    const errors = [];
    try {
      const window = currentMonthWindow();
      const query = `start=${window.start}&end=${window.end}&tz=${window.tz}`;
      let current = null;
      try {
        const [amount, cost] = await Promise.all([
          getJSON(`/api/v0/usage/by_api_key/amount?${query}`),
          getJSON(`/api/v0/usage/by_api_key/cost?${query}`),
        ]);
        current = parseWindow(amount, cost);
      } catch (error) {
        errors.push(`30d: ${String(error)}`);
      }
      let balance = null;
      try {
        balance = await collectBalance();
      } catch (error) {
        errors.push(`balance: ${String(error)}`);
      }
      if (current !== null) {
        const preliminary = makeSnapshot(
          {
            allTime: { ...current.last30Days, costAvailable: true },
            days: current.daily,
            keys: current.keys,
            models: current.models,
            coverage: { from: current.daily[0]?.date ?? '', to: current.daily.at(-1)?.date ?? '', months: 1, complete: false },
          },
          current,
          balance,
          errors,
          true,
        );
        try { await postSnapshot(preliminary); } catch (error) { console.warn('[DSH bridge] preliminary post failed', String(error)); }
      }
      const all = await collectAllTime(current, (partial) => {
        const snapshot = makeSnapshot(partial, current, balance, [...errors, ...partial.errors], true);
        void postSnapshot(snapshot).catch((error) => console.warn('[DSH bridge] progress post failed', String(error)));
      });
      const finalErrors = [...errors, ...all.errors];
      const snapshot = makeSnapshot(all, current, balance, finalErrors, false);
      await postSnapshot(snapshot);
      console.info('[DSH bridge] official usage sent', { tokens: snapshot.allTime.tokens, cost: snapshot.allTime.cost, errors: finalErrors.length, complete: snapshot.coverage.complete });
    } catch (error) {
      console.warn('[DSH bridge] sync failed', String(error));
    } finally {
      refreshing = false;
    }
  }

  async function start() {
    try {
      await refresh();
    } catch (error) {
      console.warn('[DSH bridge] initial sync failed', String(error));
    }
    setInterval(() => void refresh(), REFRESH_MS);
  }

  if (document.visibilityState === 'visible') void start();
  else {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        document.removeEventListener('visibilitychange', onVisible);
        void start();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
  }
})();
