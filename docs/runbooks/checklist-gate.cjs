const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const doc = fs.readFileSync(path.join(root, "docs/runbooks/LIVE_READINESS_CHECKLIST.md"), "utf8");
assert.match(doc, /This file cannot set flags/);
assert.match(doc, /NOT PASSED/);
assert.match(doc, /manualAdminApproval remains human-only/);
assert.doesNotMatch(doc, /manualAdminApproval\s*=\s*true/);
assert.doesNotMatch(doc, /TRADING_MODE\s*=\s*LIVE/);

const ready = fs.readFileSync(path.join(root, "PRODUCTION_READINESS.md"), "utf8");
assert.match(ready, /manualAdminApproval: null/);
assert.match(ready, /liveModeEnabled: false/);

console.log("Read-only LIVE checklist gate: PASS no_flags_no_signer");
