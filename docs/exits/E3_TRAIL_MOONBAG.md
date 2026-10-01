# Wave E3 — Peak trailing stop + moon-bag runner

**Date:** 2026-09-25  
**Mode:** PAPER deterministic. No LLM.

## Behavior added on top of E2

- Trail arms when peak unrealized pnl ≥ `trailArmPct` (default 20%).
- Trail fires when current pnl ≤ peak − `trailGivebackPct` (default 8 points).
- Trail sells only `remaining − moonBagFraction` (default bag 15%).
- Take-profit legs cannot sell through the moon-bag floor.
- Hard SL / kill / manual still flatten the bag (capital protection).

Default ladder restated so 33+33+19 = 85% scaled out, 15% runner.
