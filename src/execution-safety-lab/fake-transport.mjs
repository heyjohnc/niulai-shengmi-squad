const OUTCOMES = new Set(["CONFIRMED_SUCCESS", "CONFIRMED_REVERT", "PENDING", "AMBIGUOUS"]);

export class InjectedFakeTransport {
  constructor(outcomes) {
    if (!Array.isArray(outcomes) || outcomes.length === 0 || outcomes.some((item) => !OUTCOMES.has(item))) {
      throw new Error("INVALID_FAKE_OUTCOMES");
    }
    this.kind = "INJECTED_FAKE_TRANSPORT";
    this.outcomes = [...outcomes];
    this.calls = [];
  }

  async execute(plan) {
    const outcome = this.outcomes[this.calls.length] ?? "AMBIGUOUS";
    this.calls.push(Object.freeze({ attempt: plan.attempt, snapshot_version: plan.snapshot_version, outcome }));
    return Object.freeze({ outcome, fake_receipt_id: `fake-receipt-${plan.attempt}` });
  }
}
