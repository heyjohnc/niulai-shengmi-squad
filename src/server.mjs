import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { extname, join } from "node:path";
import { buildDemo } from "./core/workflow.mjs";
import { buildSafetyLab } from "./execution-safety-lab/lab.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const port = Number.parseInt(process.env.NIULAI_PORT ?? "4173", 10);
const fixtures = new Map([
  ["paper-tp", (await buildDemo({ kind: "paper-tp" })).public],
  ["paper-sl", (await buildDemo({ kind: "paper-sl", forceTerminal: "SL" })).public],
  ["observe-boomerang", (await buildDemo({ kind: "observe-boomerang" })).public]
]);
const safetyLab = await buildSafetyLab();

const mime = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".json", "application/json; charset=utf-8"]
]);

function send(res, status, body, type = "application/json; charset=utf-8") {
  res.writeHead(status, {
    "content-type": type,
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "content-security-policy": "default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
  });
  res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

async function staticFile(pathname) {
  const target = pathname === "/" ? "index.html" : pathname.slice(1);
  if (!new Set(["index.html", "app.js", "styles.css", "mark.svg"]).has(target)) return null;
  return { body: await readFile(join(root, "public", target)), type: mime.get(extname(target)) };
}

export function createServer() {
  return http.createServer(async (req, res) => {
    try {
      if (req.method !== "GET") {
        send(res, 405, { error: "METHOD_NOT_ALLOWED", allowed: ["GET"] });
        return;
      }
      const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);
      if (url.pathname === "/api/health") {
        send(res, 200, { status: "ok", mode: "FIXTURE_ONLY", external_network_required: false });
        return;
      }
      if (url.pathname === "/api/demo") {
        send(res, 200, fixtures.get("paper-tp"));
        return;
      }
      if (url.pathname === "/api/safety-lab") {
        send(res, 200, { scenarios: safetyLab });
        return;
      }
      const fixtureMatch = url.pathname.match(/^\/api\/fixtures\/(paper-tp|paper-sl|observe-boomerang)$/);
      if (fixtureMatch) {
        send(res, 200, fixtures.get(fixtureMatch[1]));
        return;
      }
      const asset = await staticFile(url.pathname);
      if (asset) {
        send(res, 200, asset.body, asset.type);
        return;
      }
      send(res, 404, { error: "NOT_FOUND" });
    } catch {
      send(res, 500, { error: "INTERNAL_ERROR" });
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = createServer();
  server.listen(port, "127.0.0.1", () => {
    process.stdout.write(`Niulai Shengmi Squad read-only demo: http://127.0.0.1:${port}\n`);
  });
}
