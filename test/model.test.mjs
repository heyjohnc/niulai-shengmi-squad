import test from "node:test";
import assert from "node:assert/strict";
import { buildRoleRequest, generateRoleLine, validateRoleOutput } from "../src/model/contracts.mjs";
import { freezeRandomVotes } from "../src/core/random-vote.mjs";

const candidate = Object.freeze({ id: "fixture-case", name: "样例", symbol: "SAMPLE" });
const evidence = Object.freeze([{ claim_type: "FACT", text: "fixture fact", source_event_id: "event-001" }]);
const round = freezeRandomVotes("buy-4");

function request(role = "YUNQUE") {
  return buildRoleRequest({ role, caseId: candidate.id, candidate, voteRound: round, evidence, task: "POST_VOTE_LINE" });
}

test("model request is built only after votes are frozen", () => {
  assert.throws(() => buildRoleRequest({ role: "YUNQUE", caseId: "x", candidate, voteRound: {}, evidence, task: "POST_VOTE_LINE" }), /VOTES_MUST_BE_FROZEN/);
});

test("each role receives an isolated context id", () => {
  const ids = ["YUNQUE", "NIULAI", "NIULAI_MAMA", "BAOLA"].map((role) => request(role).context_id);
  assert.equal(new Set(ids).size, 4);
});

test("model safety contract denies vote, threshold, execution and publish authority", () => {
  assert.deepEqual(request().safety, {
    may_decide_vote: false,
    may_override_threshold: false,
    may_execute: false,
    may_publish: false
  });
});

test("provider-neutral output accepts a grounded inference", () => {
  const output = { role: "YUNQUE", claim_type: "INFERENCE", text: "候选很热，但票已经冻结。", source_event_ids: ["event-001"] };
  assert.equal(validateRoleOutput(output, request()).text, output.text);
});

test("provider-neutral output rejects role crossover", () => {
  assert.throws(() => validateRoleOutput({ role: "BAOLA", claim_type: "INFERENCE", text: "不行", source_event_ids: ["event-001"] }, request()), /MODEL_ROLE_CROSSOVER/);
});

test("provider-neutral output rejects FACT from dialogue", () => {
  assert.throws(() => validateRoleOutput({ role: "YUNQUE", claim_type: "FACT", text: "不行", source_event_ids: ["event-001"] }, request()), /MODEL_CLAIM_MUST_BE_INFERENCE/);
});

test("provider-neutral output rejects sources outside role context", () => {
  assert.throws(() => validateRoleOutput({ role: "YUNQUE", claim_type: "INFERENCE", text: "不行", source_event_ids: ["event-999"] }, request()), /MODEL_SOURCE_OUTSIDE_CONTEXT/);
});

test("missing provider selects MODEL_DISABLED local fallback", async () => {
  const line = await generateRoleLine({ request: request() });
  assert.equal(line.mode, "LOCAL_TEMPLATE");
  assert.equal(line.failure_code, "MODEL_DISABLED");
  assert.equal(line.model_invoked, false);
});

test("provider timeout falls back without changing the frozen vote", async () => {
  const before = structuredClone(round);
  const line = await generateRoleLine({ request: request(), timeoutMs: 5, provider: () => new Promise(() => {}) });
  assert.equal(line.failure_code, "MODEL_TIMEOUT");
  assert.deepEqual(round, before);
});

test("invalid provider output falls back safely", async () => {
  const line = await generateRoleLine({ request: request(), provider: async () => ({ text: "extra fields are missing" }) });
  assert.equal(line.failure_code, "MODEL_OUTPUT_INVALID");
  assert.equal(line.safety.may_execute, false);
});

test("valid provider output remains provider-neutral", async () => {
  const line = await generateRoleLine({
    request: request(),
    provider: async () => ({ role: "YUNQUE", claim_type: "INFERENCE", text: "我只接话，不改票。", source_event_ids: ["event-001"] })
  });
  assert.equal(line.mode, "PROVIDER_NEUTRAL");
  assert.equal(line.model_invoked, true);
});
