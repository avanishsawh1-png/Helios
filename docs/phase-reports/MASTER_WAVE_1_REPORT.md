# MASTER_WAVE_1_REPORT — Live Solana RPC

**Date:** 2026-09-24  
**Wave:** 1 (Part I)

## Scope

- `packages/solana` live gated tests + health probe + URL redaction
- Optional RPC check on apps/api `GET /health`
- No SolanaProvider surface / retry / breaker changes

## Evidence

See live test run output (when `LIVE_RPC_TEST_URL` set). Health detail fields
must never contain raw api-key values.

## Gate

```
LIVE_RPC_TEST_URL=… LIVE_WS_TEST_URL=… pnpm --filter @helios/solana test
pnpm build && pnpm typecheck && pnpm lint && pnpm test
```
