# Wave E1 — Exit baseline metrics (no behavior change)

**Date:** 2026-09-25  
**Mode:** PAPER observation only  
**Rule:** G1–G5, G16. No LLM in `ExitEngine.evaluate()`.

## Scope

Instrument **what already happens**. Do not add break-even, trail, time-stop,
or moon-bag logic in this wave (those are E2–E4).

## Metrics collected

| Field | Source | Unknown handling |
|---|---|---|
| wouldExit | existing evaluate() boolean | never inferred |
| reason | existing ExitReason | NONE if hold |
| unrealizedPnlPct | (mark-entry)/entry only if markStatus=OK | `null` → `—` |
| unpricedCount | markStatus ≠ OK or markPrice null | separate cohort |
| n / window | observation count + ISO bounds | INSUFFICIENT_SAMPLE if n < 30 |

## Floor

`E1_MIN_SAMPLE = 30`. Below that, report `insufficientSample: true` and do
not claim a baseline rate as fact.

## Explicit non-changes

- No change to hard risk limits
- No call to `recordExit` from this collector
- No LIVE claim
- No 5x–50x capture claim
