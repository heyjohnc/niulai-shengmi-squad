# Contributing

## Development setup

```bash
npm ci
npm test
npm run validate
npm run demo
```

Keep the default path offline and deterministic. Do not require credentials, network access or a wallet for any required command.

## Invariants

- Keep exactly four voting Agents: 云雀、牛来、牛来妈妈、豹拉.
- Freeze all four `RANDOM_ONLY` votes before model work.
- Keep execution `PAPER_ONLY`; the safety lab remains `INJECTED_FAKE_ONLY`.
- Keep the API GET-only and the UI free of mutation controls.
- Generate fixtures from this repository's deterministic code; never import private or live payloads.
- Preserve source, observed time, freshness and claim type for substantive evidence.
- Keep public projection stripping tests.
- Do not add third-party visual assets without an explicit license and content-boundary review.

## Pull request evidence

State the objective, scope, non-goals, tests run, claim states changed, known limitations and contribution boundary. A passing test does not imply deployment, live validation, Owner acceptance or public-release approval.

Before review, run `git diff --check`, the full test suite, validate, demo and the local browser checks described in `docs/VERIFICATION.md`.
