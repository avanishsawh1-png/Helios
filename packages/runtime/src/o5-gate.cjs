const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../../..");
const required = [
  "packages/runtime/src/graceful-shutdown.ts",
  "packages/runtime/src/supervisor.ts",
  "packages/runtime/src/resource-guard.ts",
  "packages/solana/src/bounded-caller.ts",
  "docs/architecture/process-lifecycle.md",
  "docs/architecture/rpc-outbound.md",
  "docs/architecture/supervisor.md",
  "docs/architecture/resource-bounds.md",
  "docs/architecture/o5-readiness-evidence.md",
];

for (const rel of required) {
  const p = path.join(root, rel);
  assert.equal(fs.existsSync(p), true, `missing ${rel}`);
}

const evidence = {
  paperModeRequired: true,
  liveAuthorization: false,
  soakHoursObserved: 0,
  weekendWindowObserved: false,
  highVolumeWindowObserved: false,
  lowVolumeWindowObserved: false,
  minSoakHours: 72,
};

function readinessVerdict(e) {
  if (e.liveAuthorization) return "INVALID_LIVE_CLAIM";
  const sampleOk =
    e.soakHoursObserved >= e.minSoakHours &&
    e.weekendWindowObserved &&
    e.highVolumeWindowObserved &&
    e.lowVolumeWindowObserved;
  if (!sampleOk) return "INSUFFICIENT_SAMPLE";
  return "PAPER_24_7_EVIDENCE_OK";
}

assert.equal(readinessVerdict(evidence), "INSUFFICIENT_SAMPLE");
assert.equal(
  readinessVerdict({ ...evidence, soakHoursObserved: 80, weekendWindowObserved: true, highVolumeWindowObserved: true, lowVolumeWindowObserved: true }),
  "PAPER_24_7_EVIDENCE_OK",
);
assert.equal(
  readinessVerdict({ ...evidence, soakHoursObserved: 80, weekendWindowObserved: true, highVolumeWindowObserved: true, lowVolumeWindowObserved: true, liveAuthorization: true }),
  "INVALID_LIVE_CLAIM",
);

console.log("O5 PAPER 24/7 evidence gate: INSUFFICIENT_SAMPLE n_hours=0");
console.log("O5 LIVE authorization: NOT GRANTED");
console.log("O5 unit checks: PASS");
