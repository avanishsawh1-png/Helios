# MASTER_WAVE_4_REPORT — PumpSwap pool parsing

**Date:** 2026-09-24  
**Wave:** 4

## Primary destination

PumpSwap `pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA` (post-2025-03-20)

## IDL PDA seeds

`["pool", index_u16_le, creator, base_mint, quote_mint]`

## Tests

Unit tests for PDA stability, index sensitivity, wrong owner, synthetic decode.

## Gate

```
pnpm --filter @helios/service-migration test:unit
```
