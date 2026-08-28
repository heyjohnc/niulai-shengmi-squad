import test from "node:test";
import assert from "node:assert/strict";
import { AGENT_IDS } from "../config/public-identity.mjs";
import { freezeRandomVotes } from "../src/core/random-vote.mjs";
import { buildDemo } from "../src/core/workflow.mjs";

test("the public product has exactly four stable agents", () => {
  assert.deepEqual(AGENT_IDS, ["YUNQUE", "NIULAI", "NIULAI_MAMA", "BAOLA"]);
});

test("random votes are deterministic for the same seed", () => {
  assert.deepEqual(freezeRandomVotes("buy-4"), freezeRandomVotes("buy-4"));
});

test("every role receives exactly one independent 50 percent draw", () => {
  const round = freezeRandomVotes("buy-4");
  assert.equal(round.votes.length, 4);
  assert.equal(new Set(round.votes.map((vote) => vote.role)).size, 4);
  assert.ok(round.votes.every((vote) => vote.probability === 0.5));
});

test("the buy fixture reaches the three-of-four threshold", async () => {
  const { public: demo } = await buildDemo({ kind: "paper-tp" });
  assert.equal(demo.vote_round.buy_votes, 3);
  assert.equal(demo.vote_round.decision, "PAPER_BUY");
});

test("the observation fixture stays below three votes", async () => {
  const { public: demo } = await buildDemo({ kind: "observe-boomerang" });
  assert.ok(demo.vote_round.buy_votes < 3);
  assert.equal(demo.vote_round.decision, "OBSERVE_ONLY");
});

test("a paper TP closes at or above the frozen threshold", async () => {
  const { public: demo } = await buildDemo({ kind: "paper-tp" });
  assert.equal(demo.outcome.type, "TP");
  assert.ok(demo.outcome.return_bps >= 10000);
  assert.equal(demo.outcome.paper_only, true);
});

test("a paper SL closes at or below the frozen threshold", async () => {
  const { public: demo } = await buildDemo({ kind: "paper-sl", forceTerminal: "SL" });
  assert.equal(demo.outcome.type, "SL");
  assert.ok(demo.outcome.return_bps <= -6000);
});

test("the observation fixture never creates a paper position", async () => {
  const { public: demo } = await buildDemo({ kind: "observe-boomerang" });
  assert.equal(demo.paper_position, null);
  assert.equal(demo.outcome.paper_position_opened, false);
});

test("all fixtures explicitly declare synthetic and fixture-only mode", async (t) => {
  for (const kind of ["paper-tp", "paper-sl", "observe-boomerang"]) {
    await t.test(kind, async () => {
      const { public: demo } = await buildDemo({ kind, forceTerminal: kind === "paper-sl" ? "SL" : "TP" });
      assert.equal(demo.synthetic, true);
      assert.equal(demo.fixture_only, true);
      assert.equal(demo.data_mode, "FIXTURE_ONLY");
    });
  }
});

test("candidate FACT, INFERENCE and OPEN_QUESTION are all present", async () => {
  const { public: demo } = await buildDemo();
  const types = demo.timeline[0].evidence.map((item) => item.claim_type);
  assert.deepEqual(types, ["FACT", "INFERENCE", "OPEN_QUESTION"]);
});

test("sourced claims carry observation time and freshness", async () => {
  const { public: demo } = await buildDemo();
  for (const claim of demo.evidence) {
    assert.match(claim.observed_at, /^\d{4}-\d{2}-\d{2}T/);
    assert.equal(typeof claim.freshness_seconds, "number");
    assert.equal(claim.source.synthetic, true);
  }
});

test("every canonical event carries a synthetic source, observed time and freshness", async () => {
  const { public: demo } = await buildDemo();
  assert.ok(demo.timeline.every((item) => item.source.provider === "SYNTHETIC_FIXTURE_GENERATOR"));
  assert.ok(demo.timeline.every((item) => item.source.synthetic === true && item.source.fixture_only === true));
  assert.ok(demo.timeline.every((item) => Number.isInteger(item.source.freshness_seconds) && item.source.freshness_seconds >= 0));
  assert.ok(demo.timeline.every((item) => !Number.isNaN(Date.parse(item.source.observed_at))));
});

test("canonical timeline sequence is contiguous", async () => {
  const { public: demo } = await buildDemo();
  assert.deepEqual(demo.timeline.map((item) => item.sequence), Array.from({ length: demo.timeline.length }, (_, index) => index + 1));
});

test("all four roles produce local fallback lines after the result", async () => {
  const { public: demo } = await buildDemo();
  const lines = demo.timeline.filter((item) => item.kind === "FALLBACK_ROLE_LINE");
  assert.deepEqual(lines.map((item) => item.role), AGENT_IDS);
  assert.ok(lines.every((item) => item.model.mode === "LOCAL_TEMPLATE"));
});

test("public projection removes private fixture fields recursively", async () => {
  const { internal, public: visible } = await buildDemo();
  assert.ok(internal._private);
  assert.equal("_private" in visible, false);
  assert.equal(JSON.stringify(visible).includes("internal_seed"), false);
});

test("the default fixture has no wallet, network, or frontend mutation authority", async () => {
  const { public: demo } = await buildDemo();
  assert.deepEqual(demo.authority, {
    model_may_vote: false,
    model_may_execute: false,
    frontend_may_mutate: false,
    wallet_present: false,
    network_required: false
  });
});
