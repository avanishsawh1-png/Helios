# MASTER_WAVE_O2_REPORT

**Wave:** O2 — Outbound RPC rate limit & 429 policy  
**Date:** 2026-09-25  
**Gate:** `node packages/solana/src/o2-gate.cjs`

Implemented rate-limit class, backoff+jitter, process budget, fail-closed caller.
Primary 429 → backup success covered. Both down → fail closed.
Next: O3 supervisor / crash-loop / single-instance.
