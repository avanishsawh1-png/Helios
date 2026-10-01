const assert = require("node:assert/strict");

function policyMetrics(evals) {
  if (!evals.length) return [{ name: "policy.eval.count", value: null, availability: "EMPTY" }];
  const lines = [{ name: "policy.eval.count", value: evals.length, availability: "OK" }];
  for (const e of evals) {
    const p = `policy.${e.policyVersion}`;
    lines.push(
      { name: `${p}.n_pnl_ok`, value: e.nPnlOk, availability: e.availability },
      { name: `${p}.win_rate`, value: e.winRate, availability: e.availability },
      { name: `${p}.avg_pnl_pct`, value: e.avgPnlPct, availability: e.availability },
    );
  }
  return lines;
}

assert.equal(policyMetrics([]).availability ?? policyMetrics([])[0].availability, "EMPTY");
const lines = policyMetrics([
  { policyVersion: "v1", nPnlOk: 3, winRate: 0.3, avgPnlPct: 0.1, availability: "INSUFFICIENT_SAMPLE" },
]);
assert.equal(lines[0].value, 1);
assert.equal(lines.find((l) => l.name === "policy.v1.win_rate").availability, "INSUFFICIENT_SAMPLE");
assert.equal(lines.find((l) => l.name === "policy.v1.avg_pnl_pct").value, 0.1);

console.log("Stage 4 §21 policy metrics unit checks: PASS");
