import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { AGENT_IDS } from "../config/public-identity.mjs";
import { buildDemo } from "../src/core/workflow.mjs";
import { buildSafetyLab } from "../src/execution-safety-lab/lab.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const failures = [];
const check = (condition, name) => { if (!condition) failures.push(name); };
const demoSchema = JSON.parse(await readFile(`${root}/schemas/demo.schema.json`, "utf8"));
const operationsSchema = JSON.parse(await readFile(`${root}/schemas/operations-snapshot.schema.json`, "utf8"));
const operationsSnapshot = JSON.parse(await readFile(`${root}/docs/operations-snapshot-20260828.json`, "utf8"));
check(demoSchema.required.includes("evidence"), "SCHEMA_EVIDENCE_REQUIRED");
check(["source_ref", "observed_at", "freshness_seconds"].every((field) => demoSchema.$defs.source.required.includes(field)), "SCHEMA_SOURCE_TIME_FRESHNESS_REQUIRED");
check(operationsSchema.required.includes("raw_records_included"), "OPERATIONS_SCHEMA_RAW_BOUNDARY_REQUIRED");
check(operationsSnapshot.raw_records_included === false, "OPERATIONS_RAW_RECORDS_FORBIDDEN");
check(operationsSnapshot.metrics.votes.integrity_violation_count === 0, "OPERATIONS_VOTE_INTEGRITY");
check(operationsSnapshot.metrics.model_routes.model_authority_violation_count === 0, "OPERATIONS_MODEL_AUTHORITY");
check(
  Object.values(operationsSnapshot.metrics.votes.buy_vote_distribution).reduce((sum, count) => sum + count, 0) ===
    operationsSnapshot.metrics.votes.round_count,
  "OPERATIONS_VOTE_TOTAL"
);
check(
  operationsSnapshot.metrics.model_routes.primary_count +
    operationsSnapshot.metrics.model_routes.fallback_count +
    operationsSnapshot.metrics.model_routes.local_template_count ===
    operationsSnapshot.metrics.model_routes.receipt_count,
  "OPERATIONS_ROUTE_TOTAL"
);

for (const name of ["paper-tp", "paper-sl", "observe-boomerang"]) {
  const fixture = JSON.parse(await readFile(`${root}/fixtures/${name}.json`, "utf8"));
  const generated = (await buildDemo({ kind: name, forceTerminal: name === "paper-sl" ? "SL" : "TP" })).public;
  check(JSON.stringify(fixture) === JSON.stringify(generated), `FIXTURE_DRIFT:${name}`);
  check(fixture.synthetic === true && fixture.fixture_only === true, `FIXTURE_FLAGS:${name}`);
  check(fixture.evidence.length === 3 && ["FACT", "INFERENCE", "OPEN_QUESTION"].every((type) => fixture.evidence.some((claim) => claim.claim_type === type)), `EVIDENCE_TYPES:${name}`);
  check(fixture.evidence.every((claim) => claim.source?.source_ref.startsWith("fixture://") && Number.isInteger(claim.freshness_seconds) && claim.freshness_seconds >= 0 && !Number.isNaN(Date.parse(claim.observed_at))), `EVIDENCE_SOURCE_TIME_FRESHNESS:${name}`);
  check(fixture.timeline.every((item) => item.source?.source_ref.startsWith("fixture://") && Number.isInteger(item.source.freshness_seconds) && !Number.isNaN(Date.parse(item.source.observed_at))), `TIMELINE_SOURCE_TIME_FRESHNESS:${name}`);
  check(fixture.agents.length === 4 && AGENT_IDS.every((id) => fixture.agents.some((agent) => agent.id === id)), `AGENTS:${name}`);
  check(fixture.vote_round.votes.length === 4 && fixture.vote_round.votes.every((vote) => vote.decision_basis === "RANDOM_ONLY"), `VOTES:${name}`);
  check(fixture.timeline.every((event, index) => event.sequence === index + 1), `TIMELINE:${name}`);
  check(!JSON.stringify(fixture).includes("_private"), `PUBLIC_STRIP:${name}`);
}

const lab = await buildSafetyLab();
check(lab.every((scenario) => scenario.transport === "INJECTED_FAKE_TRANSPORT"), "LAB_FAKE_ONLY");
check(lab.every((scenario) => scenario.safety.external_side_effect === false), "LAB_NO_SIDE_EFFECT");
check(lab.find((item) => item.id === "pending").transport_calls.length === 1, "LAB_PENDING_NO_RETRY");
check(lab.find((item) => item.id === "ambiguous").transport_calls.length === 1, "LAB_AMBIGUOUS_NO_RETRY");
check(lab.find((item) => item.id === "confirmed-revert-then-success").transport_calls.length === 2, "LAB_REVERT_ONE_RETRY");
check(lab.find((item) => item.id === "nonzero-exposure").transport_calls.length === 0, "LAB_NONZERO_FAIL_CLOSED");

const scan = spawnSync(process.execPath, ["scripts/security-scan.mjs"], { cwd: root, encoding: "utf8" });
if (scan.status !== 0) failures.push(`SECURITY_SCAN\n${scan.stderr}`);

if (failures.length > 0) {
  process.stderr.write(`${failures.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write("validation passed: fixtures, contracts, sanitized aggregate, fake lab, public view, and security scan\n");
}
