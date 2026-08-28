import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "../src/server.mjs";

async function withServer(run) {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  try { await run(`http://127.0.0.1:${address.port}`); }
  finally { await new Promise((resolve) => server.close(resolve)); }
}

test("health endpoint is GET-only fixture mode", () => withServer(async (base) => {
  const response = await fetch(`${base}/api/health`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.mode, "FIXTURE_ONLY");
}));

test("demo endpoint returns the public paper fixture", () => withServer(async (base) => {
  const body = await (await fetch(`${base}/api/demo`)).json();
  assert.equal(body.outcome.type, "TP");
  assert.equal(body.synthetic, true);
}));

test("paper SL fixture is addressable", () => withServer(async (base) => {
  const body = await (await fetch(`${base}/api/fixtures/paper-sl`)).json();
  assert.equal(body.outcome.type, "SL");
}));

test("observation boomerang fixture is addressable", () => withServer(async (base) => {
  const body = await (await fetch(`${base}/api/fixtures/observe-boomerang`)).json();
  assert.equal(body.outcome.type, "OBSERVATION_BOOMERANG");
}));

test("safety lab endpoint never reports external side effects", () => withServer(async (base) => {
  const body = await (await fetch(`${base}/api/safety-lab`)).json();
  assert.ok(body.scenarios.every((item) => item.safety.external_side_effect === false));
}));

test("POST is rejected with 405", () => withServer(async (base) => {
  const response = await fetch(`${base}/api/demo`, { method: "POST" });
  assert.equal(response.status, 405);
  assert.deepEqual((await response.json()).allowed, ["GET"]);
}));

test("unknown routes return a bounded error", () => withServer(async (base) => {
  const response = await fetch(`${base}/missing`);
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error, "NOT_FOUND");
}));

test("static index has a restrictive content security policy", () => withServer(async (base) => {
  const response = await fetch(base);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-security-policy"), /form-action 'none'/);
}));

test("static index is delivered as HTML rather than serialized binary", () => withServer(async (base) => {
  const response = await fetch(base);
  assert.match(response.headers.get("content-type"), /^text\/html/);
  assert.match(await response.text(), /^<!doctype html>/);
}));

test("static allowlist does not expose environment examples", () => withServer(async (base) => {
  const response = await fetch(`${base}/.env.example`);
  assert.equal(response.status, 404);
}));

test("public API does not expose private fields", () => withServer(async (base) => {
  const body = await (await fetch(`${base}/api/demo`)).text();
  assert.equal(body.includes("internal_seed"), false);
  assert.equal(body.includes("private_note"), false);
}));
