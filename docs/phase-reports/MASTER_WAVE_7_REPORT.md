# MASTER_WAVE_7_REPORT — Live transaction simulation

**Date:** 2026-09-24  
**Wave:** 7

## Config

`{ encoding: "base64", sigVerify: false, replaceRecentBlockhash: true, commitment: "confirmed" }`

## Rule preserved

`passed` = AND of five checks — not a pass-through of RPC success.

## Gate

```
pnpm --filter @helios/service-transaction-simulator test
```
