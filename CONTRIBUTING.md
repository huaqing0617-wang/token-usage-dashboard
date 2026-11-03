# Contributing

Thanks for improving Token Usage Dashboard. Keep changes narrow and preserve the
two data-plane boundary: official Platform values and local DSH values must not
be silently merged.

## Before Opening a Pull Request

1. Open an issue for a behavior change or a new data source.
2. Run the local checks:

   ```bash
   npm test
   ```

3. Update the relevant document when changing a data source, endpoint, cache
   lifetime, or failure state:
   - `docs/architecture.md`
   - `docs/verification.md`
   - `README.md`

## Security and Privacy

- Never commit API keys, Platform tokens, cookies, Session logs, wallet
  balances, or private host paths.
- Keep test fixtures synthetic.
- Do not add analytics, tracking pixels, or third-party upload paths.
- Report credential or bridge concerns through the process in `SECURITY.md`,
  not a public issue.

## Scope

This repository is a local DSH bundle plus a browser bridge, not a hosted
service. Changes that require a new server, a public account endpoint, or an
unverified private Platform API must be discussed first.
