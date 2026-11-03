# Verification

This document separates what was executed from what is still an assertion.

## Environment

- macOS, DeepSeek Harness desktop `0.2.1-rc.5`.
- Microsoft Edge with the unpacked `edge-bridge/` extension.
- Node.js 24 for the test suite (system test run; the runtime uses the Harness
  runtime).
- Date of the checks below: 2026-11-03.

## Automated Checks

Run from the repository root:

```bash
node --check index.js
node --check client.js
node --check usage.js
node --check pricing.js
node --check bridge.js
node --check edge-bridge/content.js
npm test
```

`npm test` runs:

- `test/bridge.test.mjs` — local ingest token gate, CORS/private-network
  preflight, snapshot normalization.
- `test/extension-smoke.mjs` — the real content script against a mocked Platform
  page: current window, one historical window, progressive snapshots, all-time
  aggregate, API key totals, models, balance, and the bridge POST.
- `test/client-smoke.mjs` — the real browser factory with official, local,
  balance, and provider fixtures: both slot registrations, style lifetime,
  5-second UI timer, official/local bar, expanded details, and collapsed
  launcher.

Observed result: all three smoke tests passed. These are Node-based tests; they
do not prove that the browser extension passes the live WAF or that the hidden
Edge window is hidden on a clean machine.

## Live Checks

The following were observed in the running installation:

- Direct Node requests to the Platform usage endpoints returned AWS WAF
  challenges (`202`, `x-amzn-waf-action: challenge`) even with a valid Platform
  user token.
- The signed-in Platform summary endpoint returned a valid account session from
  the Edge profile.
- The Host API-key fallback resolved a live CN¥ balance from
  `https://api.deepseek.com/user/balance`.
- Host provider discovery returned two providers and four models with zero
  failures.
- A POST to the loopback bridge returned HTTP `204` with the expected
  normalization.
- The Edge extension was loaded and the dashboard badge changed from `Local` to
  `Official`.
- The first live all-time attempt used monthly endpoints and received WAF
  challenges for older months. The collector was changed to consecutive 30-day
  by-key windows. The replacement is covered by the extension smoke test, but
  the final live all-time completion after reloading the extension has not been
  independently observed in this repository.

## Not Verified

- A clean Edge-closed cycle of the automatic hidden-Edge launch.
- Live completion of the all-time window scan after the collector replacement.
- GitHub-rendered Mermaid rendering. The diagrams use native fenced Mermaid and
  were reviewed as text, not rendered on GitHub.
- A GitHub Actions run. No workflow is included because the initial push token
  lacked the `workflow` scope; the repository makes no CI claim.
- Exact numerical agreement with the Platform web page. The fields and currency
  are official, but the page's own time range and the bridge's all-time windows
  are different views.

## Reproducing Local Checks

The smoke tests use synthetic fixtures and do not read the user's Platform
account, Session logs, cookies, API keys, or wallet balances. They can run on a
clean checkout with Node 24:

```bash
npm test
```

The dashboard's live path additionally requires a DSH desktop profile, a
signed-in Edge Platform session, and the unpacked bridge extension.
