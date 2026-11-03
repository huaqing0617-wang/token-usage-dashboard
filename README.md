# Token Usage Dashboard

[![CI](https://github.com/huaqing0617-wang/token-usage-dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/huaqing0617-wang/token-usage-dashboard/actions/workflows/ci.yml)

A persistent DeepSeek Harness UI plugin with two data planes:

- **Official DeepSeek Platform** — every API key on the account, every device,
  all recorded time, with request counts, spend, balance, API keys, and models.
- **Local DSH** — this machine's Session logs and USD list-price estimate.

The official plane is fed by a small Edge bridge extension because DeepSeek's
private usage endpoints are protected by an AWS WAF JavaScript challenge. A Node
plugin cannot pass that challenge from a saved token; the browser page can.

## Where it appears

- The status bar occupies the full-width `shell.bottom` seat below the columns
  and stays visible across Chat, Files, Plugins, and other main panels.
- The bar shows today's tokens/spend, balance, all-time spend/tokens, and the
  connected API/model count. It prefers official data and shows a `官方` badge;
  before the bridge is connected it falls back to `本机`.
- **详情** expands an in-flow panel with:
  - official today/all-time cards, request counts, balance, API key count, and
    all-time model usage;
  - per-API-key usage for the last 30 days;
  - the local DSH today/lifetime breakdown and its provider/model registry.
- **常驻** hides the full bar and leaves a compact bottom-right pill; the choice
  persists in `localStorage`.

## Install / activate

This repository is a local DSH bundle plus a companion Edge extension. It is not
published to npm.

### 1. Install the DSH bundle from this checkout

From the repository root:

```bash
dsh plugin --profile desktop add "link:$PWD"
```

Approve the package entry if the DSH prompt asks, then select the new bundle if
it is not selected automatically. Quit and reopen DSH once.

### 2. One-time Edge bridge installation

1. Open `edge://extensions` in Microsoft Edge.
2. Enable **Developer mode**.
3. Choose **Load unpacked** and select this repository's `edge-bridge/` folder.
4. Keep a `https://platform.deepseek.com/usage` tab open while using the
   dashboard. If the tab was already open, reload it once after loading the
   extension.
5. Return to DSH. Within about one sync cycle the badge changes to `官方`.

The extension runs only on `platform.deepseek.com` and posts only to
`127.0.0.1:17654` with a local bridge token. It never exports the browser
credential to another server. The token is a loopback ingest gate, not a
GitHub or DeepSeek secret.

### 3. Restart DSH after changing code

The desktop shell does not hot-add a new browser bundle to an already-open
window. Quit and reopen DeepSeek Harness once after installation or an update:

```bash
osascript -e 'quit app "DeepSeek Harness"' && sleep 1 && open -a "DeepSeek Harness"
```

## How the official numbers are produced

The bridge content script runs in the signed-in Platform page, so its requests
carry the platform cookies and pass the AWS WAF challenge:

- `GET /api/v0/users/get_user_summary` — balance wallets.
- `GET /api/v0/usage/by_api_key/amount` and `/cost` with a 30-day window —
  per-key tokens, requests, and spend for the current window.
- `GET /api/v0/usage/by_api_key/amount` and `/cost` for consecutive 30-day
  windows — all-time totals, per-key totals, model totals, and request counts.

The extension walks backward in **30-day windows** until it sees three empty
windows (maximum 48 windows, covering four years), caches each window in
`chrome.storage.local`, refreshes the current window every 30 seconds, and posts
a preliminary snapshot immediately followed by progressively completed
all-time snapshots. This avoids the Platform's monthly aggregate endpoints,
which are the ones the WAF repeatedly challenged. The dashboard polls the Host
every 15 seconds.

If the bridge is not connected, the panel shows the installation instruction and
the bar uses local DSH values. The local plane is never removed.

## Balance and model providers

- Balance prefers the bridge's Platform summary. Without the bridge, the Host
  resolves `DEEPSEEK_API_KEY` through the Harness credential service and calls
  the public `https://api.deepseek.com/user/balance` endpoint. That path is
  verified to return the current CN¥ balance.
- Provider/model rows come from the Host `ctx.llm` registry, not the browser
  Remote that previously failed. The live check returned two providers and four
  models (`deepseek-official`: flash/pro; `bananaclwd`: two Claude routes).

## Data scope and caveats

- Official values are the Platform account ledger across **all API keys**, not
  just DSH. The current 30-day Platform page may show fewer or more rows than
  the all-time monthly aggregation because the page's range control is 30 days.
- Per-key rows and all-time totals come from the same consecutive 30-day
  windows and cover the full scan range.
- Local spend is a USD estimate at DeepSeek list prices and excludes
  Search/Fetch per-request fees. Local tokens exclude fork-inherited events.
- Official spend is in the Platform's currency (CNY for this account), not a
  converted estimate.

## Verification

- `node --check` covers every JavaScript file.
- `test/client-smoke.mjs` executes the real browser factory with official,
  local, balance, and provider fixtures; it confirms both slot registrations,
  the style lifetime, the 15-second refresh timer, the official/local bar,
  expanded API-key and model rows, and the collapsed launcher.
- `test/extension-smoke.mjs` runs the real bridge content script against a
  mocked Platform page and asserts all-time aggregation, today's values, API key
  count, model rows, balance, and the bridge POST.
- `test/bridge.test.mjs` verifies token gating, CORS/private-network preflight,
  and snapshot normalization.
- Live checks:
  - `GET /api/v0/users/get_user_summary` through the Edge profile returned the
    valid account session; the WAF challenge on the usage endpoints was
    confirmed as the reason a Node-only integration is insufficient.
  - The Host API-key balance path returned a live CN¥ balance.
  - Host provider discovery returned **2 providers / 4 models, 0 failures**.
  - A bridge POST to `127.0.0.1:17654` returned **204**.
  - The Edge extension was loaded live and the dashboard badge switched to
    **官方**. Its first all-time attempt used monthly endpoints and received
    WAF challenges for older months; the collector was changed to consecutive
    30-day by-key windows, which use the endpoint already proven live.
- The extension logic, including the new window collector and progressive
  snapshots, is covered by `test/extension-smoke.mjs`.

## Files

| File | Role |
|---|---|
| `index.js` | Host plugin: local scan, live ingest, API-key balance, host provider registry, bridge state, authenticated usage route |
| `client.js` | Browser UI, official/local data presentation, details, toggle, styles |
| `usage.js` | Local token accounting and day bucketing |
| `pricing.js` | Local USD estimate, peak/off-peak rule, holiday table |
| `bridge.js` | Loopback ingest server for the browser bridge |
| `edge-bridge/` | Manifest V3 Edge extension (content script) |
| `edge-bridge/content.js` | All-time monthly Platform scan, current 30-day key usage, balance, POST to bridge |
| `test/` | Client, extension, and bridge smoke tests |

## Sources

- [DeepSeek Models & Pricing](https://api-docs.deepseek.com/quick_start/pricing/)
- [Get User Balance](https://api-docs.deepseek.com/api/get-user-balance/)
- [2026 State Council holiday notice](https://www.gov.cn/gongbao/2025/issue_12406/202511/content_7048922.html)
