# Security Policy

## Supported scope

This repository is an offline reference implementation. Security support covers the current local fixture generator, fake-only safety lab, GET-only loopback server and static UI.

## Hard boundaries

- No wallet, signer, credential loader or external execution transport.
- No external network dependency in install, test, validate or demo.
- No login, publishing, messaging, launch or account automation.
- No production prompt, account configuration, private infrastructure path or real runtime data.
- The fan-reward document contains design and claim-state disclosure only; it adds no treasury input, signer, execution method or mutation endpoint.
- Non-GET requests are rejected.
- Static files are served from an explicit allowlist.
- CI does not receive secrets and does not deploy.

## Reporting a vulnerability

Use GitHub's private vulnerability-reporting channel when it is available. If that channel is unavailable, open a minimal public Issue that contains no exploit details or sensitive material and asks the maintainer for a private contact path. Never include credentials, private keys, personal data, account/session material or non-public infrastructure details. Reproduce the issue against synthetic fixtures whenever possible.

## Changes that require a new threat model

Adding any outbound network adapter, credential, wallet, signer, write endpoint, deployment target, user input persistence or external account integration is outside the validated scope. Such a change requires explicit Owner authorization, a new evidence batch, deny/allowlist review, tests and public-claim review.
