const assert = require("node:assert/strict");

function decidePromotion(input) {
  if (input.actor !== "human") return { status: "REJECTED", reason: "agent_cannot_promote" };
  if (input.current.availability !== "OK" || input.candidate.availability !== "OK") {
    return { status: "INSUFFICIENT_SAMPLE", reason: "eval_not_ok" };
  }
  if (input.current.nPnlOk !== input.candidate.nPnlOk) return { status: "REJECTED", reason: "window_mismatch" };
  const cur = input.current.avgPnlPct ?? Number.NEGATIVE_INFINITY;
  const cand = input.candidate.avgPnlPct ?? Number.NEGATIVE_INFINITY;
  if (!(cand > cur)) return { status: "REJECTED", reason: "no_edge" };
  return { status: "PROMOTED", reason: "candidate_avg_pnl_higher" };
}

const base = { availability: "OK", nPnlOk: 20, avgPnlPct: 0.1 };
assert.equal(decidePromotion({ actor: "agent", current: base, candidate: { ...base, avgPnlPct: 0.2 } }).reason, "agent_cannot_promote");
assert.equal(
  decidePromotion({ actor: "human", current: { ...base, availability: "INSUFFICIENT_SAMPLE" }, candidate: base }).status,
  "INSUFFICIENT_SAMPLE",
);
assert.equal(decidePromotion({ actor: "human", current: base, candidate: { ...base, nPnlOk: 21 } }).reason, "window_mismatch");
assert.equal(decidePromotion({ actor: "human", current: base, candidate: { ...base, avgPnlPct: 0.1 } }).reason, "no_edge");
assert.equal(decidePromotion({ actor: "human", current: base, candidate: { ...base, avgPnlPct: 0.2 } }).status, "PROMOTED");

console.log("Stage 4 §20 policy promotion unit checks: PASS");
