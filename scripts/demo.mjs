import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDemo } from "../src/core/workflow.mjs";
import { buildSafetyLab } from "../src/execution-safety-lab/lab.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const primary = (await buildDemo({ kind: "paper-tp" })).public;
const observation = (await buildDemo({ kind: "observe-boomerang" })).public;
const lab = await buildSafetyLab();
const report = {
  generated_at: "DETERMINISTIC_FIXTURE_TIME",
  mode: "MODEL_DISABLED",
  data_mode: "FIXTURE_ONLY",
  network_calls: 0,
  wallet_present: false,
  cases: [
    { id: primary.candidate.id, decision: primary.vote_round.decision, outcome: primary.outcome.type, events: primary.timeline.length },
    { id: observation.candidate.id, decision: observation.vote_round.decision, outcome: observation.outcome.type, events: observation.timeline.length }
  ],
  safety_lab: lab.map((item) => ({ id: item.id, status: item.final_state.terminal_status, calls: item.transport_calls.length }))
};
await mkdir(`${root}/output`, { recursive: true });
await writeFile(`${root}/output/demo-summary.json`, `${JSON.stringify(report, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
