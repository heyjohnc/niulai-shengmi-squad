import { AGENTS, AGENT_IDS } from "../../config/public-identity.mjs";
import { makeId } from "./ids.mjs";
import { freezeRandomVotes } from "./random-vote.mjs";
import { buildRoleRequest, generateRoleLine } from "../model/contracts.mjs";
import { toPublicView } from "./public-view.mjs";

const START = "2032-04-05T09:00:00.000Z";

function at(second) {
  return new Date(Date.parse(START) + second * 1000).toISOString();
}

function source(observedAt, freshnessSeconds = 0) {
  return Object.freeze({
    provider: "SYNTHETIC_FIXTURE_GENERATOR",
    source_ref: "fixture://synthetic-market/v1",
    observed_at: observedAt,
    freshness_seconds: freshnessSeconds,
    synthetic: true,
    fixture_only: true,
    read_only: true
  });
}

function event(sequence, input) {
  return Object.freeze({
    event_id: makeId("event", sequence),
    sequence,
    occurred_at: input.occurred_at,
    ...input
  });
}

function buildCandidate(kind) {
  const isObservation = kind === "observe-boomerang";
  return Object.freeze({
    id: isObservation ? "fixture-candidate-boomerang" : "fixture-candidate-sprout",
    contract_id: isObservation ? "synthetic-contract-boomerang" : "synthetic-contract-sprout",
    name: isObservation ? "回声豆" : "晨光芽",
    symbol: isObservation ? "ECHO" : "SPROUT",
    created_at: at(0),
    observed_at: at(12),
    freshness_seconds: 4,
    metrics: Object.freeze({
      views: isObservation ? 132 : 168,
      kol_count: isObservation ? 2 : 3,
      volume_5m_units: isObservation ? 8800 : 12600,
      liquidity_units: isObservation ? 23600 : 41200
    }),
    synthetic: true,
    fixture_only: true,
    source: source(at(12), 4)
  });
}

function evidence(candidate) {
  return Object.freeze([
    Object.freeze({
      claim_type: "FACT",
      text: `${candidate.symbol} 的 1 分钟与 5 分钟 synthetic 窗口齐全，浏览量与候选数达到 fixture 门槛。`,
      source_event_id: "event-001",
      source: candidate.source,
      observed_at: candidate.observed_at,
      freshness_seconds: candidate.freshness_seconds
    }),
    Object.freeze({
      claim_type: "INFERENCE",
      text: "短时热度可能带来更大的纸面波动，但不代表可交易性或收益。",
      source_event_id: "event-001",
      source: candidate.source,
      observed_at: candidate.observed_at,
      freshness_seconds: candidate.freshness_seconds
    }),
    Object.freeze({
      claim_type: "OPEN_QUESTION",
      text: "若价格路径反向，四人的票后表达会怎样变成回旋镖？",
      source_event_id: "event-001",
      source: candidate.source,
      observed_at: candidate.observed_at,
      freshness_seconds: candidate.freshness_seconds
    })
  ]);
}

function fixtureSeed(kind) {
  return kind === "observe-boomerang" ? "observe-0" : "buy-4";
}

function pricePath(kind, forceTerminal) {
  if (kind === "observe-boomerang") {
    return Object.freeze([
      Object.freeze({ offset_seconds: 0, price_index: 10000 }),
      Object.freeze({ offset_seconds: 60, price_index: 8200 }),
      Object.freeze({ offset_seconds: 120, price_index: 11300 }),
      Object.freeze({ offset_seconds: 240, price_index: 14800 })
    ]);
  }
  if (forceTerminal === "SL") {
    return Object.freeze([
      Object.freeze({ offset_seconds: 0, price_index: 10000 }),
      Object.freeze({ offset_seconds: 45, price_index: 7100 }),
      Object.freeze({ offset_seconds: 90, price_index: 3900 })
    ]);
  }
  return Object.freeze([
    Object.freeze({ offset_seconds: 0, price_index: 10000 }),
    Object.freeze({ offset_seconds: 45, price_index: 12800 }),
    Object.freeze({ offset_seconds: 90, price_index: 15900 }),
    Object.freeze({ offset_seconds: 135, price_index: 20100 })
  ]);
}

function resolveTerminal(path) {
  const hit = path.find((point) => point.price_index >= 20000 || point.price_index <= 4000);
  if (!hit) return null;
  return Object.freeze({
    kind: hit.price_index >= 20000 ? "TP" : "SL",
    price_index: hit.price_index,
    offset_seconds: hit.offset_seconds,
    return_bps: hit.price_index - 10000
  });
}

