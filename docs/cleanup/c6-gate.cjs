const { spawnSync } = require("node:child_process");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const gates = [
  "services/exits/src/e5-gate.cjs",
  "packages/runtime/src/o1-gate.cjs",
  "packages/solana/src/o2-gate.cjs",
  "packages/runtime/src/o3-gate.cjs",
  "packages/runtime/src/o4-gate.cjs",
  "packages/runtime/src/o5-gate.cjs",
  "packages/agents/src/wave8-gate.cjs",
  "packages/agents/src/wave9-gate.cjs",
  "packages/agents/src/wave10-gate.cjs",
  "packages/agents/src/wave11-gate.cjs",
  "packages/agents/src/wave12-gate.cjs",
  "packages/agents/src/wave13-gate.cjs",
  "packages/agents/src/wave14-gate.cjs",
  "packages/agents/src/wave15-gate.cjs",
  "packages/agents/src/wave16-gate.cjs",
  "packages/agents/src/wave17-gate.cjs",
  "packages/agents/src/wave18-gate.cjs",
  "packages/agents/src/wave19-gate.cjs",
  "packages/agents/src/wave20-gate.cjs",
  "packages/agents/src/wave21-gate.cjs",
  "packages/agents/src/wave22-gate.cjs",
  "packages/agents/src/wave23-gate.cjs",
  "apps/web/src/lib/wave24-gate.cjs",
  "packages/agents/src/wave25-gate.cjs",
  "packages/agents/src/wave26-gate.cjs",
  "packages/agents/src/wave27-gate.cjs",
  "packages/agents/src/wave28-gate.cjs",
  "packages/agents/src/wave29-gate.cjs",
  "packages/agents/src/wave30-gate.cjs",
  "packages/agents/src/wave31-gate.cjs",
  "packages/agents/src/wave32-gate.cjs",
  "docs/cleanup/c2-gate.cjs",
  "packages/shared/src/c4-gate.cjs",
  "docs/cleanup/c5-gate.cjs",
  "workers/pipeline/src/leftover-e2e.cjs",
  "services/control-gateway/src/gap-gate.cjs",
  "scripts/pack-check.cjs",
  "services/execution/src/live-engine-gate.cjs",
];

const failed = [];
for (const rel of gates) {
  const r = spawnSync(process.execPath, [path.join(root, rel)], { encoding: "utf8" });
  const ok = r.status === 0;
  process.stdout.write(`${ok ? "PASS" : "FAIL"} ${rel}\n`);
  if (!ok) {
    process.stdout.write(r.stdout + r.stderr);
    failed.push(rel);
  }
}

if (failed.length) {
  console.error(`C6 regression FAIL count=${failed.length}`);
  process.exit(1);
}
console.log(`Wave C6 full gate regression: PASS n=${gates.length}`);
