# Fan reward governance design

> Public claim state: `DESIGN_DOCUMENTED / PUBLIC_REPO_CODE_NOT_INCLUDED / BROADER_PROJECT_ACTION_LOCKED_PREPARATION_REPORTED / REAL_PAYOUT_NOT_VALIDATED`

This document discloses a sanitized design for distributing a future community treasury to contributors. It is intentionally separate from the market-story demo and from the fake-only execution safety lab.

The broader project reports an implemented and fixture-tested preparation layer. That implementation is not copied into this clean-room repository, so readers can review the design and boundaries here but cannot independently reproduce the broader implementation from this repository alone.

## Problem

Sending part of project revenue to one community treasury does not answer four harder questions:

1. Which contribution is eligible?
2. Which public recipient address belongs to that contribution?
3. How much may one person, one round and one campaign receive?
4. What evidence and decision authorized the exact payout list?

A payout system that accepts free-form model output, market votes or an arbitrary transaction target would mix presentation, trading and treasury authority. The design therefore creates a separate evidence-and-governance lane before any future execution layer.

## Separate decision lane

The market demo in this repository uses `RANDOM_ONLY` votes for fictional paper positions. Those votes must never authorize a treasury payout.

Fan rewards use a different decision type:

- decision basis: `CONTRIBUTION_EVIDENCE_ONLY`;
- voters: exactly the same four named Agents, one structured vote each;
- threshold: at least three of four approvals;
- model-generated or random votes: forbidden;
- free-form dialogue: presentation only, never an amount or recipient authority.

Fans are contributors and possible recipients in the current design; they are not the voters. A community-member voting product would be a separate future feature with its own identity, anti-abuse, privacy and appeal model.

## Proposed workflow

```text
public contribution FACT
  → canonical contributor + recipient + amount proposal
  → evidence freshness and per-person / per-round / campaign caps
  → deterministic evidence, payout and proposal digests
  → Merkle commitment and per-recipient proof
  → four structured CONTRIBUTION_EVIDENCE_ONLY votes
  → at least 3/4 approval
  → action-locked exact reward-token transfer intents
  → fresh public-chain code / balance / nonce / simulation preflight
  → STOP: no signing or broadcast authority in the current layer
```

Every approved payout remains bound to its evidence set, contributor identifier, recipient, amount, campaign, round, token and treasury identity. Changing any bound field produces a different commitment and invalidates the reviewed plan.

## What the broader project reports as implemented

The non-public implementation is reported to contain:

- strict policy, proposal, finalized-round and transfer-plan contracts;
- public contribution `FACT` records with source, observation time and freshness;
- unique contributor and recipient checks;
- positive integer token amounts and explicit person, round and campaign caps;
- canonical payout ordering, deterministic digests and Merkle proofs;
- four structured votes bound to the same proposal, evidence and payout digests;
- exact reward-token `transfer` intents with zero native value;
- public-chain checks for chain identity, reviewed token code, treasury balance, pending nonce, per-transfer simulation and gas limits;
- protected JSON preparation boundaries and a preview-only provider contract;
- fixture, Schema, fail-closed and adjacent launch validation.

The reported ready state is deliberately named `READY_ACTION_LOCKED`. It means the evidence and proposed calls are reviewable; it does not mean a wallet may sign or submit them.

## What this public repository contains

This clean-room repository contains only this design disclosure and its links from the public architecture, limitations, security and verification documents.

It does not contain:

- the fan-reward policy or implementation modules;
- a real treasury address, reward-token address or payout list;
- contributor identities, evidence records or vote records;
- a signer, provider credential, key path or wallet loader;
- signing, broadcast, transfer, claim or contract-deployment code;
- a real-chain preflight result, funded test or payout receipt.

The existing security scan applies to this document and rejects private paths, chain-address shapes, long transaction-style identifiers, credential material and live mutation primitives.

## What is still missing before a bounded real payout

The broader design is not “connect a signer and use it.” A bounded real round still requires all of the following:

1. Freeze the public treasury identity, final reward token, contribution rules, appeal policy, cadence and person/round/campaign caps.
2. Select and review an isolated protected provider that exposes only its public identity and narrow signing capability.
3. Add a permanent exactly-once execution journal with nonce ownership and immutable plan claims.
4. Reconcile every receipt and final token balance before declaring a recipient paid.
5. Handle partial success explicitly: confirmed earlier transfers stay recorded, ambiguous results stop the round, and no blind retry is allowed.
6. Add operator stop, recovery and alert behavior.
7. Complete a separately authorized low-value real-chain UAT and publish only sanitized results.

Ongoing automatic campaigns require another gate after that: a durable campaign-spend ledger, bounded scheduling, expiry, revocation, monitoring and explicit standing authority. A one-round executor must not silently become an unattended treasury service.

## Push versus claim

For a small recipient set, a protected executor could eventually submit a bounded sequence of exact transfers. This creates partial-success and nonce-recovery work.

For a larger recipient set, a separately reviewed Merkle-claim contract may be more appropriate. The current commitment format is intended to keep that direction possible, but a commitment is only data: it does not prove that a claim contract exists, is audited, is funded or is safe.

## Security boundary

- Raw key material never belongs in proposals, votes, fixtures, logs, this repository or model context.
- Public identity must be verified independently of a filename.
- The preparation layer cannot approve another token, arbitrary target or arbitrary call data.
- Random market votes, model dialogue, social activity and paper results have zero treasury authority.
- Three-of-four approval authorizes only an action-locked plan under the current claim state.
- Fixture tests, public documentation and a preview do not prove real payout safety.

## Claim summary

| Claim | State |
| --- | --- |
| Design and boundary are publicly documented | `YES` |
| Broader preparation implementation is reported code-present and tested | `REPORTED / NOT REPRODUCIBLE FROM THIS REPO` |
| Public clean-room implementation is included | `NO` |
| Real signer or payout executor is included | `NO` |
| Real-chain payout UAT has passed | `NOT_VALIDATED` |
| Standing automatic campaign is authorized | `NO` |
| Production or user adoption is proven | `NOT_VALIDATED` |

The purpose of publishing this design is to make the product direction and safety reasoning inspectable without publishing the private implementation, wallet material or operational evidence.
