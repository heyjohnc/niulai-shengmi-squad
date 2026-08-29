import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

const fanRewardDoc = await readFile(new URL("../docs/FAN_REWARD_GOVERNANCE.md", import.meta.url), "utf8");
const readme = await readFile(new URL("../README.md", import.meta.url), "utf8");

async function filesBelow(relativeDirectory) {
  const directory = new URL(`../${relativeDirectory}/`, import.meta.url);
  const results = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      for (const child of await filesBelow(join(relativeDirectory, entry.name))) results.push(child);
    } else {
      results.push(join(relativeDirectory, entry.name));
    }
  }
  return results;
}

test("fan reward disclosure separates contribution governance from market RANDOM_ONLY votes", () => {
  assert.match(fanRewardDoc, /CONTRIBUTION_EVIDENCE_ONLY/);
  assert.match(fanRewardDoc, /RANDOM_ONLY/);
  assert.match(fanRewardDoc, /Fans are contributors and possible recipients.*they are not the voters/);
  assert.match(fanRewardDoc, /READY_ACTION_LOCKED/);
  assert.match(fanRewardDoc, /no signing or broadcast authority/i);
});

test("fan reward remains documentation-only in the public clean-room repository", async () => {
  assert.match(fanRewardDoc, /PUBLIC_REPO_CODE_NOT_INCLUDED/);
  assert.match(fanRewardDoc, /REAL_PAYOUT_NOT_VALIDATED/);
  assert.match(readme, /documentation-only/);
  const implementationPaths = (await Promise.all(
    ["src", "scripts", "schemas", "fixtures"].map(filesBelow)
  )).flat();
  assert.equal(implementationPaths.some((path) => /fan[-_]reward/i.test(path)), false);
  assert.doesNotMatch(fanRewardDoc, /0x[0-9a-fA-F]{40}/);
  assert.doesNotMatch(fanRewardDoc, /\b[0-9a-fA-F]{64}\b/);
});
