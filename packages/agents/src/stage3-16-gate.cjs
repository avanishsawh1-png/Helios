const assert = require("node:assert/strict");

const EVAL_MIN_N = 20;
function evaluatePolicy(policyVersion, rows) {
  const mine = rows.filter((r) => r.policyVersion === policyVersion);
  const ok = mine.filter((r) => r.pnlAvailability === "OK" && r.realizedPnlPct !== null);
  const wins = ok.filter((r) => r.realizedPnlPct > 0);
  const fps = ok.filter((r) => r.realizedPnlPct < 0);
  const avg = ok.length === 0 ? null : ok.reduce((a, r) => a + r.realizedPnlPct, 0) / ok.length;
  let peak = 0;
  let equity = 0;
  let maxDd = ok.length ? 0 : null;
  for (const r of ok) {
    equity += r.realizedPnlPct;
    if (equity > peak) peak = equity;
    const dd = peak - equity;
    if (maxDd !== null && dd > maxDd) maxDd = dd;
  }
  return {
    policyVersion,
    nTotal: mine.length,
    nPnlOk: ok.length,
    nWins: wins.length,
    winRate: ok.length ? wins.length / ok.length : null,
    avgPnlPct: avg,
    falsePositiveRate: ok.length ? fps.length / ok.length : null,
    maxDrawdownPct: maxDd,
    availability: ok.length >= EVAL_MIN_N ? "OK" : "INSUFFICIENT_SAMPLE",
  };
}

const short = evaluatePolicy("v1", [
  { policyVersion: "v1", realizedPnlPct: 1, pnlAvailability: "OK" },
  { policyVersion: "v1", realizedPnlPct: null, pnlAvailability: "UNAVAILABLE" },
]);
assert.equal(short.availability, "INSUFFICIENT_SAMPLE");
assert.equal(short.nPnlOk, 1);
assert.equal(short.nTotal, 2);

const rows = [];
for (let i = 0; i < 20; i += 1) {
  rows.push({ policyVersion: "v2", realizedPnlPct: i % 2 === 0 ? 2 : -1, pnlAvailability: "OK" });
}
const ready = evaluatePolicy("v2", rows);
assert.equal(ready.availability, "OK");
assert.equal(ready.nWins, 10);
assert.equal(ready.winRate, 0.5);
assert.equal(ready.avgPnlPct, 0.5);
assert.ok(ready.maxDrawdownPct !== null);

console.log("Stage 3 §16 policy eval unit checks: PASS");
