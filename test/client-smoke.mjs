import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../client.js', import.meta.url), 'utf8');
let registration;
const styleNodes = [];
const timers = [];
const listeners = [];
const React = {
  createElement(type, props, ...children) {
    return { type, props: props ?? {}, children };
  },
  useSyncExternalStore(_subscribe, getSnapshot) {
    return getSnapshot();
  },
};

const localToday = {
  tokens: 8_000, inputTokens: 100, outputTokens: 200, cacheReadTokens: 7_700, cacheWriteTokens: 0,
  costUsd: 0.02, pricedTokens: 8_000, unpricedTokens: 0, calls: 2, unpricedCalls: 0,
};
const localTotal = {
  tokens: 1_200_000, inputTokens: 10_000, outputTokens: 20_000, cacheReadTokens: 1_170_000, cacheWriteTokens: 0,
  costUsd: 9.88, pricedTokens: 1_000_000, unpricedTokens: 200_000, calls: 40, unpricedCalls: 2,
};
const payload = {
  version: 1, generatedAt: Date.now(), timeZone: 'Asia/Shanghai', todayKey: '2026-11-03',
  today: localToday, total: localTotal,
  byModel: [{ provider: 'deepseek-official', model: 'deepseek-flash', tokens: 1_200_000, costUsd: 9.88, calls: 40 }],
  pricing: { asOf: '2026-11-03', currency: 'USD', source: 'x' },
  scan: { ready: true, scanning: false, totalSessions: 38, completedSessions: 38, failedSessions: 0 },
  balance: { source: 'api-key', wallets: [{ currency: 'CNY', normal: 100, bonus: 5, total: 105 }] },
  balanceError: null,
  providers: {
    providers: [{ id: 'deepseek-official', name: 'DeepSeek API', models: [{ id: 'deepseek-flash', name: 'DeepSeek-V4.1-Flash' }] }],
    failures: [],
  },
  providersError: null,
  officialStatus: 'ready',
  officialError: null,
  official: {
    version: 1, fetchedAt: Date.now(), receivedAt: Date.now(),
    source: { browser: 'Microsoft Edge', profile: 'Platform web session', url: 'https://platform.deepseek.com/usage' },
    currency: 'CNY',
    balance: { wallets: [{ currency: 'CNY', normal: 100, bonus: 5, total: 105 }] },
    allTime: { tokens: 4_214_962_315, cost: 219.03, requests: 11540, costAvailable: true },
    today: { tokens: 100_000, cost: 1.5, requests: 3, costAvailable: true },
    last30Days: { tokens: 4_214_962_315, cost: 219.03, requests: 11540, costAvailable: true },
    apiKeyCount: 2, topModel: 'deepseek-flash',
    keys: [{ id: 'key-1', name: 'DSH main', tokens: 4_214_962_315, cost: 219.03, requests: 11540, models: ['deepseek-flash'] }],
    models: [{ model: 'deepseek-flash', tokens: 4_214_962_315, cost: 219.03 }],
    daily: [{ date: '2026-11-03', tokens: 100_000, cost: 1.5, requests: 3 }],
    coverage: { from: '2026-01-01', to: '2026-11-03', months: 11 },
  },
};

const sandbox = {
  console, AbortController, setTimeout, clearTimeout,
  setInterval(fn, ms) { timers.push({ fn, ms }); return timers.length; },
  clearInterval() {},
  navigator: { language: 'zh-CN' },
  fetch: async () => ({ ok: true, json: async () => payload }),
  document: {
    head: { append(node) { styleNodes.push(node); } },
    createElement() {
      return {
        dataset: {}, textContent: '',
        remove() { const at = styleNodes.indexOf(this); if (at !== -1) styleNodes.splice(at, 1); },
      };
    },
    addEventListener(type, fn) { listeners.push([type, fn]); },
    removeEventListener() {},
    visibilityState: 'visible',
  },
  window: {
    localStorage: { value: null, getItem() { return this.value; }, setItem(_k, v) { this.value = v; } },
    addEventListener(type, fn) { listeners.push([type, fn]); },
    removeEventListener() {},
  },
};
sandbox.window.__DSH_BOOT__ = { release: { version: '0.2.1-rc.5' } };
sandbox.window.__ModuleLoader__ = { load(value) { registration = value; } };
sandbox.globalThis = sandbox;
sandbox.__DSH_BOOT__ = sandbox.window.__DSH_BOOT__;

vm.runInNewContext(source, sandbox, { filename: 'client.js' });
if (registration?.id !== '@huaqing/dsh-token-usage-dashboard') throw new Error('client module did not register');
const mod = registration.factory((name) => {
  if (name === 'react') return React;
  throw new Error(`unexpected require ${name}`);
});
if (!Array.isArray(mod.inject)) throw new Error('missing inject');

const slots = [];
const ctx = {
  locale: {
    register() {},
    bind() { return (key) => key; },
    getSnapshot() { return { active: 'zh' }; },
  },
  effect(fn) { fn(); },
  slots: {
    inject(_key, callback) { callback(); },
    register(options, component) { slots.push({ options, component }); return () => {}; },
  },
};

mod.apply(ctx);
if (slots.length !== 2) throw new Error(`expected 2 slot registrations, got ${slots.length}`);
if (styleNodes.length !== 1) throw new Error('style was not mounted');
await new Promise((resolve) => setTimeout(resolve, 30));

function render(node) {
  if (node === null || node === undefined || node === false || node === true) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(render).join('');
  if (typeof node.type === 'function') return render(node.type(node.props));
  const children = node.children.length > 0 ? node.children : node.props?.children;
  return `<${node.type}>${children === undefined ? '' : (Array.isArray(children) ? children : [children]).map(render).join('')}</${node.type}>`;
}

const bottom = slots.find((slot) => slot.options.name === 'shell.bottom');
const overlay = slots.find((slot) => slot.options.name === 'shell.overlay');
if (bottom === undefined || overlay === undefined) throw new Error('slot names missing');
const bar = bottom.component({ t: (key) => key });
const store = bar.props.store;
let html = render(bar);
for (const expected of ['bar.badgeOfficial', 'bar.todayTokens', 'bar.balance', '4.21B', '¥219.03', '¥105.00']) {
  if (!html.includes(expected)) throw new Error(`bar missing ${expected}`);
}
if (!html.includes('bar.totalTokens')) throw new Error('bar total label missing');

store.setExpanded(true);
html = render(bottom.component({ t: (key) => key }));
for (const expected of [
  'details.officialTitle', 'details.localTitle', 'details.keys30', 'details.modelUsage',
  'deepseek-flash', 'DSH main', 'DeepSeek-V4.1-Flash', '¥219.03', 'details.bridgeReady',
]) {
  if (!html.includes(expected)) {
    console.error(html.slice(0, 9000));
    throw new Error(`details missing ${expected}`);
  }
}

store.setAlwaysOn(false);
if (render(bottom.component({ t: (key) => key })) !== '') throw new Error('bar should hide when always-on is off');
const launcher = overlay.component({ t: (key) => key });
const launcherHtml = render(launcher);
if (!launcherHtml.includes('bar.title') || !launcherHtml.includes('¥219.03')) throw new Error('launcher missing today content');

console.log(JSON.stringify({ ok: true, slots: slots.map((slot) => slot.options.name), timers: timers.map((timer) => timer.ms), styleMounted: styleNodes.length, barHtmlLength: html.length, launcher: launcherHtml }));
