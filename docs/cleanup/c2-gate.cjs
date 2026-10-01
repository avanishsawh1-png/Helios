const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const inv = path.resolve(__dirname, "C1_INVENTORY.md");
assert.equal(fs.existsSync(inv), true);
const text = fs.readFileSync(inv, "utf8");
assert.match(text, /Human must mark DELETE or KEEP/);
const agentKeep = (text.match(/\| KEEP \|/g) || []).length;
assert.ok(agentKeep >= 200, `expected many agent KEEP rows, got ${agentKeep}`);

const gone = [
  "services/exits/src/e2-gate.cjs",
  "services/exits/src/e3-gate.cjs",
  "services/exits/src/run-e1-checks.mjs",
];
const root = path.resolve(__dirname, "../..");
for (const rel of gone) {
  assert.equal(fs.existsSync(path.join(root, rel)), false, `should be deleted: ${rel}`);
  assert.match(text, new RegExp(rel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

assert.equal(fs.existsSync(path.join(root, "services/exits/src/exit-engine.ts")), true);
assert.equal(fs.existsSync(path.join(root, "services/exits/src/e4-gate.cjs")), true);
assert.equal(fs.existsSync(path.join(root, "services/exits/src/e5-gate.cjs")), true);

console.log("Wave C2/C3 targeted delete unit checks: PASS removed=3 sources_kept");
