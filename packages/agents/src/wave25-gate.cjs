const assert = require("node:assert/strict");

function timeSplit(rows, cutoffIso) {
  const cutoff = Date.parse(cutoffIso);
  if (Number.isNaN(cutoff)) throw new Error("invalid cutoff");
  const ordered = [...rows].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  return {
    train: ordered.filter((r) => Date.parse(r.at) < cutoff),
    validate: ordered.filter((r) => Date.parse(r.at) >= cutoff),
  };
}
function kFoldSplit() {
  throw new Error("k-fold / random splits are forbidden");
}
function randomSplit() {
  throw new Error("random splits are forbidden");
}

const rows = [
  { at: "2026-09-03T00:00:00.000Z", value: 2 },
  { at: "2026-09-01T00:00:00.000Z", value: 1 },
  { at: "2026-09-05T00:00:00.000Z", value: null },
];
const split = timeSplit(rows, "2026-09-04T00:00:00.000Z");
assert.equal(split.train.length, 2);
assert.equal(split.train[0].at, "2026-09-01T00:00:00.000Z");
assert.equal(split.validate.length, 1);
assert.equal(split.validate[0].value, null);
assert.throws(() => kFoldSplit());
assert.throws(() => randomSplit());
assert.throws(() => timeSplit(rows, "not-a-date"));

console.log("Wave 25 replay harness unit checks: PASS");
