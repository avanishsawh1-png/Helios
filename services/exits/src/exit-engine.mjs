export const DEFAULT_EXIT_CONFIG = {
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

export function pnlPct(entry, mark, status) {
  if (status !== "OK") return null;
  if (entry == null || mark == null) return null;
  if (!(entry > 0) || !(mark > 0)) return null;
  return ((mark - entry) / entry) * 100;
}

export function evaluateExit(pos, config = DEFAULT_EXIT_CONFIG) {
  const hold = (note) => ({
    wouldExit: false,
    reason: "NONE",
    sizeFraction: 0,
    armBreakEven: Boolean(pos.breakEvenArmed),
    nextLegsFilled: pos.legsFilled ?? 0,
    note,
  });

  if (pos.killSwitchActive) {
    return {
      wouldExit: true,
      reason: "KILL_SWITCH",
      sizeFraction: pos.remainingSizeFraction ?? 1,
      armBreakEven: Boolean(pos.breakEvenArmed),
      nextLegsFilled: pos.legsFilled ?? 0,
      note: "kill switch — full flatten",
    };
  }
  if (pos.manualExitRequested) {
    return {
      wouldExit: true,
      reason: "MANUAL_EXIT",
      sizeFraction: pos.remainingSizeFraction ?? 1,
      armBreakEven: Boolean(pos.breakEvenArmed),
      nextLegsFilled: pos.legsFilled ?? 0,
      note: "manual exit",
    };
  }

  const pnl = pnlPct(pos.entryPrice, pos.markPrice, pos.markStatus);
  if (pnl === null) return hold("mark not OK — no price-based exit (fail closed)");

  if (pnl <= -Math.abs(config.stopLossPct)) {
    return {
      wouldExit: true,
      reason: "STOP_LOSS",
      sizeFraction: pos.remainingSizeFraction ?? 1,
      armBreakEven: Boolean(pos.breakEvenArmed),
      nextLegsFilled: pos.legsFilled ?? 0,
      note: `hard stop ${config.stopLossPct}%`,
    };
  }

  const peak = pos.peakUnrealizedPnlPct == null ? pnl : Math.max(pos.peakUnrealizedPnlPct, pnl);
  const armed = Boolean(pos.breakEvenArmed) || peak >= config.breakEvenArmPct;
  if (armed && pnl <= config.breakEvenBufferPct) {
    return {
      wouldExit: true,
      reason: "BREAK_EVEN",
      sizeFraction: pos.remainingSizeFraction ?? 1,
      armBreakEven: true,
      nextLegsFilled: pos.legsFilled ?? 0,
      note: "break-even",
    };
  }

  const nextLeg = config.takeProfitLadder[pos.legsFilled ?? 0];
  if (nextLeg && pnl >= nextLeg.triggerPnlPct && (pos.remainingSizeFraction ?? 1) > 0) {
    const maxSell = Math.max(0, (pos.remainingSizeFraction ?? 1) - config.moonBagFraction);
    const frac = Math.min(nextLeg.sizeFraction, maxSell);
    if (frac > 0) {
      return {
        wouldExit: true,
        reason: "TAKE_PROFIT",
        sizeFraction: frac,
        armBreakEven: true,
        nextLegsFilled: (pos.legsFilled ?? 0) + 1,
        note: "ladder",
      };
    }
  }

  const trailArmed = peak >= config.trailArmPct;
  const trailable = Math.max(0, (pos.remainingSizeFraction ?? 1) - config.moonBagFraction);
  if (trailArmed && pnl <= peak - config.trailGivebackPct && trailable > 0) {
    return {
      wouldExit: true,
      reason: "TRAIL",
      sizeFraction: trailable,
      armBreakEven: true,
      nextLegsFilled: pos.legsFilled ?? 0,
      note: "trail",
    };
  }

  const isWinner = pnl >= config.timeStopExemptPnlPct || peak >= config.timeStopExemptPnlPct;
  if (pos.holdMs != null && pos.holdMs >= config.maxHoldMs && !isWinner) {
    return {
      wouldExit: true,
      reason: "TIME_STOP",
      sizeFraction: pos.remainingSizeFraction ?? 1,
      armBreakEven: armed,
      nextLegsFilled: pos.legsFilled ?? 0,
      note: "time-stop",
    };
  }

  return hold(trailArmed ? "hold runner" : "hold");
}
