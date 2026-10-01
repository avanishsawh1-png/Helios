import { describe, expect, it } from "vitest";
import {
  E1_MIN_SAMPLE,
  ExitBaselineCollector,
  computeUnrealizedPnlPct,
  formatUnknown,
} from "./baseline-metrics.js";

describe("Wave E1 exit baseline (no behavior change)", () => {
  it("never collapses null / non-OK marks into 0 pnl", () => {
    expect(computeUnrealizedPnlPct(1, null, "OK")).toBeNull();
    expect(computeUnrealizedPnlPct(null, 2, "OK")).toBeNull();
    expect(computeUnrealizedPnlPct(1, 2, "STALE")).toBeNull();
    expect(computeUnrealizedPnlPct(1, 2, "UNAVAILABLE")).toBeNull();
    expect(computeUnrealizedPnlPct(1, 2, "UNKNOWN")).toBeNull();
    expect(formatUnknown(null)).toBe("—");
    expect(formatUnknown(0)).toBe("0");
  });

  it("computes pct only when mark is OK and prices are positive", () => {
    expect(computeUnrealizedPnlPct(100, 110, "OK")).toBeCloseTo(10);
    expect(computeUnrealizedPnlPct(0, 110, "OK")).toBeNull();
  });

  it("records observations without inventing an exit decision", () => {
    const c = new ExitBaselineCollector("e1-fixture");
    c.record({
      positionId: "p1",
      mint: "Mint111",
      mode: "PAPER",
      reason: "NONE",
      wouldExit: false,
      entryPrice: 1,
      markPrice: 1.05,
      markStatus: "OK",
      unrealizedPnlPct: null,
      holdMs: 60_000,
      observedAt: "2026-09-25T16:00:00.000Z",
    });
    c.record({
      positionId: "p2",
      mint: "Mint222",
      mode: "PAPER",
      reason: "STOP_LOSS",
      wouldExit: true,
      entryPrice: 1,
      markPrice: null,
      markStatus: "STALE",
      unrealizedPnlPct: null,
      holdMs: 10_000,
      observedAt: "2026-09-25T16:01:00.000Z",
    });

    const snap = c.snapshot();
    expect(snap.n).toBe(2);
    expect(snap.wouldExitCount).toBe(1);
    expect(snap.reasonCounts.NONE).toBe(1);
    expect(snap.reasonCounts.STOP_LOSS).toBe(1);
    expect(snap.unpricedCount).toBe(1);
    expect(snap.nullPnlCount).toBe(1);
    expect(snap.medianUnrealizedPnlPct).toBeCloseTo(5);
    expect(snap.insufficientSample).toBe(true);
    expect(snap.n < E1_MIN_SAMPLE).toBe(true);
  });

  it("marks INSUFFICIENT_SAMPLE below n=30", () => {
    const c = new ExitBaselineCollector("tiny");
    for (let i = 0; i < 29; i += 1) {
      c.record({
        positionId: `p${i}`,
        mint: "m",
        mode: "PAPER",
        reason: "NONE",
        wouldExit: false,
        entryPrice: 1,
        markPrice: 1,
        markStatus: "OK",
        unrealizedPnlPct: null,
        holdMs: 1,
        observedAt: "2026-09-25T16:00:00.000Z",
      });
    }
    expect(c.snapshot().insufficientSample).toBe(true);
  });
});
