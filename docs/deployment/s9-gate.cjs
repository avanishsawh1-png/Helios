const assert = require("node:assert/strict");
const path = require("node:path");

async function main() {
  const { classifySoak, soakReport } = await import(path.resolve(__dirname, "../../scripts/paper-soak.mjs"));
  assert.equal(classifySoak({ n: 2, liveSubmitted: 0 }).availability, "INSUFFICIENT_SAMPLE");
  assert.equal(classifySoak({ n: 20, liveSubmitted: 0 }).availability, "OK");
  assert.equal(classifySoak({ n: 20, liveSubmitted: 1 }).availability, "UNAVAILABLE");
  const report = soakReport([{ paperExecuted: false, liveAttempt: { submitted: false } }]);
  assert.equal(report.paperModePass, false);
  assert.equal(report.liveModeEnabled, false);
  assert.equal(report.manualAdminApproval, null);
  console.log("S9 soak unit checks: PASS insufficient_until_20 never_sets_s70");
}

main();
