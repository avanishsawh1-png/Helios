/**
 * Wave E3 — Peak trailing stop + moon-bag runner on top of E2.
 * No LLM. No invented marks. STALE/UNAVAILABLE → no price-based exit.
 */

export type ExitReason =
  | "STOP_LOSS"
  | "TAKE_PROFIT"
  | "BREAK_EVEN"
  | "TRAIL"
  | "TIME_STOP"
  | "MANUAL_EXIT"
  | "KILL_SWITCH"
  | "NONE";

export type MarkStatus = "OK" | "STALE" | "UNKNOWN" | "UNAVAILABLE";

export interface LadderLeg {
  /** Trigger when unrealized pnl % >= this value */
  triggerPnlPct: number;
  /** Fraction of remaining size to exit at this leg (0–1) */
  sizeFraction: number;
}

export interface ExitEngineConfig {
  stopLossPct: number;
  /** Once peak/unrealized pnl reaches this %, stop moves to entry + buffer */
  breakEvenArmPct: number;
  /** Extra % above entry for the armed break-even stop (fees/slippage buffer) */
  breakEvenBufferPct: number;
  takeProfitLadder: LadderLeg[];
  /** Peak pnl % that arms the trailing stop */
  trailArmPct: number;
  /** Exit trailable size when pnl <= peak - trailGivebackPct */
  trailGivebackPct: number;
  /** Floor of original size never sold by TP/TRAIL (kill/manual/hard SL still flatten) */
  moonBagFraction: number;
  /** Max hold before a non-winner is time-stopped */
  maxHoldMs: number;
  /** At or above this pnl %, time-stop is skipped (winner protection) */
  timeStopExemptPnlPct: number;
}

export const DEFAULT_E2_CONFIG: ExitEngineConfig = {
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

export const DEFAULT_E3_CONFIG = DEFAULT_E2_CONFIG;


export interface PositionSnapshot {
  positionId: string;
  entryPrice: number | null;
  markPrice: number | null;
  markStatus: MarkStatus;
  remainingSizeFraction: number;
  peakUnrealizedPnlPct: number | null;
  breakEvenArmed: boolean;
  legsFilled: number;
  manualExitRequested: boolean;
  killSwitchActive: boolean;
  holdMs: number | null;
}

export interface ExitDecision {
  wouldExit: boolean;
  reason: ExitReason;
  sizeFraction: number;
  armBreakEven: boolean;
  nextLegsFilled: number;
  note: string;
}

export function pnlPct(entry: number | null, mark: number | null, status: MarkStatus): number | null {
  if (status !== "OK") return null;
  if (entry === null || mark === null) return null;
  if (!(entry > 0) || !(mark > 0)) return null;
  return ((mark - entry) / entry) * 100;
}

export function evaluateExit(
  pos: PositionSnapshot,
  config: ExitEngineConfig = DEFAULT_E2_CONFIG,
): ExitDecision {
  const hold = (reason: ExitReason, note: string): ExitDecision => ({
    wouldExit: false,
    reason,
    sizeFraction: 0,
    armBreakEven: pos.breakEvenArmed,
    nextLegsFilled: pos.legsFilled,
    note,
  });

  if (pos.killSwitchActive) {
    return {
      wouldExit: true,
      reason: "KILL_SWITCH",
      sizeFraction: pos.remainingSizeFraction,
      armBreakEven: pos.breakEvenArmed,
      nextLegsFilled: pos.legsFilled,
      note: "kill switch — full flatten",
    };
  }

  if (pos.manualExitRequested) {
    return {
      wouldExit: true,
      reason: "MANUAL_EXIT",
      sizeFraction: pos.remainingSizeFraction,
      armBreakEven: pos.breakEvenArmed,
      nextLegsFilled: pos.legsFilled,
      note: "manual exit accepted by control plane",
    };
  }

  const pnl = pnlPct(pos.entryPrice, pos.markPrice, pos.markStatus);
  if (pnl === null) {
    return hold("NONE", "mark not OK — no price-based exit (fail closed)");
  }

  if (pnl <= -Math.abs(config.stopLossPct)) {
    return {
      wouldExit: true,
      reason: "STOP_LOSS",
      sizeFraction: pos.remainingSizeFraction,
      armBreakEven: pos.breakEvenArmed,
      nextLegsFilled: pos.legsFilled,
      note: `hard stop ${config.stopLossPct}%`,
    };
  }

  const peak = pos.peakUnrealizedPnlPct === null ? pnl : Math.max(pos.peakUnrealizedPnlPct, pnl);
  const armed = pos.breakEvenArmed || peak >= config.breakEvenArmPct;

  if (armed && pnl <= config.breakEvenBufferPct) {
    return {
      wouldExit: true,
      reason: "BREAK_EVEN",
      sizeFraction: pos.remainingSizeFraction,
      armBreakEven: true,
      nextLegsFilled: pos.legsFilled,
      note: `break-even stop after arm at ${config.breakEvenArmPct}%`,
    };
  }

  const nextLeg = config.takeProfitLadder[pos.legsFilled];
  if (nextLeg && pnl >= nextLeg.triggerPnlPct && pos.remainingSizeFraction > 0) {
    const moonFloor = config.moonBagFraction;
    const maxSell = Math.max(0, pos.remainingSizeFraction - moonFloor);
    const frac = Math.min(nextLeg.sizeFraction, maxSell);
    if (frac > 0) {
      return {
        wouldExit: true,
        reason: "TAKE_PROFIT",
        sizeFraction: frac,
        armBreakEven: true,
        nextLegsFilled: pos.legsFilled + 1,
        note: `ladder leg ${pos.legsFilled + 1} @ ${nextLeg.triggerPnlPct}% (moon-bag floor ${moonFloor})`,
      };
    }
  }

  const trailArmed = peak >= config.trailArmPct;
  const trailStop = peak - config.trailGivebackPct;
  const trailable = Math.max(0, pos.remainingSizeFraction - config.moonBagFraction);
  if (trailArmed && pnl <= trailStop && trailable > 0) {
    return {
      wouldExit: true,
      reason: "TRAIL",
      sizeFraction: trailable,
      armBreakEven: true,
      nextLegsFilled: pos.legsFilled,
      note: `peak trail ${peak.toFixed(2)}% → stop ${trailStop.toFixed(2)}%; moon-bag ${config.moonBagFraction} held`,
    };
  }

  const isWinner =
    pnl >= config.timeStopExemptPnlPct ||
    peak >= config.timeStopExemptPnlPct ||
    pos.legsFilled > 0 ||
    trailArmed;
  const aged =
    pos.holdMs !== null && pos.holdMs >= config.maxHoldMs;
  if (aged && !isWinner) {
    return {
      wouldExit: true,
      reason: "TIME_STOP",
      sizeFraction: pos.remainingSizeFraction,
      armBreakEven: armed,
      nextLegsFilled: pos.legsFilled,
      note: `time-stop after ${pos.holdMs}ms; not a winner (pnl ${pnl.toFixed(2)}%)`,
    };
  }

  return {
    wouldExit: false,
    reason: "NONE",
    sizeFraction: 0,
    armBreakEven: armed,
    nextLegsFilled: pos.legsFilled,
    note: trailArmed ? "hold runner; trail armed" : armed ? "hold; break-even armed" : "hold",
  };
}
