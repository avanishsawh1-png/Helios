# Wave 11 — Section 70 Live Trading Activation Gate

**Date:** 2026-09-24  
**Authority:** HUMAN ONLY for `manualAdminApproval`.  
**AI agents must not grant approval or implement a real TransactionSigner in this wave.**

## Precondition walk (fixed order)

| # | Precondition | Status | What verification requires | Evidence this session |
|---|--------------|--------|----------------------------|------------------------|
| 1 | PAPER MODE PASS | **NOT PASSED** | Multi-day real-devnet soak, real P&L, no fabricated fills | Unit tests only; no multi-day soak log |
| 2 | TESTNET PASS | **NOT PASSED** | Same pipeline on testnet, funded test wallet, PAPER only | Not run |
| 3 | RISK TEST PASS | **NOT PASSED** | Adversarial test of every hard limit + kill-switch path | Unit tests partial; no adversarial suite evidence |
| 4 | EXECUTION TEST PASS | **NOT PASSED** | Dry run with `RefusingTransactionSigner` or throwaway devnet wallet | Refusing signer exists; end-to-end dry run not evidenced |
| 5 | RECOVERY TEST PASS | **NOT PASSED** | Kill mid-trade; `StartupReconciliationEngine` reconstructs state | Unit-tested only; live restart not evidenced |
| 6 | MANUAL ADMIN APPROVAL | **NOT PASSED** | Out-of-band human record (`adminId` + `approvedAt`) | **Must not be set by AI or automated code** |

**LIVE MODE** remains **disabled**.  
`LiveTradingActivationGate.evaluate()` with honest inputs → **DENIED** at step 1.

## Hard rule: Section 70 panel is display-only

No UI element, API route, or control-gateway command type may set:

- `paperModePass`
- `testnetPass`
- `riskTestPass`
- `executionTestPass`
- `recoveryTestPass`
- `manualAdminApproval`
- `liveModeEnabled`

Enforced by:

1. `LiveTradingActivationGate` only **consumes** claims — it never invents them.
2. Gateway `START mode=LIVE` requires `liveActivationRecorded` set via **out-of-band**
   `recordLiveActivation(true)` on the VPS process — not via Hostinger HTTP.
3. Grep test: `apps/api`, `apps/web` must not call `setLiveGateFlag` or write
   Section 70 flags into persistent stores.

## Explicit non-actions this wave

- **Did not** implement a real `TransactionSigner`.
- **Did not** inject wallet private keys.
- **Did not** set `manualAdminApproval`.
- **Did not** mark any of the six preconditions as passed in production config.

## Operator path (when humans are ready)

1. Complete soaks 1–5 with written evidence in `docs/phase-reports/`.
2. Human admin records approval **out-of-band** (ticket / signed note).
3. On VPS only: supply `LiveTradingGateInput` with real claims + approval object
   to `LiveTradingActivationGate.evaluate()`.
4. If `GRANTED`, call `gateway.recordLiveActivation(true)` on the VPS process.
5. Every order still needs independent Risk `AUTHORIZED` (Rule 2).

## productionReady / LIVE

```
productionReady: false
liveModeEnabled: false
Section 70: all preconditions unmet
```

## Runbook

Operator details: `docs/runbooks/section-70-activation.md`
