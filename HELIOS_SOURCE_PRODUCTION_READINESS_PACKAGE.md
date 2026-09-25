# HELIOS — Source Production-Readiness Package

**Generated:** 2026-09-24 16:20 UTC  
**Scope:** Consolidated handoff of wave implementations (B1–B7, 1–11, D1–D5)  
**Verdict:** `productionReady: false` · Section 70 **closed** · PAPER-only

This single document packages implementation inventory, evidence, and operator
next steps for production readiness review. It does **not** claim PRODUCTION READY.

---

## 1. Executive status

| Gate | Status |
|------|--------|
| Section 69 production checklist | Partially verified (RPC/WS/public backup); wallet/secrets/backups/recovery open |
| Section 70 live activation | All six preconditions **NOT PASSED** |
| Control-plane UI | D1–D5 delivered; **human UI sign-off pending** |
| Trading mode | **PAPER only** — `assertPaperMode` refuses LIVE at pipeline worker start |
| Execution | `RefusingTransactionSigner` / inert until Section 70 |

```
productionReady: false
liveModeEnabled: false
```

---

## 2. Wave implementation inventory

### Part 0.5 — Edge (B1–B7)

| Wave | Focus | Key artifacts |
|------|--------|----------------|
| B1 | CORS allowlist, rate limit, security headers | `apps/api/src/middleware/*` |
| B2 | WebSocket RBAC | control-gateway |
| B3 | Secret redaction | shared logger |
| B4 | DB role scope `helios_readonly` | migration 0014 |
| B5–B7 | Shutdown, health live/ready, dependency audit | api server / docs |

### Part I — Discovery → paper path (1–8B)

| Wave | Focus | Key artifacts |
|------|--------|----------------|
| 1 | Live RPC probe / health | `packages/solana`, api health |
| 2 | Pump.fun log parse | `services/discovery` |
| 3 | Metaplex metadata | `services/token-analysis`, `packages/solana` |
| 4 | PumpSwap pool PDA/decode | `services/migration/src/pumpswap/*` |
| 5 | Jupiter live quotes | `services/quote/src/providers/jupiter-client.ts` |
| 6 | Helius wallet txs | `services/smart-money/src/providers/helius-*` |
| 7 | Live simulateTransaction | `services/transaction-simulator/.../live-rpc-simulate-client.ts` |
| 8 | PAPER pipeline continuous run | `workers/pipeline` (`assertPaperMode`, `UNAVAILABLE`) |
| 8B | Postgres read models | `PostgresControlPlaneDataSource`, `readOnlyQuery` |

### Part I — Ops / gate (9–11)

| Wave | Focus | Key artifacts |
|------|--------|----------------|
| 9 | CI, Docker, backups, secrets docs | `.github/workflows/ci.yml`, `infrastructure/backup/*` |
| 10 | Production-gate verification pass | Live Helius RPC/WS evidence; `productionReady` still false |
| 11 | Section 70 human-only | Runbook + display-only tests; no TransactionSigner |

### Part II — Dashboard (D1–D5)

| Wave | Focus | Key artifacts |
|------|--------|----------------|
| D1 | Design spec | `docs/design/dashboard-spec.md` |
| D2 | UI primitives | `apps/web/src/ui/*` |
| D3 | Read API contracts | `/v1/readiness`, risk/funnel/series/events |
| D4 | Dashboard assembly | `Dashboard.tsx`, `usePolledAvailability` |
| D5 | Acceptance package | `docs/design/acceptance/*` |

---

## 3. Source files present in this tree (handoff checklist)

### Present (33)

