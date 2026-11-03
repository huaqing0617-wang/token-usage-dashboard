/**
 * Host half of the Token Usage Dashboard.
 *
 * It folds every durable `assistant/message` usage sample in the profile into
 * a small in-memory account, keeps it current from the live `session/event`
 * feed, and serves the result on an authenticated exact Fetch route. The
 * browser half never reads Session logs; it only renders this snapshot.
 */

import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { UsageAggregator } from './usage.js';
import { startBridge } from './bridge.js';

const ROUTE = '/api/token-usage-dashboard';
const SCAN_CONCURRENCY = 4;
const ROUTE_READY_TIMEOUT_MS = 6000;
const BALANCE_CACHE_MS = 60000;
const PROVIDERS_CACHE_MS = 120000;
const OFFICIAL_STALE_MS = 2 * 60000;
const EDGE_BIN = '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge';
const PLATFORM_USAGE_URL = 'https://platform.deepseek.com/usage';
const execFileAsync = promisify(execFile);

/** Services required before the route can be registered and the scan can start. */
export const inject = ['connection', 'sessionQuery'];

/** JSON response with response-buffering disabled by the browser and proxies. */
function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}

/**
 * Host plugin body.
 * @param {object} ctx Cordis context carrying Connection and Session Query.
 */
