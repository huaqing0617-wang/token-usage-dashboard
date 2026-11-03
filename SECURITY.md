# Security Policy

## Supported Versions

Security fixes are applied to the current `main` branch and the `0.2.x` line.

## Reporting a Vulnerability

Please use GitHub's private vulnerability reporting on this repository
(**Security → Report a vulnerability**). Do not open a public issue for a
credential-leak or remote-code concern.

Include the affected file, a minimal reproduction, the observed impact, and
whether the issue is in the DSH Host, the browser bridge, or the Edge extension.
Do not include live API keys, Platform tokens, cookies, or wallet balances in
the report. Redact them.

## Data Boundaries

- The browser bridge reads the signed-in Platform usage page through the
  browser's existing session.
- The Platform token and cookies are not sent to DSH; only derived usage
  aggregates are posted to `127.0.0.1:17654`.
- The local bridge has a fixed ingest gate and accepts only loopback traffic.
  It is a local-only control, not a replacement for browser authentication.
- The dashboard route is authenticated by the DSH connection service.
- The public `/user/balance` fallback uses the Harness credential service and
  keeps the API key in the Host process.
- No credentials, tokens, cookies, or private Session content are committed to
  this repository.

## Scope

The project relies on private DeepSeek Platform dashboard endpoints that may
change without notice. Reports should distinguish a security vulnerability from
an upstream endpoint or WAF behavior change.
