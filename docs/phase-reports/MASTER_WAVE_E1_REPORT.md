# MASTER_WAVE_E1_REPORT

**Wave:** E1 — Exit baseline metrics  
**Date:** 2026-09-25  
**Result:** IMPLEMENTED (observation layer). Behavior of ExitEngine unchanged.

## Done

- `services/exits/src/baseline-metrics.ts` — collector + null-safe PnL
- Tests: null never becomes 0; STALE/UNAVAILABLE excluded from median
- Policy: `docs/exits/E1_BASELINE.md`
- Min sample n=30 → `INSUFFICIENT_SAMPLE`

## Evidence required for PASS of the *baseline number*

A PAPER soak with n≥30 real evaluate() observations across high/low volume.
This package ships the harness; soak numbers are not fabricated.

Current soak: **INSUFFICIENT_SAMPLE** (harness-only fixtures, n=2 and n=29 in tests).

## Not done (later waves)

- E2 break-even + ladder
- E3 peak trail + moon-bag
- E4 time-stop that does not kill winners
- E5 PAPER verification policy for LIVE (still forbidden)

## Gate

Unit tests for this module are self-contained. Full monorepo
`pnpm build && pnpm typecheck && pnpm lint && pnpm test` must be re-run
in the complete Helios workspace (this zip is a partial source handoff).
