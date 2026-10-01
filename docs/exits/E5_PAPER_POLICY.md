# Exit policy — PAPER (Wave E5)

**Status:** PAPER only. `TRADING_MODE=LIVE` is not authorized by this document.  
**Engine:** deterministic `evaluateExit` only. No LLM inside `ExitEngine.evaluate()`.  
**Date:** 2026-09-25

## Capital-protection order

1. Kill switch — flatten all remaining size  
2. Manual exit — flatten all remaining size  
3. Missing / STALE / UNAVAILABLE mark — **hold** (never invent a price)  
4. Hard stop-loss (−8%) — flatten including moon-bag  
5. Armed break-even (peak ≥ +6%, pnl ≤ +0.3%) — flatten  
6. Take-profit ladder — 33% @ +12%, 33% @ +25%, 19% @ +50%, never through 15% bag  
7. Peak trail — arm +20% peak, giveback 8 points; leave moon-bag  
8. Time-stop — after 4h **only if not a winner** (pnl/peak < +2%, no legs, trail not armed)  
9. Else hold  

## What E5 does and does not claim

| Claim | Allowed after E5? |
|---|---|
| Deterministic fixture matrix passes | Yes, if gate is green |
| PAPER soak n≥30 real marks | Only with attached soak evidence |
| 5x–50x capture | **No** — needs soak metrics, not this wave |
| LIVE trading | **No** — Section 70 human-only |
| LLM exit advice | **No** |

## Operator check before any later wiring

- Collector / worker must treat evaluate throws as fail-open for *pipeline scoring* and fail-closed for *sends*  
- `recordExit` stays outside this module until a human wires PAPER settlement  
- Hard risk limits unchanged  
