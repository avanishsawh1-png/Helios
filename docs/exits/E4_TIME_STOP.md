# Wave E4 — Time-stop that does not kill winners

**Date:** 2026-09-25  
**Mode:** PAPER deterministic. No LLM.

## Rule

After `maxHoldMs` (default 4h), flatten only if the position is **not** a winner:

Winner exemption if any of:
- current pnl ≥ `timeStopExemptPnlPct` (default +2%)
- peak pnl ≥ that threshold
- any take-profit leg already filled
- peak trail is armed

No mark (STALE/UNAVAILABLE) → no time-stop (cannot know if it is a winner).
