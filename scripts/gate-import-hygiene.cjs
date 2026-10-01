const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const pairs = [
  ["apps/api/src/auth/auth-gate.cjs", "engine.mjs"],
  ["packages/database/src/password-guard-gate.cjs", "password-guard.mjs"],
  ["packages/runtime/src/o1-gate.cjs", "graceful-shutdown.mjs"],
];
for (const [gateRel, mustImport] of pairs) {
  const text = fs.readFileSync(path.join(root, gateRel), "utf8");
  assert.match(text, new RegExp(mustImport.replace(".", "\\.")));
  assert.doesNotMatch(text, /class AuthEngine/);
  assert.doesNotMatch(text, /function assertDatabasePasswordRotated/);
}
const server = fs.readFileSync(path.join(root, "apps/api/src/server.mjs"), "utf8");
assert.match(server, /auth\/engine\.mjs/);
assert.match(server, /password-guard\.mjs/);
const discTs = fs.readFileSync(path.join(root, "services/discovery/src/discover-mints.ts"), "utf8");
assert.match(discTs, /catch \{/);
console.log("Gate import hygiene: PASS real_modules_wired");
