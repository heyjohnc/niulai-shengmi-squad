import { createHash } from "node:crypto";
import { AGENT_IDS } from "../../config/public-identity.mjs";

function bitFor(seed, role) {
  const digest = createHash("sha256").update(`fixture-v1:${seed}:${role}`).digest();
  return digest[0] & 1;
}

export function freezeRandomVotes(seed) {
  if (typeof seed !== "string" || seed.length < 3) throw new Error("INVALID_FIXTURE_SEED");
  const votes = AGENT_IDS.map((role) => {
    const draw = bitFor(seed, role);
    return Object.freeze({
      role,
      probability: 0.5,
      draw,
      vote: draw === 1 ? "BUY" : "PASS",
      decision_basis: "RANDOM_ONLY"
    });
  });
  const buyVotes = votes.filter((vote) => vote.vote === "BUY").length;
  return Object.freeze({
    vote_finalized: true,
    decision_basis: "RANDOM_ONLY",
    external_features_used: false,
    threshold: 3,
    votes: Object.freeze(votes),
    buy_votes: buyVotes,
    decision: buyVotes >= 3 ? "PAPER_BUY" : "OBSERVE_ONLY"
  });
}
