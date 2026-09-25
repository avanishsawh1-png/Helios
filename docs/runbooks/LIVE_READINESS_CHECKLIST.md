# LIVE readiness checklist (read-only)

**Date:** 2026-09-25  
**Generated after:** C6 34/34, Wave 33–35 gates  
**This file cannot set flags.** No signer. Live trading mode is not enabled.  
**manualAdminApproval remains human-only and unchecked.**

## How to read this page

| Column | Meaning |
|---|---|
| Unit / library | In-tree Node gates in this zip |
| Operational Section 70 | Real RPC + DB + soak evidence (G1–G5) |
| Agent may check | Never Section 70 rows |

Unit PASS does **not** equal Section 70 PASS.

## A. In-tree gates (2026-09-25 this session)

| Item | Result |
|---|---|
| C6 regression | PASS n=34 |
| E5 exit fixtures | PASS; soak n=0 INSUFFICIENT_SAMPLE |
| O1–O4 process/RPC/WS guards | PASS |
| O5 24/7 evidence | INSUFFICIENT_SAMPLE n_hours=0 |
| Leniency A–D trading+auth | 0 UNSAFE_LENIENT |
| Interference (hooks vs RiskPort) | PASS fail-open |
| Wave 35 flags | unchecked; Wave 36 not built |

## B. Section 70 operational preconditions

| # | Precondition | Unit / library | Operational | Left for human |
|---|---|---|---|---|
| 1 | PAPER MODE PASS | fixture/unit PASS | **NOT PASSED** (no 3-day soak logs) | operator soak package |
| 2 | TESTNET PASS | not executed here | **NOT PASSED** | funded testnet drill |
| 3 | RISK TEST PASS | hard-limit unit PASS | **NOT PASSED** | adversarial drill on real stack |
| 4 | EXECUTION TEST PASS | refusing-signer / dry path inherited | **NOT PASSED** | dry-run against real stack |
| 5 | RECOVERY TEST PASS | O1 drain unit PASS | **NOT PASSED** | process restart vs live PG/RPC |
| 6 | MANUAL ADMIN APPROVAL | must stay null in code | **unchecked** | owner out-of-band only |
| 7 | LIVE MODE | forbidden in this session | **off** | only after 1–6 |

So the only *code* flag this repo must not touch is **#6**.  
Items **1–5 are not cleared operationally**. They are not “already done.”

## C. Other blockers (not Section 70 flags)

- Wallet module / live secrets not in this session  
- Backup restore not proven against real Postgres  
- Full monorepo `pnpm` CI not run in this sandbox  
- `forbidLiveSecrets` on a real VPS not shown here  

## D. Explicit non-actions in this file

- Does not write `manualAdminApproval`  
- Does not enable LIVE  
- Does not add a TransactionSigner  
- Does not build Wave 36  
- Does not move funds  