- `apps/api/src/middleware/cors.ts`
- `apps/api/src/middleware/rate-limit.ts`
- `apps/api/src/middleware/security-headers.ts`
- `services/token-analysis/src/metadata/decode-metadata.ts`
- `packages/solana/src/rpc-health.ts`
- `services/migration/src/pumpswap/constants.ts`
- `services/migration/src/pumpswap/find-pool-pda.ts`
- `services/migration/src/pumpswap/decode-pool.ts`
- `services/migration/src/pumpswap/verify-pool.ts`
- `services/quote/src/providers/jupiter-client.ts`
- `services/smart-money/src/providers/helius-transactions-provider.ts`
- `services/smart-money/src/providers/helius-trade-activity-source.ts`
- `services/transaction-simulator/src/providers/live-rpc-simulate-client.ts`
- `workers/pipeline/src/paper-mode.ts`
- `workers/pipeline/src/cycle-report.ts`
- `workers/pipeline/src/orchestrator.ts`
- `packages/database/src/read-only-query.ts`
- `apps/api/src/data/postgres-data-source.ts`
- `.github/workflows/ci.yml`
- `infrastructure/backup/pg_dump_backup.sh`
- `infrastructure/backup/pg_restore_test.sh`
- `docs/architecture/secrets.md`
- `docs/runbooks/section-70-activation.md`
- `services/execution/tests/section70-display-only.test.ts`
- `docs/design/dashboard-spec.md`
- `apps/web/src/ui/DataState.tsx`
- `apps/web/src/ui/ModeBanner.tsx`
- `apps/web/src/ui/ChartFrame.tsx`
- `apps/web/src/lib/usePolledAvailability.ts`
- `apps/web/src/lib/mapDataRead.ts`
- `apps/web/src/pages/Dashboard.tsx`
- `apps/api/src/handlers/read-models.ts`
- `apps/api/src/data/types.ts`

### Referenced but missing in tree (2)

- `services/discovery/sources/pumpfun-parse.ts`
- `packages/solana/src/metadata/find-metadata-pda.ts`


---

## 4. Honesty / fail-closed invariants (do not regress)

1. **No fake functionality** — UNAVAILABLE with reason when data cannot be verified  
2. **null ≠ 0** — UI renders `—`; portfolio never invents equity  
3. **EMPTY ≠ UNAVAILABLE**  
4. **Section 70 display-only** on control plane — no UI/API sets activation flags  
5. **Pipeline refuses LIVE** via `assertPaperMode`  
6. **simulateTransaction** never treats RPC success alone as `passed` (five-check AND)  
7. **readOnlyQuery** rejects SQL write verbs  
8. **Jupiter / Helius** fail closed on 429/5xx/network  

---

## 5. Live evidence captured (Wave 10)

| Probe | Result |
|-------|--------|
| Helius `getHealth` | `ok` |
| Helius `getSlot` | live slot observed |
| Helius WSS `slotSubscribe` | subscription id returned |
| Public mainnet-beta HTTP | `getHealth` ok (backup path) |

Wallet, secrets rotation, live `pg_restore_test`, full monorepo CI green: **not verified**.

---

## 6. Environment wiring (operator)

```bash
# Trading runtime (.env.vps) — gitignored
SOLANA_RPC_PRIMARY=https://mainnet.helius-rpc.com/?api-key=<KEY>
SOLANA_WS_PRIMARY=wss://mainnet.helius-rpc.com/?api-key=<KEY>
TRADING_MODE=PAPER
JUPITER_API_KEY=<optional>
DATABASE_URL=postgres://helios_app:...
DATABASE_READONLY_URL=postgres://helios_readonly:...

# Control plane (.env.control-plane) — no wallet keys
```

Rotate any key that appeared in chat. See `docs/architecture/secrets.md`.

---

## 7. Operator production-readiness checklist

- [ ] `pnpm install --frozen-lockfile && pnpm build && pnpm typecheck && pnpm test` green on CI  
- [ ] `helios_app` password ≠ `change_me_in_production`  
- [ ] `./infrastructure/backup/pg_dump_backup.sh` + `pg_restore_test.sh` succeed  
- [ ] Dashboard screenshots attached under `docs/design/acceptance/screenshots/`  
- [ ] Section 70 soaks 1–5 evidenced per `docs/runbooks/section-70-activation.md`  
- [ ] Human `manualAdminApproval` only if deliberately going live (not required for PAPER)  

---

## 8. Reports index

All wave reports: `docs/phase-reports/MASTER_WAVE_*.md`  
Changelog: `CHANGELOG.md`  
Gate file: `PRODUCTION_READINESS.md`  
Gaps: `KNOWN_ISSUES.md`  
UI acceptance: `docs/design/acceptance/`  

---

## 9. Explicit non-claims

- This package is **not** authorization to enable LIVE trading  
- Full monorepo test/build was **not** proven green in the agent environment  
- UI acceptance is **not** human-signed  
- `services/execution` remains structurally gated  

**End of production-readiness source package.**
