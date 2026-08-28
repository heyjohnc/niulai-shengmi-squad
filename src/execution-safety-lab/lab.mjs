import { AtomicStateStore } from "./state-store.mjs";
import { InjectedFakeTransport } from "./fake-transport.mjs";

function frozenTerms() {
  return Object.freeze({
    schema_version: "lab-terms-v1",
    mode: "FAKE_ONLY",
    snapshot_version: "snapshot-v1",
    notional_units: 100,
    max_attempts: 2,
    retry_policy: "CONFIRMED_REVERT_ONCE_SAME_SNAPSHOT",
    mutation_permitted: false
  });
}

export async function runSafetyScenario({ id, outcomes, initialExposure = 0 }) {
  const transport = new InjectedFakeTransport(outcomes);
  const store = new AtomicStateStore({ revision: 0, phase: "IDLE", exposure_units: initialExposure });
  const writerId = `lab-writer-${id}`;
  const terms = frozenTerms();
  const journal = [];
  store.acquire(writerId);
  try {
    let state = store.snapshot();
    if (state.exposure_units !== 0) {
      state = store.commit(writerId, state.revision, {
        phase: "BLOCKED_NONZERO_EXPOSURE",
        terminal_status: "FAIL_CLOSED",
        operator_action_required: true,
        frozen_terms: terms
      });
      journal.push(state);
      return result(id, terms, store, transport, journal);
    }

    state = store.commit(writerId, state.revision, {
      phase: "ATTEMPT_1_RESERVED",
      frozen_terms: terms,
      terminal_status: null,
      operator_action_required: false
    });
    journal.push(state);
    const first = await transport.execute({ attempt: 1, snapshot_version: terms.snapshot_version });
    state = store.commit(writerId, state.revision, { phase: "ATTEMPT_1_OBSERVED", last_outcome: first.outcome });
    journal.push(state);

    if (first.outcome === "CONFIRMED_SUCCESS") {
      state = store.commit(writerId, state.revision, { phase: "CLOSED", terminal_status: "CONFIRMED_SUCCESS" });
      journal.push(state);
      return result(id, terms, store, transport, journal);
    }
    if (first.outcome === "PENDING" || first.outcome === "AMBIGUOUS") {
      state = store.commit(writerId, state.revision, {
        phase: "BLOCKED_MANUAL_REVIEW",
        terminal_status: first.outcome,
        operator_action_required: true
      });
      journal.push(state);
      return result(id, terms, store, transport, journal);
    }

    state = store.commit(writerId, state.revision, {
      phase: "ATTEMPT_2_RESERVED",
      retry_reason: "CONFIRMED_REVERT",
      retry_snapshot_version: terms.snapshot_version
    });
    journal.push(state);
    const second = await transport.execute({ attempt: 2, snapshot_version: terms.snapshot_version });
    state = store.commit(writerId, state.revision, { phase: "ATTEMPT_2_OBSERVED", last_outcome: second.outcome });
    journal.push(state);
    state = store.commit(writerId, state.revision, second.outcome === "CONFIRMED_SUCCESS"
      ? { phase: "CLOSED", terminal_status: "CONFIRMED_SUCCESS_AFTER_REVERT" }
      : { phase: "BLOCKED_MANUAL_REVIEW", terminal_status: second.outcome, operator_action_required: true });
    journal.push(state);
    return result(id, terms, store, transport, journal);
  } finally {
    store.release(writerId);
  }
}

function result(id, terms, store, transport, journal) {
  return Object.freeze({
    id,
    lab_mode: "INJECTED_FAKE_ONLY",
    transport: transport.kind,
    frozen_terms: terms,
    transport_calls: Object.freeze([...transport.calls]),
    journal: Object.freeze([...journal]),
    final_state: Object.freeze({ ...store.snapshot(), writer_lock: "ABSENT" }),
    safety: Object.freeze({
      signer_present: false,
      wallet_client_present: false,
      network_allowed: false,
      external_side_effect: false,
      single_writer_enforced: true,
      atomic_revision_enforced: true
    })
  });
}

export async function buildSafetyLab() {
  const scenarios = [
    ["confirmed-success", ["CONFIRMED_SUCCESS"], 0],
    ["confirmed-revert-then-success", ["CONFIRMED_REVERT", "CONFIRMED_SUCCESS"], 0],
    ["confirmed-revert-twice", ["CONFIRMED_REVERT", "CONFIRMED_REVERT"], 0],
    ["pending", ["PENDING"], 0],
    ["ambiguous", ["AMBIGUOUS"], 0],
    ["nonzero-exposure", ["CONFIRMED_SUCCESS"], 1]
  ];
  return Promise.all(scenarios.map(([id, outcomes, initialExposure]) => runSafetyScenario({ id, outcomes, initialExposure })));
}
