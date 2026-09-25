# MASTER_WAVE_3_REPORT — Metaplex metadata

**Date:** 2026-09-24  
**Wave:** 3

## Verified

- Program: `metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s`
- PDA seeds: `["metadata", program_id, mint]` (BONK → `FDZZ…`)
- Live account key=4, mint match, name/symbol/uri decoded
- Token-2022 path returns distinct status

## Tests

7 unit tests passed (PDA, key≠4, truncated, mint mismatch, live fixture)

## Gate

```
pnpm --filter @helios/service-token-analysis test:unit
```
