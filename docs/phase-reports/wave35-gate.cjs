const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const acc = fs.readFileSync(path.join(root, "docs/phase-reports/MASTER_ACCEPTANCE_REPORT.md"), "utf8");
assert.match(acc, /\*\*manualAdminApproval:\*\* unchecked/);
assert.match(acc, /\*\*productionReady:\*\* false/);
assert.match(acc, /Do not build Wave 36/);
assert.match(acc, /\[ \] MANUAL ADMIN APPROVAL/);
assert.doesNotMatch(acc, /\[x\] MANUAL ADMIN APPROVAL/);
assert.doesNotMatch(acc, /\[x\] LIVE MODE/);

const ready = fs.readFileSync(path.join(root, "PRODUCTION_READINESS.md"), "utf8");
assert.match(ready, /productionReady: false/);
assert.match(ready, /manualAdminApproval: null/);
assert.match(ready, /liveModeEnabled: false/);

console.log("Wave 35 acceptance package: PASS flags_unchecked wave36_not_built");
console.log("Wave 35 LIVE authorization: NOT GRANTED");
console.log("Wave 35 STOP: human decision only from this point");
