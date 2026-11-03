# DSH Official Usage Bridge (Edge extension)

This unpacked Manifest V3 extension lets the local DSH dashboard read the
official DeepSeek Platform ledger through the already-signed-in browser page.
It runs only on `https://platform.deepseek.com/*` and posts to
`http://127.0.0.1:17654`; it never sends account data to any other server.

The Platform usage endpoints sit behind an AWS WAF JavaScript challenge. A Node
process cannot pass that challenge even with a valid `userToken`, so the
browser is the only reliable place to fetch this data.

## Install once

1. Open `edge://extensions` in Microsoft Edge.
2. Enable **Developer mode**.
3. Choose **Load unpacked** and select this `edge-bridge` folder.
4. Keep a `https://platform.deepseek.com/usage` tab open. The extension polls the
   current 30-day window every 30 seconds. It walks backward in consecutive
   30-day windows for the all-time history, retries WAF challenges with
   exponential backoff, and posts progressive snapshots while the scan runs.
   After the first scan, historical windows are cached for six hours.
5. Open the DSH dashboard. The footer badge should switch from **本机** to
   **官方**.

The extension fetches:

- `/api/v0/users/get_user_summary` — balance wallets.
- `/api/v0/usage/by_api_key/amount` and `/cost` for consecutive 30-day windows —
  all-time totals, per-key usage, requests, spend, and model totals.
- The Platform's monthly aggregate endpoints are intentionally not used: they
  are the ones the WAF challenged during the first live run.

## Remove

Disable or remove the extension in `edge://extensions`; the DSH dashboard falls
back to local-only stats. The extension stores only a small per-window cache in
`chrome.storage.local`; no token is written by this extension.