export function apply(ctx) {
  const aggregator = new UsageAggregator();
  const scanController = new AbortController();
  const logger = ctx.logger;
  let officialSnapshot = null;
  let balanceCache = { at: 0, value: null, error: null };
  let balanceInflight;
  let providersCache = { at: 0, value: null, error: null };
  let officialLaunchAttempted = false;

  /** Keep the Edge content-script context available without requiring a manual launch. */
  const ensureOfficialBrowser = async () => {
    if (process.platform !== 'darwin' || officialLaunchAttempted) return;
    if (officialSnapshot !== null && Date.now() - officialSnapshot.receivedAt < OFFICIAL_STALE_MS) return;
    officialLaunchAttempted = true;
    let running = false;
    try {
      await execFileAsync('pgrep', ['-x', 'Microsoft Edge']);
      running = true;
    } catch {
      running = false;
    }
    try {
      if (running) {
        // User already has Edge open. Open a background tab without activating
        // the app; do not hide the user's existing browser.
        await execFileAsync('open', ['-g', '-a', 'Microsoft Edge', PLATFORM_USAGE_URL]);
      } else {
        // DSH owns this launch, so start Edge with background throttling off
        // and hide the app after its Platform page has loaded.
        const child = spawn(
          EDGE_BIN,
          [
            '--disable-background-timer-throttling',
            '--disable-renderer-backgrounding',
            '--disable-backgrounding-occluded-windows',
            '--no-first-run',
            PLATFORM_USAGE_URL,
          ],
          { detached: true, stdio: 'ignore' },
        );
        child.unref();
        await new Promise((resolve) => setTimeout(resolve, 4000));
        await execFileAsync('osascript', [
          '-e',
          'tell application "System Events" to set visible of process "Microsoft Edge" to false',
        ]);
      }
    } catch (error) {
      logger?.warn?.(`token-usage-dashboard: could not start the background Platform browser: ${String(error)}`);
    }
  };

  ctx.effect(
    () => {
      const timer = setTimeout(() => {
        if (officialSnapshot === null) void ensureOfficialBrowser();
      }, 35000);
      return () => clearTimeout(timer);
    },
    'token-usage-dashboard: automatic official browser',
  );

  /** Start the loopback ingest used by the Edge bridge extension. */
  ctx.effect(
    () => {
      let bridge;
      let disposed = false;
      void startBridge({
        logger,
        onSnapshot: (snapshot) => {
          if (!disposed) officialSnapshot = snapshot;
        },
      })
        .then((server) => {
          if (disposed) {
            void server.close();
            return;
          }
          bridge = server;
        })
        .catch((error) => {
          logger?.warn?.(`token-usage-dashboard: official bridge unavailable on 127.0.0.1:17654: ${String(error)}`);
        });
      return () => {
        disposed = true;
        if (bridge !== undefined) void bridge.close();
      };
    },
    'token-usage-dashboard: official browser bridge',
  );

  /** Resolve the public API-key balance as a fallback when the bridge is down. */
  const readApiKeyBalance = async () => {
    const now = Date.now();
    if (balanceCache.at !== 0 && now - balanceCache.at < BALANCE_CACHE_MS) return balanceCache;
    if (balanceInflight !== undefined) return balanceInflight;
    balanceInflight = (async () => {
      try {
        const credentials = ctx.get('credentials');
        const hit = await credentials?.resolve('DEEPSEEK_API_KEY');
        if (hit === undefined || hit.value.length === 0) {
          return { at: Date.now(), value: null, error: '未配置 DEEPSEEK_API_KEY' };
        }
        const response = await fetch('https://api.deepseek.com/user/balance', {
          headers: { authorization: `Bearer ${hit.value}`, accept: 'application/json' },
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) throw new Error(`balance endpoint returned HTTP ${response.status}`);
        const payload = await response.json();
        const wallets = Array.isArray(payload?.balance_infos)
          ? payload.balance_infos.map((wallet) => ({
              currency: String(wallet?.currency ?? ''),
              normal: Number(wallet?.topped_up_balance) || 0,
              bonus: Number(wallet?.granted_balance) || 0,
              total: Number(wallet?.total_balance) || 0,
            }))
          : [];
        return {
          at: Date.now(),
          value: {
            source: 'api-key',
            fetchedAt: Date.now(),
            isAvailable: payload?.is_available === true,
            wallets,
          },
          error: null,
        };
      } catch (error) {
        return { at: Date.now(), value: null, error: String(error) };
      }
    })().finally(() => {
      balanceInflight = undefined;
    });
    return balanceInflight;
  };

  /** Read the local LLM registry so the provider/model list does not depend on Remote. */
  const readLocalProviders = async () => {
    const now = Date.now();
    if (providersCache.at !== 0 && now - providersCache.at < PROVIDERS_CACHE_MS) return providersCache;
    try {
      const llm = ctx.get('llm');
      if (llm === undefined) {
        return { at: Date.now(), value: { providers: [], failures: [] }, error: 'LLM 服务未挂载' };
      }
      const registered = llm.listProviders().map((provider) => ({
        id: String(provider.id ?? ''),
        name: String(provider.displayName ?? provider.name ?? provider.id ?? ''),
      }));
      const providers = [];
      const failures = [];
      for (const provider of registered) {
        try {
          const models = await Promise.race([
            llm.listModels(provider.id),
            new Promise((_, reject) => setTimeout(() => reject(new Error('model listing timed out')), 5000)),
          ]);
          providers.push({
            id: provider.id,
            name: provider.name,
            models: models.map((model) => ({
              id: String(model.id ?? ''),
              name: String(model.name ?? model.id ?? ''),
              contextWindow: Number(model.contextWindow) || undefined,
            })),
          });
        } catch (error) {
          failures.push({ id: provider.id, name: provider.name, error: String(error) });
        }
      }
      return {
        at: Date.now(),
        value: { providers, failures },
        error: failures.length === registered.length && registered.length > 0 ? '所有模型目录读取失败' : null,
      };
    } catch (error) {
      return { at: Date.now(), value: { providers: [], failures: [] }, error: String(error) };
    }
  };
  /** Read every stored Session once, in bounded concurrency, into the aggregator. */
  const scan = async () => {
    aggregator.startScan(0);
    try {
      const sessions = await ctx.sessionQuery.listSessions(scanController.signal);
      aggregator.startScan(sessions.length);
      let next = 0;
      const worker = async () => {
        for (;;) {
          if (scanController.signal.aborted) return;
          const index = next;
          next += 1;
          if (index >= sessions.length) return;
          const session = sessions[index];
          let lease;
          try {
            lease = await ctx.sessionQuery.observeSession(session.header.id, {
              projectionMode: 'none',
              signal: scanController.signal,
            });
            const inherited = lease.inheritedEventCount ?? 0;
            for (const event of lease.events) aggregator.ingest(session.header.id, event, inherited);
            aggregator.finishSession(true);
          } catch (error) {
            if (!scanController.signal.aborted) {
              aggregator.finishSession(false, error);
              logger?.warn?.(`token-usage-dashboard: could not read session "${session.header.id}": ${String(error)}`);
            }
          } finally {
            try {
              lease?.[Symbol.dispose]?.();
            } catch {
              // A failed lease release must not invalidate the usage already counted.
            }
          }
        }
      };
      await Promise.all(
        Array.from({ length: Math.min(SCAN_CONCURRENCY, Math.max(1, sessions.length)) }, () => worker()),
      );
      aggregator.finishScan(scanController.signal.aborted ? new Error('scan aborted') : undefined);
    } catch (error) {
      aggregator.finishScan(error);
      if (!scanController.signal.aborted) {
        logger?.warn?.(`token-usage-dashboard: session scan failed: ${String(error)}`);
      }
    }
  };

  ctx.effect(
    () =>
      ctx.on('session/event', (session, event) => {
        try {
          aggregator.ingest(session.id, event, session.inheritedEventCount ?? 0);
        } catch (error) {
          logger?.warn?.(`token-usage-dashboard: live usage ingest failed: ${String(error)}`);
        }
      }),
    'token-usage-dashboard: live usage ingest',
  );

  ctx.effect(
    () =>
      ctx.connection.fetch.register({
        path: ROUTE,
        methods: ['GET'],
        requestBody: 'buffered',
        fetch: async () => {
          const [_, balance, providers] = await Promise.all([
            aggregator.waitReady(ROUTE_READY_TIMEOUT_MS),
            readApiKeyBalance(),
            readLocalProviders(),
          ]);
          const snapshot = aggregator.snapshot();
          // Keep the legacy local `cost` spelling in addition to `costUsd` so
          // already-open clients render the fallback cost while they update.
          snapshot.today.cost = snapshot.today.costUsd;
          snapshot.total.cost = snapshot.total.costUsd;
          snapshot.balance = balance.value;
          snapshot.balanceError = balance.error;
          snapshot.providers = providers.value;
          snapshot.providersError = providers.error;
          snapshot.official = officialSnapshot;
          const age = officialSnapshot === null ? null : Date.now() - officialSnapshot.receivedAt;
          snapshot.officialStatus =
            officialSnapshot === null ? 'disconnected' : age > OFFICIAL_STALE_MS ? 'stale' : 'ready';
          snapshot.officialAgeMs = age;
          snapshot.officialError =
            officialSnapshot === null
              ? '官方桥接未连接：请安装并打开 Edge 桥接扩展'
              : age > OFFICIAL_STALE_MS
                ? '官方桥接已停止更新：请打开 platform.deepseek.com 页面'
                : null;
          snapshot.bridgePort = 17654;
          return jsonResponse(snapshot);
        },
      }),
    'token-usage-dashboard: authenticated usage route',
  );

  // Start after the live listener and the route exist: an event that lands
  // during the cold scan is then captured either by the scan or by the feed.
  ctx.effect(
    () => {
      void scan();
      return () => scanController.abort();
    },
    'token-usage-dashboard: session usage scan',
  );
}
