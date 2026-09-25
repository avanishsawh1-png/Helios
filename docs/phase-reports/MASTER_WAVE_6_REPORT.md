# MASTER_WAVE_6_REPORT — Helius wallet activity

**Date:** 2026-09-24  
**Wave:** 6

## Method

`getTransactionsForAddress` via Helius JSON-RPC (up to 1000 txs / call).

## Semantics

empty ≠ ok; null blockTime preserved; classification in SmartMoneyEngine.

## Gate

```
pnpm --filter @helios/service-smart-money test
```
