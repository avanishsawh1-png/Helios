const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

async function main() {
  const { readiness } = await import(path.resolve(__dirname, "../../workers/pipeline/src/paper-system.mjs"));
  const r = readiness();
  assert.equal(r.paperModePass, false);
  assert.equal(r.testnetPass, false);
  assert.equal(r.riskTestPass, false);
  assert.equal(r.executionTestPass, false);
  assert.equal(r.recoveryTestPass, false);
  assert.equal(r.manualAdminApproval, null);
  assert.equal(r.liveModeEnabled, false);
  assert.equal(r.productionReady, false);

  const doc = fs.readFileSync(path.resolve(__dirname, "../runbooks/S10_SECTION_70_HUMAN.md"), "utf8");
  assert.match(doc, /human only/i);
  assert.match(doc, /manualAdminApproval: null/);
  console.log("S10 Section 70 unit checks: PASS all_boxes_unchecked human_only");
}

main();