export async function buildDemo({ kind = "paper-tp", provider = null, forceTerminal = "TP" } = {}) {
  if (!new Set(["paper-tp", "paper-sl", "observe-boomerang"]).has(kind)) throw new Error("UNKNOWN_DEMO_KIND");
  const candidate = buildCandidate(kind);
  const claims = evidence(candidate);
  const voteRound = freezeRandomVotes(fixtureSeed(kind));
  if (kind === "observe-boomerang" && voteRound.buy_votes >= 3) throw new Error("OBSERVATION_FIXTURE_SEED_INVALID");
  if (kind !== "observe-boomerang" && voteRound.buy_votes < 3) throw new Error("BUY_FIXTURE_SEED_INVALID");

  const timeline = [];
  timeline.push(event(1, {
    kind: "CANDIDATE_CARD",
    role: "YUNQUE",
    claim_type: "FACT",
    occurred_at: at(12),
    body: `云雀提交 synthetic 候选 ${candidate.name}（${candidate.symbol}）。`,
    candidate,
    evidence: claims,
    source: candidate.source
  }));
  timeline.push(event(2, {
    kind: "VOTE_FINALIZED",
    role: null,
    claim_type: "FACT",
    occurred_at: at(20),
    body: `四票已冻结：${voteRound.buy_votes}/4 BUY；决议 ${voteRound.decision}。`,
    vote_round: voteRound,
    source: source(at(20), 0)
  }));

  let sequence = 3;
  for (const role of AGENT_IDS) {
    const request = buildRoleRequest({
      role,
      caseId: candidate.id,
      candidate,
      voteRound,
      evidence: claims,
      task: "POST_VOTE_LINE"
    });
    const line = await generateRoleLine({ request, provider });
    timeline.push(event(sequence++, {
      kind: "ROLE_LINE",
      role,
      claim_type: "INFERENCE",
      occurred_at: at(20 + sequence),
      body: line.text,
      model: line,
      source: source(at(20 + sequence), 0)
    }));
  }

  const path = pricePath(kind, forceTerminal);
  let position = null;
  let outcome;
  if (voteRound.decision === "PAPER_BUY") {
    position = Object.freeze({
      mode: "PAPER_ONLY",
      notional_units: 100,
      entry_price_index: 10000,
      take_profit_price_index: 20000,
      stop_loss_price_index: 4000,
      strategy_revision: "fixture-terms-v1",
      external_side_effect: false
    });
    timeline.push(event(sequence++, {
      kind: "PAPER_POSITION_OPENED",
      role: "NIULAI",
      claim_type: "FACT",
      occurred_at: at(30),
      body: "3/4 门槛已达到，牛来按冻结条款建立 PAPER_ONLY 仓位。",
      position,
      source: source(at(30), 0)
    }));
    const terminal = resolveTerminal(path);
    if (!terminal) throw new Error("BUY_FIXTURE_MUST_REACH_TERMINAL");
    outcome = Object.freeze({
      type: terminal.kind,
      status: "CLOSED",
      return_bps: terminal.return_bps,
      realized: false,
      paper_only: true,
      external_side_effect: false
    });
    timeline.push(event(sequence++, {
      kind: terminal.kind === "TP" ? "PAPER_TP" : "PAPER_SL",
      role: "NIULAI",
      claim_type: "FACT",
      occurred_at: at(30 + terminal.offset_seconds),
      body: terminal.kind === "TP" ? "确定性价格轨迹触及纸面止盈线。" : "确定性价格轨迹触及纸面止损线。",
      price_point: terminal,
      outcome,
      source: source(at(30 + terminal.offset_seconds), 0)
    }));
  } else {
    const finalPoint = path.at(-1);
    outcome = Object.freeze({
      type: "OBSERVATION_BOOMERANG",
      status: "CLOSED",
      observation_seconds: 120,
      final_return_bps: finalPoint.price_index - 10000,
      paper_position_opened: false,
      external_side_effect: false
    });
    timeline.push(event(sequence++, {
      kind: "OBSERVATION_SETTLED",
      role: "BAOLA",
      claim_type: "FACT",
      occurred_at: at(140),
      body: "不足三票，没有纸面开仓；120 秒观察后继续只读回看。",
      outcome,
      source: source(at(140), 0)
    }));
    timeline.push(event(sequence++, {
      kind: "BOOMERANG_CALLBACK",
      role: "BAOLA",
      claim_type: "INFERENCE",
      occurred_at: at(260),
      body: "先跌后拉，没买也能留下一个可核对的回旋镖。",
      source: source(at(260), 0)
    }));
  }

  const terminalEvidence = [{
    claim_type: "FACT",
    text: timeline.at(-1).body,
    source_event_id: timeline.at(-1).event_id
  }];
  for (const role of AGENT_IDS) {
    const request = buildRoleRequest({
      role,
      caseId: candidate.id,
      candidate,
      voteRound,
      evidence: terminalEvidence,
      task: voteRound.decision === "PAPER_BUY" ? "TERMINAL_REACTION" : "OBSERVATION_REACTION"
    });
    const line = await generateRoleLine({ request, provider });
    timeline.push(event(sequence++, {
      kind: "FALLBACK_ROLE_LINE",
      role,
      claim_type: "INFERENCE",
      occurred_at: at(270 + sequence),
      body: line.text,
      model: line,
      source: source(at(270 + sequence), 0)
    }));
  }

  const record = {
    schema_version: "1.0",
    product: { display_name: "牛来生米小队", english_name: "Niulai Shengmi Squad" },
    mode: "MODEL_DISABLED",
    data_mode: "FIXTURE_ONLY",
    synthetic: true,
    fixture_only: true,
    agents: AGENTS,
    candidate,
    evidence: claims,
    vote_round: voteRound,
    price_path: path,
    paper_position: position,
    outcome,
    timeline,
    authority: {
      model_may_vote: false,
      model_may_execute: false,
      frontend_may_mutate: false,
      wallet_present: false,
      network_required: false
    },
    _private: { internal_seed: fixtureSeed(kind), private_note: "removed from public projection" }
  };
  return Object.freeze({ internal: Object.freeze(record), public: Object.freeze(toPublicView(record)) });
}
