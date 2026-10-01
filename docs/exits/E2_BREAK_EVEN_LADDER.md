# Wave E2 — Break-even stop + multi-leg take-profit ladder

**Date:** 2026-09-25  
**Mode:** PAPER deterministic ExitEngine only. No LLM.

## Behavior

Priority (capital protection first):

1. `KILL_SWITCH` — flatten remaining size  
2. `MANUAL_EXIT` — flatten remaining size  
3. No OK mark → hold (`NONE`); never invent a price  
4. Hard `STOP_LOSS` if pnl ≤ −`stopLossPct` (default 8%)  
5. If break-even **armed** (peak pnl ≥ 6%) and pnl ≤ buffer (0.3%) → `BREAK_EVEN` flatten  
6. Next unfilled ladder leg if pnl ≥ trigger → partial `TAKE_PROFIT`  
7. Else hold; may set `armBreakEven`

Default ladder: 33% @ +12%, 33% @ +25%, 34% @ +50%.

## Non-goals

Trail / moon-bag (E3), time-stop (E4), LIVE claims (E5). Hard risk limits unchanged.
