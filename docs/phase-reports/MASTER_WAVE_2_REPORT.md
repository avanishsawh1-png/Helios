# MASTER_WAVE_2_REPORT — Pump.fun log parsing

**Date:** 2026-09-24  
**Wave:** 2

## Verified against live mainnet

- Program ID `6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P`
- TradeEvent discriminator matches live `Program data` (Helius getTransaction)
- Official IDL from pump-public-docs (SHA-256 pinned)

## Honest gap

- CreateEvent live log not captured this session (HTTP 429 while paging).
  Parser implements IDL field order; synthetic create unit test included.

## Gate

```
pnpm --filter @helios/service-discovery test:unit
```
