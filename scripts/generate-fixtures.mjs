import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDemo } from "../src/core/workflow.mjs";
import { buildSafetyLab } from "../src/execution-safety-lab/lab.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
await mkdir(`${root}/fixtures`, { recursive: true });

const outputs = [
  ["paper-tp.json", (await buildDemo({ kind: "paper-tp" })).public],
  ["paper-sl.json", (await buildDemo({ kind: "paper-sl", forceTerminal: "SL" })).public],
  ["observe-boomerang.json", (await buildDemo({ kind: "observe-boomerang" })).public],
  ["execution-safety-lab.json", { schema_version: "1.0", scenarios: await buildSafetyLab() }]
];

for (const [name, value] of outputs) {
  await writeFile(`${root}/fixtures/${name}`, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

process.stdout.write(`generated ${outputs.length} deterministic fixture files\n`);
