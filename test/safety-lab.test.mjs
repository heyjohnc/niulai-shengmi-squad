import test from "node:test";
import assert from "node:assert/strict";
import { AtomicStateStore } from "../src/execution-safety-lab/state-store.mjs";
import { buildSafetyLab, runSafetyScenario } from "../src/execution-safety-lab/lab.mjs";

test("safety lab exposes all required outcome families", async () => {
  const lab = await buildSafetyLab();
  assert.deepEqual(lab.map((item) => item.id), ["confirmed-success", "confirmed-revert-then-success", "confirmed-revert-twice", "pending", "ambiguous", "nonzero-exposure"]);
});

test("confirmed success closes after one fake call", async () => {
  const result = await runSafetyScenario({ id: "ok", outcomes: ["CONFIRMED_SUCCESS"] });
  assert.equal(result.final_state.phase, "CLOSED");
  assert.equal(result.transport_calls.length, 1);
});

test("confirmed revert permits one retry on the same snapshot", async () => {
  const result = await runSafetyScenario({ id: "retry", outcomes: ["CONFIRMED_REVERT", "CONFIRMED_SUCCESS"] });
  assert.equal(result.transport_calls.length, 2);
  assert.equal(result.transport_calls[0].snapshot_version, result.transport_calls[1].snapshot_version);
  assert.equal(result.final_state.terminal_status, "CONFIRMED_SUCCESS_AFTER_REVERT");
});

test("a second confirmed revert fails closed", async () => {
  const result = await runSafetyScenario({ id: "twice", outcomes: ["CONFIRMED_REVERT", "CONFIRMED_REVERT"] });
  assert.equal(result.final_state.phase, "BLOCKED_MANUAL_REVIEW");
  assert.equal(result.transport_calls.length, 2);
});

test("pending never retries", async () => {
  const result = await runSafetyScenario({ id: "pending", outcomes: ["PENDING"] });
  assert.equal(result.transport_calls.length, 1);
  assert.equal(result.final_state.operator_action_required, true);
});

test("ambiguous never retries", async () => {
  const result = await runSafetyScenario({ id: "ambiguous", outcomes: ["AMBIGUOUS"] });
  assert.equal(result.transport_calls.length, 1);
  assert.equal(result.final_state.operator_action_required, true);
});

test("nonzero exposure blocks before fake transport", async () => {
  const result = await runSafetyScenario({ id: "exposure", outcomes: ["CONFIRMED_SUCCESS"], initialExposure: 2 });
  assert.equal(result.transport_calls.length, 0);
  assert.equal(result.final_state.terminal_status, "FAIL_CLOSED");
});

test("all safety lab scenarios remain injected-fake-only", async () => {
  const lab = await buildSafetyLab();
  assert.ok(lab.every((item) => item.lab_mode === "INJECTED_FAKE_ONLY" && item.transport === "INJECTED_FAKE_TRANSPORT"));
});

test("all safety lab scenarios have zero external side effects", async () => {
  const lab = await buildSafetyLab();
  assert.ok(lab.every((item) => item.safety.external_side_effect === false && item.safety.network_allowed === false));
});

test("writer lock rejects a second writer", () => {
  const store = new AtomicStateStore();
  store.acquire("one");
  assert.throws(() => store.acquire("two"), /SINGLE_WRITER_LOCKED/);
});

test("atomic state rejects a stale revision", () => {
  const store = new AtomicStateStore();
  store.acquire("one");
  store.commit("one", 0, { phase: "READY" });
  assert.throws(() => store.commit("one", 0, { phase: "STALE" }), /ATOMIC_REVISION_CONFLICT/);
});

test("the writer lock is reported absent at scenario completion", async () => {
  const result = await runSafetyScenario({ id: "lock", outcomes: ["CONFIRMED_SUCCESS"] });
  assert.equal(result.final_state.writer_lock, "ABSENT");
});

test("frozen terms are versioned and forbid mutation", async () => {
  const result = await runSafetyScenario({ id: "terms", outcomes: ["CONFIRMED_SUCCESS"] });
  assert.equal(result.frozen_terms.schema_version, "lab-terms-v1");
  assert.equal(result.frozen_terms.mutation_permitted, false);
});
