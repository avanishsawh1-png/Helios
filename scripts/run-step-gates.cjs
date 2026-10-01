#!/usr/bin/env node
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const steps = [
  ["S1", "docs/deployment/s1-gate.cjs"],
  ["S2", "workers/pipeline/src/s2-gate.cjs"],
  ["S3", "workers/pipeline/src/s3-gate.cjs"],
  ["S4", "workers/pipeline/src/s4-gate.cjs"],
  ["S5", "workers/pipeline/src/s5-gate.cjs"],
  ["S6", "workers/signer/src/s6-gate.cjs"],
  ["S7", "workers/pipeline/src/s7-gate.cjs"],
  ["S8", "docs/deployment/s8-gate.cjs"],
  ["S9", "docs/deployment/s9-gate.cjs"],
  ["S10", "docs/deployment/s10-gate.cjs"],
  ["bal", "packages/solana/src/sol-balance-gate.cjs"],
  ["secrets", "packages/secrets/src/secrets-gate.cjs"],
  ["pack", "scripts/pack-check.cjs"],
  ["live", "services/execution/src/live-engine-gate.cjs"],
  ["e2e", "workers/pipeline/src/leftover-e2e.cjs"],
];
for (const [name, rel] of steps) {
  const r = spawnSync(process.execPath, [path.join(root, rel)], {
    encoding: "utf8",
    timeout: 120000,
    env: { ...process.env, TRADING_MODE: "PAPER", NODE_ENV: "test" },
  });
  process.stdout.write(`[${name}] ${r.stdout || ""}`);
  if (r.stderr) process.stderr.write(r.stderr);
  if (r.status !== 0) {
    console.error(`STEP FAIL ${name}`);
    process.exit(r.status || 1);
  }
}
console.log("Agent step tests S1-S10: PASS live=false s70_unchecked");
