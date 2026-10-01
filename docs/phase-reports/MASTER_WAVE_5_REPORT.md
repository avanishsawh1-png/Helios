# MASTER_WAVE_5_REPORT — Jupiter live quotes

**Date:** 2026-09-24  
**Wave:** 5

## Endpoint

`GET https://api.jup.ag/swap/v1/quote` (not deprecated quote-api.jup.ag/v6)

## Fail-closed

429 / 4xx / 5xx / network / bad JSON → unavailable (throws).  
Missing outAmount → null (no route). Never fabricate a quote.

## Gate

```
pnpm --filter @helios/service-quote test
```
