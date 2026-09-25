const assert = require("node:assert/strict");

function meanNumeric(rows) {
  const xs = rows.map((r) => r.value).filter((v) => v !== null);
  if (!xs.length) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function candidateFromReplay(base, split, validatePreset) {
  const vol = meanNumeric(split.validate);
  if (vol === null) return { candidate: base, status: "INSUFFICIENT_SAMPLE", reason: "validate empty/null" };
  const next = {
    ...base,
    id: `${base.id}:replay`,
    maxPositionUsd: Math.min(base.maxPositionUsd, Math.max(1, Math.floor(base.maxPositionUsd * 0.9))),
  };
  const check = validatePreset(next);
  if (check.status !== "ACCEPTED_CANDIDATE") {
    return { candidate: next, status: check.status, reason: "hard" };
  }
  return { candidate: next, status: "CANDIDATE", reason: "tightened_from_replay" };
}

const base = { id: "p", maxPositionUsd: 100, maxExposurePct: 10, maxDailyLossUsd: 40, stopLossPct: 8 };
const accept = (c) => ({ status: "ACCEPTED_CANDIDATE", reasons: [] });

assert.equal(
  candidateFromReplay(base, { train: [], validate: [{ value: null }] }, accept).status,
  "INSUFFICIENT_SAMPLE",
);
const made = candidateFromReplay(base, { train: [], validate: [{ value: 1 }] }, accept);
assert.equal(made.status, "CANDIDATE");
assert.equal(made.candidate.maxPositionUsd, 90);
assert.equal(made.candidate.id, "p:replay");

const rejected = candidateFromReplay(base, { train: [], validate: [{ value: 1 }] }, () => ({
  status: "REJECTED_EXCEEDS_HARD",
  reasons: ["x"],
}));
assert.equal(rejected.status, "REJECTED_EXCEEDS_HARD");

console.log("Wave 26 replay candidates unit checks: PASS");
