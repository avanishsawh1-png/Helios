const assert = require("node:assert/strict");

function sanitizeUntrusted(text, max) {
  return `<untrusted>${String(text).replace(/```/g, "'''").slice(0, max)}</untrusted>`;
}
const COLD_START_MAX_N = 5;
function classifyToken(sample) {
  if (sample.laterPrice === null) return "dead_no_later_price";
  if (sample.historyN < COLD_START_MAX_N) return "cold_start";
  return "established";
}
function headlineSet(samples) {
  return samples.filter((s) => classifyToken(s) === "established");
}
function cohortCounts(samples) {
  const out = { established: 0, cold_start: 0, dead_no_later_price: 0 };
  for (const s of samples) out[classifyToken(s)] += 1;
  return out;
}

const samples = [
  { mint: "a", symbol: "OK", historyN: 20, laterPrice: 1 },
  { mint: "b", symbol: "NEW```", historyN: 2, laterPrice: 1 },
  { mint: "c", symbol: "DEAD", historyN: 20, laterPrice: null },
];
assert.equal(classifyToken(samples[0]), "established");
assert.equal(classifyToken(samples[1]), "cold_start");
assert.equal(classifyToken(samples[2]), "dead_no_later_price");
assert.equal(headlineSet(samples).length, 1);
assert.deepEqual(cohortCounts(samples), { established: 1, cold_start: 1, dead_no_later_price: 1 });
assert.match(sanitizeUntrusted(samples[1].symbol, 32), /<untrusted>/);
assert.doesNotMatch(sanitizeUntrusted(samples[1].symbol, 32), /```/);

console.log("Wave 28 cold-start + untrusted input unit checks: PASS");
