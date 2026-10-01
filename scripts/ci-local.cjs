#!/usr/bin/env node
/**
 * Local CI — same node gates as .github/workflows/ci.yml
 * Does not set Section 70. Does not require pnpm lock.
 */
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const steps = [
  "scripts/pack-check.cjs",
  "docs/deployment/blockers-gate.cjs",
  "services/execution/src/live-engine-gate.cjs",
  "docs/cleanup/c6-gate.cjs",
  "services/discovery/src/discovery-gate.cjs",
  "workers/pipeline/src/leftover-e2e.cjs",
  "packages/database/src/password-guard-gate.cjs",
];

for (const rel of steps) {
  const r = spawnSync(process.execPath, [path.join(root, rel)], {
    encoding: "utf8",
    timeout: 120_000,
    env: { ...process.env, TRADING_MODE: "PAPER", NODE_ENV: "test" },
  });
  process.stdout.write(r.stdout || "");
  process.stderr.write(r.stderr || "");
  if (r.status !== 0) {
    console.error(`CI FAIL ${rel}`);
    process.exit(r.status || 1);
  }
}
console.log("Helios local CI: PASS TRADING_MODE=PAPER live=false");
