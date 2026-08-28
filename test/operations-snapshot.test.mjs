import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const snapshot = JSON.parse(await readFile(
  new URL("../docs/operations-snapshot-20260828.json", import.meta.url),
  "utf8"
));
const schema = JSON.parse(await readFile(
  new URL("../schemas/operations-snapshot.schema.json", import.meta.url),
  "utf8"
));

test("the operations snapshot is a frozen aggregate rather than a raw run", () => {
  assert.equal(snapshot.status, "FROZEN_PUBLIC_AGGREGATE");
  assert.equal(snapshot.source_mode, "SANITIZED_AGGREGATE_FROM_PRIVATE_RUNTIME");
  assert.equal(snapshot.raw_records_included, false);
  assert.equal(snapshot.mixed_runtime_revisions, true);
});

test("vote totals and the three-of-four threshold remain internally consistent", () => {
  const distribution = snapshot.metrics.votes.buy_vote_distribution;
  assert.equal(Object.values(distribution).reduce((sum, value) => sum + value, 0), snapshot.metrics.votes.round_count);
  assert.equal(distribution[3] + distribution[4], snapshot.metrics.votes.threshold_reached_count);
  assert.equal(distribution[0] + distribution[1] + distribution[2], snapshot.metrics.votes.observe_only_count);
  assert.equal(snapshot.metrics.votes.integrity_violation_count, 0);
});

test("dialogue and provider-neutral route totals are truthful", () => {
  const dialogue = snapshot.metrics.dialogue;
  const routes = snapshot.metrics.model_routes;
  assert.ok(dialogue.exact_unique_line_count <= dialogue.line_count);
  assert.equal(Number((dialogue.exact_unique_line_count / dialogue.line_count).toFixed(4)), dialogue.exact_unique_ratio);
  assert.equal(routes.primary_count + routes.fallback_count + routes.local_template_count, routes.receipt_count);
  assert.equal(routes.model_authority_violation_count, 0);
  assert.equal(routes.stored_prompt_count, 0);
  assert.equal(routes.stored_raw_completion_count, 0);
});

test("the public aggregate excludes sensitive identifier and raw-record shapes", () => {
  const text = JSON.stringify(snapshot);
  assert.doesNotMatch(text, /0x[0-9a-fA-F]{40}/);
  assert.doesNotMatch(text, /\b[0-9a-fA-F]{64}\b/);
  assert.equal(snapshot.exclusions.includes("RAW_TIMELINE"), true);
  assert.equal(snapshot.exclusions.includes("WALLET_AND_CHAIN_IDENTIFIERS"), true);
  assert.equal(snapshot.exclusions.includes("PROMPTS_AND_COMPLETIONS"), true);
});

test("the snapshot contract requires every disclosure boundary field", () => {
  for (const field of [
    "source_mode",
    "mixed_runtime_revisions",
    "raw_records_included",
    "metrics",
    "quality_metrics",
    "exclusions",
    "cautions"
  ]) assert.ok(schema.required.includes(field));
  assert.equal(schema.properties.metrics.additionalProperties, false);
  assert.equal(schema.$defs.votes.additionalProperties, false);
  assert.equal(schema.$defs.dialogue.additionalProperties, false);
  assert.equal(schema.$defs.qualityMetrics.additionalProperties, false);
});
