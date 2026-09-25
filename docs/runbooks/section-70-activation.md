# Section 70 — Live Trading Activation Runbook

**Audience:** human operators only.  
**AI agents must not mark any precondition as passed or set `manualAdminApproval`.**

Gate implementation: `services/execution/src/live-trading-gate.ts`  
Fixed order: PAPER → TESTNET → RISK → EXECUTION → RECOVERY → MANUAL ADMIN → LIVE

---

## 1. PAPER MODE PASS

**Requires**

- Continuous pipeline in `TRADING_MODE=PAPER` for **≥ 3 calendar days**
- Real RPC (Helius or equivalent), real Postgres, real Redis
- At least one paper fill path producing non-fabricated P&L rows in DB
- Zero unexplained `FAILED` stages attributable to software defects
- Logs retained under `docs/phase-reports/soaks/paper-YYYYMMDD/`

**Evidence package**

- Cycle counts, BLOCK/UNAVAILABLE rates, sample `CycleReport`s
- Screenshots: idle, mid-cycle, RPC-killed, recovered (Wave 8 VERIFY-LIVE)

**Does not count:** unit tests alone, in-memory fixtures, fabricated fills

---

## 2. TESTNET PASS

**Requires**

- Same pipeline on **Solana testnet/devnet** with a **funded test wallet**
- Still `PAPER` or dry-run signing only — no mainnet live keys
- Quote/build/simulate paths exercised against testnet RPC
- Documented differences vs mainnet (liquidity, program IDs)

**Evidence package**

- Testnet RPC endpoint (redacted key), wallet **public** key only
- Job logs showing COMPLETED stages through paper/position

---

## 3. RISK TEST PASS

**Requires** adversarial coverage of:

- Every hard limit in `RiskEngine` (loss, exposure, position size, slippage, impact, …)
- Kill-switch paths: SOFT_PAUSE, HARD_PAUSE, EMERGENCY_EXIT
- Stale quote rejection, expired authorization
- Kill switch blocks `START` on control-gateway

**Evidence package**

- Test matrix table: limit × expected BLOCK code × observed code
- Gateway logs showing START rejected under HARD_PAUSE

---

## 4. EXECUTION TEST PASS

**Requires**

- Dry run with **`RefusingTransactionSigner`** (default) **or** throwaway **devnet** wallet
- `LiveExecutionEngine` path exercised under a **test-only** activation input
  that is **never** promoted to production config
- Confirmation that production process still has `manualAdminApproval: null`

**Does not count:** implementing a mainnet `TransactionSigner` in this step

---

## 5. RECOVERY TEST PASS

**Requires**

- Kill worker **mid-trade** (SIGTERM or process kill)
- Restart; `StartupReconciliationEngine` reconstructs open paper/live intent
- No double-fill; no silent drop of in-flight job without audit row
- `recoveryLiveAllowed` remains false until reconciliation says otherwise

**Evidence package**

- Before/after DB position rows, audit_log excerpts, reconciliation report

---

## 6. MANUAL ADMIN APPROVAL

**Requires**

- Named human admin, out-of-band record (ticket ID, signed note, time)
- Record shape: `{ adminId: string, approvedAt: ISO-8601 }`
- **Never** set via apps/api, apps/web, or automated agent

**On VPS only after 1–5 evidence is filed**

```ts
const decision = gate.evaluate({
  paperModePass: true,   // only if evidence exists
  testnetPass: true,
  riskTestPass: true,
  executionTestPass: true,
  recoveryTestPass: true,
  manualAdminApproval: { adminId: "admin@…", approvedAt: "…" },
});
// If GRANTED → gateway.recordLiveActivation(true) on VPS process
```

Every individual order still needs Risk `AUTHORIZED` (Rule 2).

---

## Display-only surfaces

| Surface | May display Section 70 state? | May set flags? |
|---------|-------------------------------|----------------|
| apps/web | Yes | **No** |
| apps/api | Yes (read) | **No** |
| control-gateway HTTP from the control plane | Status only | **No** |
| VPS process admin procedure | Yes | Yes (out-of-band methods only) |

Grep test: `services/execution/tests/section70-display-only.test.ts`

---

## Current status (2026-09-24)

All six preconditions **NOT PASSED**.  
`productionReady: false` · `liveModeEnabled: false`
