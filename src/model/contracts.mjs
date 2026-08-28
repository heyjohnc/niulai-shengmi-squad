import { AGENT_IDS, agentById } from "../../config/public-identity.mjs";

const TASKS = Object.freeze(["POST_VOTE_LINE", "TERMINAL_REACTION", "OBSERVATION_REACTION"]);

export function buildRoleRequest({ role, caseId, candidate, voteRound, evidence, task }) {
  if (!AGENT_IDS.includes(role)) throw new Error("MODEL_ROLE_NOT_ALLOWED");
  if (!TASKS.includes(task)) throw new Error("MODEL_TASK_NOT_ALLOWED");
  if (!voteRound?.vote_finalized || voteRound.decision_basis !== "RANDOM_ONLY") {
    throw new Error("VOTES_MUST_BE_FROZEN_BEFORE_MODEL");
  }
  return Object.freeze({
    schema_version: "1.0",
    context_id: `${caseId}:${role}`,
    role,
    task,
    candidate: Object.freeze({ id: candidate.id, name: candidate.name, symbol: candidate.symbol }),
    evidence: Object.freeze(evidence.map(({ claim_type, text, source_event_id }) => ({ claim_type, text, source_event_id }))),
    finalized_vote: voteRound.votes.find((vote) => vote.role === role),
    safety: Object.freeze({
      may_decide_vote: false,
      may_override_threshold: false,
      may_execute: false,
      may_publish: false
    })
  });
}

export function validateRoleOutput(output, request) {
  if (!output || typeof output !== "object" || Array.isArray(output)) throw new Error("MODEL_OUTPUT_NOT_OBJECT");
  const keys = Object.keys(output).sort().join(",");
  if (keys !== "claim_type,role,source_event_ids,text") throw new Error("MODEL_OUTPUT_SCHEMA_INVALID");
  if (output.role !== request.role) throw new Error("MODEL_ROLE_CROSSOVER");
  if (output.claim_type !== "INFERENCE") throw new Error("MODEL_CLAIM_MUST_BE_INFERENCE");
  if (typeof output.text !== "string" || output.text.trim().length < 2 || output.text.length > 120) {
    throw new Error("MODEL_TEXT_INVALID");
  }
  if (!Array.isArray(output.source_event_ids) || output.source_event_ids.length === 0) {
    throw new Error("MODEL_SOURCE_REQUIRED");
  }
  const allowed = new Set(request.evidence.map((item) => item.source_event_id));
  if (output.source_event_ids.some((id) => !allowed.has(id))) throw new Error("MODEL_SOURCE_OUTSIDE_CONTEXT");
  return Object.freeze({ ...output, text: output.text.trim() });
}

function fallbackText(role, task, candidate) {
  const name = agentById(role).name;
  const templates = {
    YUNQUE: `${name}：票已经封箱，我只负责把候选和来源摆清楚。`,
    NIULAI: `${name}：纸面结果照记，涨跌都别替我改口。`,
    NIULAI_MAMA: `${name}：先看时间线，再看谁的话会变成回旋镖。`,
    BAOLA: `${name}：问题先留着，结果出来再对账。`
  };
  const suffix = task === "TERMINAL_REACTION" ? ` ${candidate.symbol} 已到纸面终点。` : "";
  return `${templates[role]}${suffix}`;
}

export function localFallback(request, failureCode = "MODEL_DISABLED") {
  return Object.freeze({
    role: request.role,
    claim_type: "INFERENCE",
    text: fallbackText(request.role, request.task, request.candidate),
    source_event_ids: [request.evidence[0].source_event_id],
    mode: "LOCAL_TEMPLATE",
    failure_code: failureCode,
    model_invoked: false,
    safety: request.safety
  });
}

export async function generateRoleLine({ request, provider, timeoutMs = 200 }) {
  if (!provider) return localFallback(request);
  let timer;
  try {
    const result = await Promise.race([
      provider(request),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("MODEL_TIMEOUT")), timeoutMs);
      })
    ]);
    return Object.freeze({
      ...validateRoleOutput(result, request),
      mode: "PROVIDER_NEUTRAL",
      failure_code: null,
      model_invoked: true,
      safety: request.safety
    });
  } catch (error) {
    const code = error?.message === "MODEL_TIMEOUT" ? "MODEL_TIMEOUT" : "MODEL_OUTPUT_INVALID";
    return localFallback(request, code);
  } finally {
    clearTimeout(timer);
  }
}
