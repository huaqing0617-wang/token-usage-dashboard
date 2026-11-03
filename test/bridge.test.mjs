import assert from 'node:assert/strict';
import { BRIDGE_TOKEN, normalizeSnapshot, startBridge } from '../bridge.js';

let received;
const bridge = await startBridge({ port: 0, onSnapshot: (snapshot) => { received = snapshot; } });
const snapshot = {
  version: 1,
  fetchedAt: Date.now(),
  source: { browser: 'Microsoft Edge', profile: 'Platform web session', url: 'https://platform.deepseek.com/usage' },
  currency: 'CNY',
  balance: { wallets: [{ currency: 'CNY', normal: 100, bonus: 5, total: 105 }] },
  allTime: { tokens: 4214962315, cost: 219.03, requests: 11540, costAvailable: true },
  today: { tokens: 1000, cost: 1.5, requests: 3, costAvailable: true },
  last30Days: { tokens: 4214962315, cost: 219.03, requests: 11540, costAvailable: true },
  apiKeyCount: 2,
  topModel: 'deepseek-flash',
  keys: [{ id: 'key-1', name: 'key-1', tokens: 4214962315, cost: 219.03, requests: 11540, models: ['deepseek-flash'] }],
  models: [{ model: 'deepseek-flash', tokens: 4214962315, cost: 219.03 }],
  daily: [{ date: '2026-11-03', tokens: 1000, cost: 1.5, requests: 3 }],
  coverage: { from: '2026-01-01', to: '2026-11-03', months: 11 },
};
const response = await fetch(`http://127.0.0.1:${bridge.port}/api/official-usage/ingest`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-dsh-bridge-token': BRIDGE_TOKEN, origin: 'https://platform.deepseek.com' },
  body: JSON.stringify(snapshot),
});
assert.equal(response.status, 204);
assert.equal(received.allTime.tokens, 4214962315);
assert.equal(received.allTime.cost, 219.03);
assert.equal(received.balance.wallets[0].total, 105);
assert.equal(received.apiKeyCount, 2);
const bad = await fetch(`http://127.0.0.1:${bridge.port}/api/official-usage/ingest`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-dsh-bridge-token': 'wrong' },
  body: JSON.stringify(snapshot),
});
assert.equal(bad.status, 403);
const preflight = await fetch(`http://127.0.0.1:${bridge.port}/api/official-usage/ingest`, {
  method: 'OPTIONS',
  headers: { origin: 'https://platform.deepseek.com', 'access-control-request-private-network': 'true' },
});
assert.equal(preflight.status, 204);
assert.equal(preflight.headers.get('access-control-allow-origin'), 'https://platform.deepseek.com');
assert.equal(preflight.headers.get('access-control-allow-private-network'), 'true');
await bridge.close();
assert.equal(normalizeSnapshot(snapshot).version, 1);
console.log(JSON.stringify({ ok: true, port: bridge.port, received: received.allTime }));
