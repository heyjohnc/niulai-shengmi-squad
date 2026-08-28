# Sanitized operations snapshot

This repository is still an offline clean-room reference. To show how its
boundaries behaved under a separate running system without copying that system,
the project publishes one frozen, field-allowlisted aggregate:

- Data: [`operations-snapshot-20260828.json`](operations-snapshot-20260828.json)
- Contract: [`operations-snapshot.schema.json`](../schemas/operations-snapshot.schema.json)
- Mode: `SANITIZED_AGGREGATE_FROM_PRIVATE_RUNTIME`
- Raw records included: `false`

## What the snapshot says

| Area | Frozen result |
| --- | ---: |
| Recorded run span | 210,454 seconds |
| Read-only polling ticks | 2,155 |
| Qualified candidate rounds | 111 |
| Four-person vote distribution (0/1/2/3/4 BUY) | 6 / 32 / 38 / 30 / 5 |
| Vote-integrity violations | 0 |
| Read-only chain verifications | 160 |
| Dialogue lines | 901 |
| Exactly unique dialogue lines | 870 (96.56%) |
| Primary / fallback / local route selections | 508 / 157 / 236 |
| Model-authority violations | 0 |
| Stored prompts / raw completions | 0 / 0 |

These are operational counts, not performance or business claims. The recorded
span is not an uptime measurement. Exact string uniqueness is not semantic
diversity. Route selection counts are not model-quality scores.

## Why latency and zero-message rates are not in this release

The source window crosses several runtime revisions. Publishing one blended
latency or delivery percentage as if it described the current revision would be
misleading. A later snapshot may add those metrics only after a stable revision
has a sufficiently large, explicitly bounded sample and the calculation method
is frozen beside the result.

## Disclosure boundary

The aggregate excludes raw timeline text, candidate and token identifiers,
wallet and chain identifiers, transaction and provider receipts, social/user
identities, prompts, completions, profit claims, strategy performance, host
configuration and credentials. It contains no production adapter or external
write capability.

The checked-in JSON is not reproducible from this public repository because the
raw source is intentionally not published. Tests verify arithmetic consistency,
the field allowlist and sensitive-shape exclusions; they do not turn the
aggregate into independently auditable raw telemetry.

## Update policy

Snapshots are immutable and date-stamped. A future refresh is a new file, not a
rewrite of this one. Every refresh must rerun the public security scan and must
keep fixture/fake evidence separate from sanitized runtime aggregates.
