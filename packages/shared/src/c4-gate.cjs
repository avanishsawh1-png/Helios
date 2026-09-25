const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function isGateFile(relPath) {
  const base = relPath.replace(/\\/g, "/");
  return (
    /(?:^|\/)(?:wave\d+|o\d+|e\d+|c\d+|stage[\d-]+|checklist)-gate\.[cm]?js$/.test(base) ||
    /\.test\.(t|j)sx?$/.test(base) ||
    /\/__tests__\//.test(base) ||
    /(?:^|\/)(?:paper-e2e|leftover-e2e|worker|migrate)\.mjs$/.test(base) ||
    /(?:^|\/)(?:gap-gate|leftover-e2e|live-engine-gate)\.cjs$/.test(base) ||
    /(?:^|\/)scripts\//.test(base) ||
    /\/dist\//.test(base)
  );
}
function findHygieneViolations(relPath, source) {
  if (isGateFile(relPath)) return [];
  const hits = [];
  if (/\bdebugger\b/.test(source)) hits.push("debugger");
  if (/\bconsole\.(log|debug|info|warn|error)\s*\(/.test(source) && !/logger/.test(relPath)) hits.push("console.*");
  return hits;
}

assert.deepEqual(findHygieneViolations("packages/agents/src/wave8-gate.cjs", "console.log('PASS')"), []);
assert.ok(findHygieneViolations("packages/agents/src/charter.ts", "console.log(1)").includes("console.*"));
assert.ok(findHygieneViolations("apps/api/src/server.ts", "debugger;").includes("debugger"));

const root = path.resolve(__dirname, "../../..");
const viol = [];
function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (/\.(ts|tsx|js|cjs|mjs)$/.test(ent.name)) {
      const rel = path.relative(root, p);
      if (rel.replace(/\\/g, "/").endsWith("packages/shared/src/log-hygiene.ts")) continue;
      const hits = findHygieneViolations(rel, fs.readFileSync(p, "utf8"));
      if (hits.length) viol.push({ rel, hits });
    }
  }
}
walk(root);
assert.equal(viol.length, 0, JSON.stringify(viol));
console.log("Wave C4 logging hygiene unit checks: PASS production_console=0");
