/**
 * Loopback ingest for the Edge bridge extension.
 *
 * DeepSeek's Platform usage endpoints sit behind an AWS WAF JavaScript
 * challenge, so a Node client cannot reliably call them even with a valid
 * userToken. The extension runs inside the already-logged-in Platform page,
 * fetches the official snapshot with browser cookies, and posts it here. This
 * server is loopback-only, accepts one shared token, and never stores the
 * browser credential.
 */

import { createServer } from 'node:http';

export const BRIDGE_PORT = 17654;
export const BRIDGE_TOKEN = 'dsh-official-bridge-9f4c1e6b7a2d8c5f4e3b1a0d9c8b7a6f';
export const BRIDGE_ORIGIN = 'https://platform.deepseek.com';
const MAX_BODY_BYTES = 4 * 1024 * 1024;

/** Validate and normalize the extension snapshot without trusting its shape. */
export function normalizeSnapshot(value, now = Date.now()) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error('snapshot must be an object');
  if (value.version !== 1) throw new Error('unsupported snapshot version');
  const number = (input) => (Number.isFinite(input) ? input : 0);
  const bucket = (input) => ({
    tokens: Math.max(0, Math.floor(number(input?.tokens))),
    cost: Math.max(0, number(input?.cost)),
    requests: Math.max(0, Math.floor(number(input?.requests))),
    costAvailable: input?.costAvailable === true,
  });
  const source = value.source !== null && typeof value.source === 'object' ? value.source : {};
  const wallets = Array.isArray(value.balance?.wallets)
    ? value.balance.wallets.slice(0, 8).map((wallet) => ({
        currency: String(wallet?.currency ?? ''),
        normal: number(wallet?.normal),
        bonus: number(wallet?.bonus),
        total: number(wallet?.total),
      }))
    : [];
  const keys = Array.isArray(value.keys)
    ? value.keys.slice(0, 200).map((key) => ({
        id: String(key?.id ?? 'unknown'),
        name: String(key?.name ?? ''),
        tokens: Math.max(0, Math.floor(number(key?.tokens))),
        cost: Math.max(0, number(key?.cost)),
        requests: Math.max(0, Math.floor(number(key?.requests))),
        models: Array.isArray(key?.models) ? key.models.slice(0, 50).map(String) : [],
      }))
    : [];
  const models = Array.isArray(value.models)
    ? value.models.slice(0, 200).map((model) => ({
        model: String(model?.model ?? 'unknown'),
        tokens: Math.max(0, Math.floor(number(model?.tokens))),
        cost: Math.max(0, number(model?.cost)),
      }))
    : [];
  const daily = Array.isArray(value.daily)
    ? value.daily.slice(-1200).map((day) => ({
        date: String(day?.date ?? ''),
        tokens: Math.max(0, Math.floor(number(day?.tokens))),
        cost: Math.max(0, number(day?.cost)),
        requests: Math.max(0, Math.floor(number(day?.requests))),
      }))
    : [];
  return {
    version: 1,
    fetchedAt: Number.isFinite(value.fetchedAt) ? value.fetchedAt : now,
    receivedAt: now,
    source: {
      browser: String(source.browser ?? 'Browser'),
      profile: String(source.profile ?? ''),
      url: String(source.url ?? ''),
    },
    currency: String(value.currency ?? 'CNY'),
    balance: { wallets },
    allTime: bucket(value.allTime),
    today: bucket(value.today),
    last30Days: bucket(value.last30Days),
    apiKeyCount: Math.max(0, Math.floor(number(value.apiKeyCount))),
    topModel: value.topModel === null || value.topModel === undefined ? null : String(value.topModel),
    keys,
    models,
    daily,
    coverage: {
      from: String(value.coverage?.from ?? ''),
      to: String(value.coverage?.to ?? ''),
      months: Math.max(0, Math.floor(number(value.coverage?.months))),
      complete: value.coverage?.complete === true,
    },
    syncErrors: Array.isArray(value.syncErrors) ? value.syncErrors.slice(0, 20).map(String) : [],
  };
}

/**
 * Mount the loopback bridge.
 * @param {{ onSnapshot: (snapshot: object) => void, logger?: object }} options
 * @returns {Promise<{ close: () => Promise<void>, port: number }>}
 */
export function startBridge(options) {
  const port = options.port ?? BRIDGE_PORT;
  const server = createServer((req, res) => {
    const requestOrigin = req.headers.origin;
    const allowedOrigin =
      requestOrigin === BRIDGE_ORIGIN || (typeof requestOrigin === 'string' && requestOrigin.startsWith('chrome-extension://'))
        ? requestOrigin
        : BRIDGE_ORIGIN;
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'content-type, x-dsh-bridge-token');
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
    res.setHeader('Cache-Control', 'no-store');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    if (req.method !== 'POST' || req.url !== '/api/official-usage/ingest') {
      res.writeHead(404);
      res.end();
      return;
    }
    if (req.headers['x-dsh-bridge-token'] !== BRIDGE_TOKEN) {
      res.writeHead(403);
      res.end();
      return;
    }

    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (size > MAX_BODY_BYTES) return;
      try {
        const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        options.onSnapshot(normalizeSnapshot(value));
        res.writeHead(204);
        res.end();
      } catch (error) {
        options.logger?.warn?.(`token-usage-dashboard bridge: rejected snapshot: ${String(error)}`);
        res.writeHead(400);
        res.end('invalid snapshot');
      }
    });
    req.on('error', () => {
      res.destroy();
    });
  });

  return new Promise((resolve, reject) => {
    const fail = (error) => {
      server.close();
      reject(error);
    };
    server.once('error', fail);
    server.listen(port, '127.0.0.1', () => {
      server.off('error', fail);
      const address = server.address();
      resolve({
        port: typeof address === 'object' && address !== null ? address.port : port,
        close: () =>
          new Promise((done) => {
            server.close(() => done());
            server.closeAllConnections?.();
          }),
      });
    });
  });
}
