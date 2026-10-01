const assert = require("node:assert/strict");
const path = require("node:path");

async function main() {
  const { evaluateExit } = await import(path.resolve(__dirname, "../../../services/exits/src/exit-engine.mjs"));
  const stale = evaluateExit({
    entryPrice: 1,
    markPrice: 0.5,
    markStatus: "UNAVAILABLE",
    remainingSizeFraction: 1,
    legsFilled: 0,
    peakUnrealizedPnlPct: null,
    breakEvenArmed: false,
    holdMs: null,
    killSwitchActive: false,
  });
  assert.equal(stale.wouldExit, false);
  assert.equal(stale.reason, "NONE");

  const sl = evaluateExit({
    entryPrice: 100,
    markPrice: 90,
    markStatus: "OK",
    remainingSizeFraction: 1,
    legsFilled: 0,
    peakUnrealizedPnlPct: null,
    breakEvenArmed: false,
    holdMs: 0,
    killSwitchActive: false,
  });
  assert.equal(sl.reason, "STOP_LOSS");

  const tp = evaluateExit({
    entryPrice: 100,
    markPrice: 115,
    markStatus: "OK",
    remainingSizeFraction: 1,
    legsFilled: 0,
    peakUnrealizedPnlPct: 15,
    breakEvenArmed: false,
    holdMs: 0,
    killSwitchActive: false,
  });
  assert.equal(tp.reason, "TAKE_PROFIT");
  assert.ok(tp.nextLegsFilled >= 1);

  console.log("S5 positions/exits unit checks: PASS no_flatten_on_unavailable sl_and_tp");
}

main();
