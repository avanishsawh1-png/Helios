const assert = require("node:assert/strict");

function pnlPct(entry, mark, status) {
  if (status !== "OK") return null;
  if (entry === null || mark === null) return null;
  if (!(entry > 0) || !(mark > 0)) return null;
  return ((mark - entry) / entry) * 100;
}

const DEFAULT = {
  stopLossPct: 8,
  breakEvenArmPct: 6,
  breakEvenBufferPct: 0.3,
  takeProfitLadder: [
    { triggerPnlPct: 12, sizeFraction: 0.33 },
    { triggerPnlPct: 25, sizeFraction: 0.33 },
    { triggerPnlPct: 50, sizeFraction: 0.19 },
  ],
  trailArmPct: 20,
  trailGivebackPct: 8,
  moonBagFraction: 0.15,
  maxHoldMs: 4 * 60 * 60 * 1000,
  timeStopExemptPnlPct: 2,
};

function evaluateExit(pos, config = DEFAULT) {
  if (pos.killSwitchActive) {
    return { wouldExit: true, reason: "KILL_SWITCH", sizeFraction: pos.remainingSizeFraction };
  }
  if (pos.manualExitRequested) {
    return { wouldExit: true, reason: "MANUAL_EXIT", sizeFraction: pos.remainingSizeFraction };
  }
  const pnl = pnlPct(pos.entryPrice, pos.markPrice, pos.markStatus);
  if (pnl === null) {
    return { wouldExit: false, reason: "NONE", note: "mark not OK" };
  }
  if (pnl <= -Math.abs(config.stopLossPct)) {
    return { wouldExit: true, reason: "STOP_LOSS", sizeFraction: pos.remainingSizeFraction };
  }
  const peak = pos.peakUnrealizedPnlPct === null ? pnl : Math.max(pos.peakUnrealizedPnlPct, pnl);
  const armed = pos.breakEvenArmed || peak >= config.breakEvenArmPct;
  if (armed && pnl <= config.breakEvenBufferPct) {
    return { wouldExit: true, reason: "BREAK_EVEN", sizeFraction: pos.remainingSizeFraction, armBreakEven: true };
  }
  const nextLeg = config.takeProfitLadder[pos.legsFilled];
  if (nextLeg && pnl >= nextLeg.triggerPnlPct && pos.remainingSizeFraction > 0) {
    const maxSell = Math.max(0, pos.remainingSizeFraction - config.moonBagFraction);
    const frac = Math.min(nextLeg.sizeFraction, maxSell);
    if (frac > 0) {
      return {
        wouldExit: true,
        reason: "TAKE_PROFIT",
        sizeFraction: frac,
        nextLegsFilled: pos.legsFilled + 1,
        armBreakEven: true,
      };
    }
  }
  const trailArmed = peak >= config.trailArmPct;
  const trailStop = peak - config.trailGivebackPct;
  const trailable = Math.max(0, pos.remainingSizeFraction - config.moonBagFraction);
  if (trailArmed && pnl <= trailStop && trailable > 0) {
    return { wouldExit: true, reason: "TRAIL", sizeFraction: trailable, armBreakEven: true };
  }
  const isWinner =
    pnl >= config.timeStopExemptPnlPct ||
    peak >= config.timeStopExemptPnlPct ||
    pos.legsFilled > 0 ||
    trailArmed;
  const aged = pos.holdMs !== null && pos.holdMs >= config.maxHoldMs;
  if (aged && !isWinner) {
    return { wouldExit: true, reason: "TIME_STOP", sizeFraction: pos.remainingSizeFraction };
  }
  return { wouldExit: false, reason: "NONE", armBreakEven: armed };
}

function base(over = {}) {
  return {
    positionId: "p1",
    entryPrice: 100,
    markPrice: 100,
    markStatus: "OK",
    remainingSizeFraction: 1,
    peakUnrealizedPnlPct: null,
    breakEvenArmed: false,
    legsFilled: 0,
    manualExitRequested: false,
    killSwitchActive: false,
    holdMs: 0,
    ...over,
  };
}

assert.equal(pnlPct(100, null, "OK"), null);
assert.equal(evaluateExit(base({ markStatus: "STALE", markPrice: 50, holdMs: 9e12 })).wouldExit, false);
assert.equal(evaluateExit(base({ markPrice: 91 })).reason, "STOP_LOSS");

const armedHold = evaluateExit(base({ markPrice: 107 }));
assert.equal(armedHold.armBreakEven, true);
assert.equal(evaluateExit(base({ markPrice: 100.2, breakEvenArmed: true, peakUnrealizedPnlPct: 7 })).reason, "BREAK_EVEN");

assert.equal(evaluateExit(base({ markPrice: 113 })).sizeFraction, 0.33);
assert.equal(evaluateExit(base({ markPrice: 126, legsFilled: 1, remainingSizeFraction: 0.67 })).sizeFraction, 0.33);
assert.equal(evaluateExit(base({ markPrice: 160, legsFilled: 2, remainingSizeFraction: 0.34 })).sizeFraction, 0.19);

const trail = evaluateExit(base({
  markPrice: 125, peakUnrealizedPnlPct: 40, legsFilled: 3, remainingSizeFraction: 0.34, breakEvenArmed: true,
}));
assert.equal(trail.reason, "TRAIL");

assert.equal(
  evaluateExit(base({ markPrice: 125, peakUnrealizedPnlPct: 40, legsFilled: 3, remainingSizeFraction: 0.15 })).wouldExit,
  false,
);

const fourH = 4 * 60 * 60 * 1000;
assert.equal(evaluateExit(base({ markPrice: 100.5, holdMs: fourH })).reason, "TIME_STOP");
assert.equal(evaluateExit(base({ markPrice: 103, holdMs: fourH })).reason, "NONE");
assert.equal(evaluateExit(base({ markPrice: 101, holdMs: fourH, peakUnrealizedPnlPct: 5 })).reason, "NONE");
assert.equal(evaluateExit(base({ markPrice: 101, holdMs: fourH, legsFilled: 1, remainingSizeFraction: 0.67 })).reason, "NONE");
assert.equal(evaluateExit(base({ markPrice: 100.5, holdMs: fourH - 1 })).reason, "NONE");

console.log("E1+E2+E3+E4 unit checks: PASS");
