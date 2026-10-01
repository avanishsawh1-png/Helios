const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");

const required = [
  "CHANGELOG.md",
  "KNOWN_ISSUES.md",
  "PRODUCTION_READINESS.md",
  "docs/exits/E5_PAPER_POLICY.md",
  "docs/architecture/o5-readiness-evidence.md",
  "docs/agents/CHARTER.md",
  "docs/cleanup/C1_INVENTORY.md",
  "docs/phase-reports/MASTER_WAVE_C4_REPORT.md",
];

for (const rel of required) {
  assert.equal(fs.existsSync(path.join(root, rel)), true, rel);
}

const ready = fs.readFileSync(path.join(root, "PRODUCTION_READINESS.md"), "utf8");
assert.match(ready, /productionReady: false/);
assert.match(ready, /liveModeEnabled: false/);
assert.match(ready, /INSUFFICIENT_SAMPLE/);
assert.doesNotMatch(ready, /PRODUCTION READY(?![\s\S]*NOT)/);

const charter = fs.readFileSync(path.join(root, "docs/agents/CHARTER.md"), "utf8");
assert.match(charter, /No second trading path/i);
assert.match(charter, /PROTECTED_TARGETS/);

const e5 = fs.readFileSync(path.join(root, "docs/exits/E5_PAPER_POLICY.md"), "utf8");
assert.match(e5, /No LLM inside `ExitEngine\.evaluate\(\)`/);
assert.match(e5, /LIVE trading/);

console.log("Wave C5 docs consistency unit checks: PASS");
