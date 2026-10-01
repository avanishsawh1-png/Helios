const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
assert.equal(pkg.scripts.ci, "node scripts/ci-local.cjs");
assert.equal(pkg.scripts.test, "node scripts/ci-local.cjs");
assert.ok(pkg.engines.node.includes("20"));
const ci = fs.readFileSync(path.join(root, ".github/workflows/ci.yml"), "utf8");
assert.match(ci, /pack-check\.cjs/);
assert.match(ci, /c6-gate\.cjs/);
assert.match(ci, /leftover-e2e\.cjs/);
assert.equal(fs.existsSync(path.join(root, "scripts/ci-local.cjs")), true);
assert.doesNotMatch(ci, /frozen-lockfile/);
console.log("S1 types/CI unit checks: PASS no_frozen_lockfile scripts_match_gha");
