import { clone } from "../core/ids.mjs";

export class AtomicStateStore {
  #state;
  #writer = null;

  constructor(initialState = { revision: 0, phase: "IDLE", exposure_units: 0 }) {
    this.#state = Object.freeze(clone(initialState));
  }

  acquire(writerId) {
    if (this.#writer !== null) throw new Error("SINGLE_WRITER_LOCKED");
    this.#writer = writerId;
    return Object.freeze({ writer_id: writerId, acquired: true });
  }

  release(writerId) {
    if (this.#writer !== writerId) throw new Error("WRITER_LOCK_OWNERSHIP_MISMATCH");
    this.#writer = null;
  }

  snapshot() {
    return Object.freeze({ ...clone(this.#state), writer_lock: this.#writer === null ? "ABSENT" : "HELD" });
  }

  commit(writerId, expectedRevision, patch) {
    if (this.#writer !== writerId) throw new Error("WRITER_LOCK_REQUIRED");
    if (this.#state.revision !== expectedRevision) throw new Error("ATOMIC_REVISION_CONFLICT");
    this.#state = Object.freeze({ ...clone(this.#state), ...clone(patch), revision: expectedRevision + 1 });
    return this.snapshot();
  }
}
