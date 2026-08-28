import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const allowedTopLevel = new Set([
  ".env.example", ".github", ".gitignore", "CONTRIBUTING.md", "LICENSE", "README.md", "SECURITY.md",
  "THIRD_PARTY_CONTENT.md", "THIRD_PARTY_NOTICES.md", "config", "docs", "fixtures", "output", "package-lock.json",
  "package.json", "public", "schemas", "scripts", "src", "test"
]);
const textExtensions = new Set([".css", ".example", ".html", ".js", ".json", ".md", ".mjs", ".svg", ".yml"]);
const assetExtensions = new Set([".avif", ".gif", ".ico", ".jpeg", ".jpg", ".mp3", ".mp4", ".ogg", ".otf", ".png", ".ttf", ".wav", ".webm", ".webp", ".woff", ".woff2", ".svg"]);
const allowedAssets = new Set(["public/mark.svg"]);
const findings = [];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === ".git" || entry.name === ".playwright-cli" || entry.name === "node_modules" || (directory === root && entry.name === "output")) continue;
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else files.push(absolute);
  }
  return files;
}

function add(path, category) {
  findings.push({ path, category });
}

for (const absolute of await walk(root)) {
  const path = relative(root, absolute);
  const top = path.split("/")[0];
  if (!allowedTopLevel.has(top)) add(path, "TRACKED_PATH_OUTSIDE_ALLOWLIST");
  if (assetExtensions.has(extname(path).toLowerCase()) && !allowedAssets.has(path)) add(path, "UNAPPROVED_ASSET");
  if (!textExtensions.has(extname(path)) && !new Set(["LICENSE", ".gitignore"]).has(path)) continue;
  const text = await readFile(absolute, "utf8");
  if (path !== "scripts/security-scan.mjs") {
    const checks = [
      ["ABSOLUTE_PRIVATE_PATH", /\/(?:home|root)\//],
      ["HOST_OR_DEPLOYMENT_PATH", /(?:bot1[34]|CDP|browser profile|systemd|nginx|Vercel project)/i],
      ["SOURCE_REPOSITORY_IDENTITY", /niu(?:peng)-council/i],
      ["CHAIN_ADDRESS", /0x[0-9a-fA-F]{40}/],
      ["LONG_HEX_IDENTIFIER", /\b[0-9a-fA-F]{64}\b/],
      ["ACCOUNT_OR_INVITE", /(?:(?:x|twitter)\.com\/[A-Za-z0-9_]{1,15}\b|t\.me\/|(?<![A-Za-z0-9_])@(?!media\b|keyframes\b|supports\b|font-face\b|import\b|layer\b)[A-Za-z0-9_]{4,}|group invite|QR code)/i],
      ["SECRET_MATERIAL", /(?:BEGIN [A-Z ]*PRIVATE KEY|mnemonic|seed phrase|api[_ -]?key\s*[:=]\s*[^\s<]+)/i],
      ["LIVE_MUTATION_PRIMITIVE", /(?:walletClient|writeContract|sendRawTransaction|eth_sendRawTransaction|privateKeyToAccount|broadcastTransaction|viem\/accounts)/],
      ["WORKFLOW_SECRET_OR_DEPLOY", /(?:\$\{\{\s*secrets\.|deploy-pages|vercel-action|aws-actions\/configure|docker\/login-action)/i]
    ];
    for (const [category, pattern] of checks) if (pattern.test(text)) add(path, category);
    if (top === "public" && /(?:(?:src|href)=["']https?:\/\/|url\(["']?https?:\/\/|(?:src|href)=["']data:(?:image|audio|video|font)\/)/i.test(text)) add(path, "EXTERNAL_OR_EMBEDDED_ASSET");
  }
}

const unique = [...new Map(findings.map((item) => [`${item.path}:${item.category}`, item])).values()];
if (unique.length > 0) {
  for (const item of unique) process.stderr.write(`${item.path}\t${item.category}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write("security scan passed: 0 findings\n");
}
