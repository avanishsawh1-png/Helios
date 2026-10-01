# CHANGELOG.md

## Dashboard/API wiring scan (2026-09-26)

- Public GET funnel/positions/portfolio/risk/series/balances
- Status fields match dashboard (reportedMode/health)
- Readiness includes `liveTradingGate` wrapper
- Equity USD stays null (not invented)

## Live adapter + engine (2026-09-26)


- `LiveChainAdapter` quote/build/simulate/send (send refused)
- `LiveExecutionEngine` uses IsolatedSigner + Section 70
- Pipeline + `POST /v1/live/preview` call the real engine
- live-engine-gate imports shipped modules

## SOL balances on dashboard (2026-09-26)


- `GET /v1/balances` paper + live pubkeys via `getBalance`
- Dashboard tiles; `liveTradingEnabled` stays false

## S10 Section 70 human-only (2026-09-26)


- Checklist + gate assert every S70 box still false/null
- Agent does not set flags

## S9 Soak (2026-09-26)


- `classifySoak`: n<20 → INSUFFICIENT_SAMPLE; live submit → UNAVAILABLE
- Report always `paperModePass: false`

## S8 Hostinger compose (2026-09-26)


- Signer service internal-only; `HELIOS_SIGNER_ENABLE=0`
- `docs/deployment/HOSTINGER.md` PAPER compose steps

## S7 Confirm/recon (2026-09-26)


- Paper confirm only; unexpected signature rejected
- Chain reconcile blocked while Section 70 closed
- Recovery fails on live_submitted rows

## S6 Isolated signer (2026-09-26)


- `workers/signer` refuses by default; `/v1/wallet` exposes pubkey only
- API does not load WALLET_PRIVATE_KEY

## S5 Positions/exits (2026-09-26)


- Pipeline uses `services/exits/src/exit-engine.mjs` (SL/BE/TP/trail/time/kill)
- UNAVAILABLE mark → no price exit; legs persisted on the position

## S4 Quote/build/sim (2026-09-26)


- Jupiter quote/swap retry on 429/5xx (3 attempts)
- 8s abort; still no swap without PAPER_WALLET_PUBKEY
- `scripts/run-step-gates.cjs` runs S1–S4 + e2e

## S3 Postgres state (2026-09-26)


- `persistState` writes file always; Postgres when `DATABASE_URL` + `pg` available
- `0009_pipeline_state.sql` — `live_submitted` defaults FALSE

## S2 Feature feeds (2026-09-26)


- `fetchSmartMoney`: no key → null; empty Helius → 0; unique fee-payers / 20
- Removed fake 0.5 token-metadata bonus

## S1 Types/CI (2026-09-26)


- Root `test` / `ci` run `scripts/ci-local.cjs` (same gates as GHA)
- Honest `typecheck` / `build` status scripts (not fake tsc PASS)
- No frozen lockfile until pnpm-lock exists

## Final audit (2026-09-25)


- O1 gate imports `graceful-shutdown.mjs`
- Web client fetch fail-closed
- FINAL_AUDIT.md

## Real-module gates + boot wiring (2026-09-25)


- AuthEngine imported by `server.mjs`; cycle/funnel/positions require auth
- Password guard imported and run at API boot
- auth-gate / password-guard-gate import those modules (no inline copies)
- `discover-mints.ts` fetch is try/catch fail-closed (matches .mjs)
- `scripts/gate-import-hygiene.cjs` guards against toy-copy gates

## Paper+live wired, S70 closed (2026-09-25)


- CI runs node gates (no frozen lockfile / missing turbo scripts)
- AuthEngine + RBAC verify
- Discovery includes `meta.loadedAddresses` (v0 lookup tables)
- Production rejects placeholder DB passwords
- `GatedLiveRuntime` submit path exists; default gate closed; no broadcast

## Blocker wiring (2026-09-25)


- RPC pool + backup endpoint
- Jupiter lite quote / optional swap ix / RPC simulate / paper ledger fill
- packages/config, wallet (pubkey only), services/monitoring
- paper-soak script (INSUFFICIENT_SAMPLE unless n≥20)
- Section 70 boxes still unchecked

## Phase audit + discovery tx v1 (2026-09-25)


- Pump.fun getTransaction uses maxSupportedTransactionVersion 1
- Parse inner instructions
- Phase audit runner + PHASE_AUDIT.md
- Public RPC 429 treated as UNAVAILABLE

## Discovery pump.fun wiring (2026-09-25)


- Added `services/discovery/src/sources/pumpfun-parse.ts`
- Added `packages/solana/src/metadata/find-metadata-pda.ts`
- Discover/analyze consume live pump.fun creates or PAPER_MINTS; no invented mints

## Hostinger VPS topology (2026-09-25)


- Removed Replit as the control-plane host
- Env files: `.env.control-plane` / `.env.trading-runtime` / `.env.vps`
- Compose api/web load `.env.control-plane` on Hostinger

## Live engine wiring, gate closed (2026-09-25)


### Added
- `@helios/execution` LiveExecutionEngine + Section 70 gate
- RefusingTransactionSigner (no keys)
- Pipeline `liveAttempt.submitted=false`
- Gate `services/execution/src/live-engine-gate.cjs`

### Not done
- Flags remain closed. No broadcast. No LIVE boot.

## Package dependencies (2026-09-25)


- Declared workspace:* and npm deps on packages that import them
- `@helios/solana` / `@helios/database` index exports

## Monorepo packing (2026-09-25)


- `pnpm-workspace.yaml` + package.json on all 14 present packages
- `scripts/pack-check.cjs`
- Honest list of packages not in this handoff

## Gap scan implement (2026-09-25)


- Control-gateway command re-validation
- Analyze EMPTY vs mint list CONTINUE
- Jupiter priceUsd null when absent
- migrate.mjs schema file check

## Leftover PAPER wiring (2026-09-25)


### Added
- 11-stage `paper-system.mjs` + API read routes + dashboard client
- leftover e2e vs public getSlot; no fills

### Still operator
- VPS, soaks, Section 70, full quote/build/simulate adapters

## Scan + PAPER e2e (2026-09-25)


### Fixed
- Missing pipeline/api/web/provider type stubs
- C4 allowlist for stage gates / worker / e2e

### Added
- `workers/pipeline/src/paper-e2e.mjs` (public RPC observe, no swap)
- `docs/phase-reports/SCAN_REVIEW.md`

## Stage 4 §22 — Readiness revisit (2026-09-25)


### Changed
- `PRODUCTION_READINESS.md` notes scoring-loop libraries exist
- Section 70 flags still all false/null

## Stage 4 §21 — Policy metrics (2026-09-25)


### Added
- `packages/agents/src/policy-metrics.ts`
- EMPTY vs INSUFFICIENT_SAMPLE preserved
- Gate `packages/agents/src/stage4-21-gate.cjs`

## Stage 4 §20 — Policy promotion gate (2026-09-25)


### Added
- `packages/agents/src/policy-promote.ts`
- Agent / sample / window / no-edge rejects
- Gate `packages/agents/src/stage4-20-gate.cjs`

## Stage 4 §19 — Policy shadow (2026-09-25)


### Added
- `packages/agents/src/policy-shadow.ts`
- Null feature → null score
- Gate `packages/agents/src/stage4-19-gate.cjs`

## Stage 4 §18 — Reflection / proposal (2026-09-25)


### Added
- `packages/agents/src/policy-propose.ts`
- Cluster nudges; insufficient eval rejected
- Gate `packages/agents/src/stage4-18-gate.cjs`

## Stage 4 §17 — scoring_policy_versions (2026-09-25)


### Added
- SQL + `packages/agents/src/policy-versions.ts`
- Weights must sum to 1; agent cannot activate
- Gate `packages/agents/src/stage4-17-gate.cjs`

## Stage 3 §16 — Policy evaluation (2026-09-25)


### Added
- `packages/agents/src/policy-eval.ts`
- Min n=20; null PnL excluded from averages
- Gate `packages/agents/src/stage3-16-gate.cjs`

## Stage 3 §15 — agent_run_outcomes (2026-09-25)


### Added
- `services/migration/src/agent_run_outcomes.sql`
- `packages/agents/src/run-outcomes.ts`
- Gate `packages/agents/src/stage3-15-gate.cjs`

## Stage 3 §14 — Run instrumentation (2026-09-25)


### Added
- `packages/agents/src/run-instrumentation.ts`
- runId + policyVersion + snapshot on SCORE/SIGNAL
- Gate `packages/agents/src/stage3-14-gate.cjs`

## Stage 1 deploy artifacts (2026-09-25)


### Added
- Per-app Dockerfiles + PAPER health stubs
- `docker-compose.prod.yml` (gateway expose-only)
- nginx template, env examples, migrate/backup scripts
- `docs/deployment/BUILD_PLAN_STATUS.md`

### Not done
- Hostinger VPS login, TLS, real compose up
- Section 70 / LIVE

## Read-only LIVE readiness checklist (2026-09-25)


### Added
- `docs/runbooks/LIVE_READINESS_CHECKLIST.md`
- Unit gates re-run (C6 34/34, 33–35 PASS)
- Operational Section 70 1–5 remain NOT PASSED
- No flags, no signer, no LIVE

## Wave 35 — Acceptance report (2026-09-25)


### Added
- `docs/phase-reports/MASTER_ACCEPTANCE_REPORT.md`
- Section 70 checklist remains unchecked
- Wave 36 not started
- STOP for automated implementation

## Wave 34 — Interference check (2026-09-25)


### Added
- `packages/agents/src/interference.ts`
- Proof hooks fail-open vs RiskPort
- LIVE not granted

## Wave 33 — Leniency + intelligence acceptance (2026-09-25)


### Added
- `packages/agents/src/leniency.ts` suites A–D
- Gate requires 0 UNSAFE_LENIENT on trading + auth
- LIVE not granted

## Wave C6 — Full gate regression (2026-09-25)


### Added
- `docs/cleanup/c6-gate.cjs` runs 34 unit gates
- Result: 34/34 PASS

## Wave C5 — Docs consistency (2026-09-25)


### Added
- `docs/cleanup/c5-gate.cjs` checks readiness + charter + E5 policy
- No claim changes

## Wave C4 — Logging hygiene (2026-09-25)


### Added
- `packages/shared/src/log-hygiene.ts`
- Scanner gate forbids console/debugger outside tests
- No production call-site changes required (already clean)

## Wave C2/C3 — Human-marked duplicate removal (2026-09-25)


### Removed
- `services/exits/src/e2-gate.cjs`
- `services/exits/src/e3-gate.cjs`
- `services/exits/src/run-e1-checks.mjs`

### Kept
- `exit-engine.ts`, `e4-gate.cjs`, `e5-gate.cjs`, baseline metrics, all Agent OS sources

## Wave C1 — Cleanup inventory (2026-09-25)


### Added
- `docs/cleanup/C1_INVENTORY.md` (KEEP on all paths)
- Gate `docs/cleanup/c1-gate.cjs`

### Explicit non-actions
- No deletions, no consolidations, no behavior change

## Wave 32 (Part II) — Change guardrails (2026-09-25)


### Added
- `packages/agents/src/change-guardrails.ts`
- Forbidden pattern review
- Gate `packages/agents/src/wave32-gate.cjs`

## Wave 31 (Part II) — Cross-system consistency (2026-09-25)


### Added
- `packages/agents/src/consistency.ts`
- empty vs unavailable + hard-limit envelope checks
- Gate `packages/agents/src/wave31-gate.cjs`

## Wave 30 (Part II) — Human-gated promotion (2026-09-25)


### Added
- `packages/agents/src/promotion.ts`
- Agent/unknown-id rejects; staging reused
- Gate `packages/agents/src/wave30-gate.cjs`

## Wave 29 (Part II) — Maintenance planner (2026-09-25)


### Added
- `packages/agents/src/maintenance.ts`
- Human-only close; runbook execute throws
- Gate `packages/agents/src/wave29-gate.cjs`

## Wave 28 (Part II) — Cold-start + untrusted input (2026-09-25)


### Added
- `packages/agents/src/cold-start.ts`
- established / cold_start / dead_no_later_price
- Gate `packages/agents/src/wave28-gate.cjs`

## Wave 27 (Part II) — Shadow mode (2026-09-25)


### Added
- `packages/agents/src/shadow-mode.ts`
- Diverge flag; applyShadow throws
- Gate `packages/agents/src/wave27-gate.cjs`

## Wave 26 (Part II) — Replay candidate configs (2026-09-25)


### Added
- `packages/agents/src/replay-candidate.ts`
- Null-safe validate mean; tighten-only proposal
- Gate `packages/agents/src/wave26-gate.cjs`

## Wave 25 (Part II) — Replay harness (2026-09-25)


### Added
- `packages/agents/src/replay.ts`
- Time split; forbidden k-fold/random
- Gate `packages/agents/src/wave25-gate.cjs`

## Wave 24 (Part II) — Preset editor view-model (2026-09-25)


### Added
- `apps/web/src/lib/preset-editor.ts`
- canConfig + hard-limit client guard
- Gate `apps/web/src/lib/wave24-gate.cjs`

## Wave 23 (Part II) — Preset routes + RBAC (2026-09-25)


### Added
- `packages/agents/src/preset-routes.ts`
- 403 for viewer/agent; correlationId
- Gate `packages/agents/src/wave23-gate.cjs`

## Wave 22 (Part II) — Staging + loosening guards (2026-09-25)


### Added
- `packages/agents/src/preset-staging.ts`
- Human-only, confirm token, kill-switch lock, delay outside PAPER
- Gate `packages/agents/src/wave22-gate.cjs`

## Wave 21 (Part II) — Candidate store (2026-09-25)


### Added
- `packages/agents/src/candidate-store.ts`
- Persist accepted only; activate() throws
- Gate `packages/agents/src/wave21-gate.cjs`

## Wave 20 (Part II) — Preset validation core (2026-09-25)


### Added
- `packages/agents/src/preset-validation.ts`
- Hard-limit envelope + apply() throw
- Gate `packages/agents/src/wave20-gate.cjs`

## Wave 19 (Part II) — Trade-trace diagnostician (2026-09-25)


### Added
- `packages/agents/src/trade-trace.ts`
- REFUSED_LIVE / INCONCLUSIVE missing stages
- Gate `packages/agents/src/wave19-gate.cjs`

## Wave 18 (Part II) — Incident diagnostician (2026-09-25)


### Added
- `packages/agents/src/diagnostician.ts`
- REJECTED_UNVERIFIED / INCONCLUSIVE / DIAGNOSED
- Gate `packages/agents/src/wave18-gate.cjs`

## Wave 17 (Part II) — Trend analyst (2026-09-25)


### Added
- `packages/agents/src/trend-analyst.ts`
- Min-n=3, null/STALE excluded
- Gate `packages/agents/src/wave17-gate.cjs`

## Wave 16 (Part II) — Incident panel read model (2026-09-25)


### Added
- `packages/agents/src/incident-panel.ts`
- EMPTY vs UNAVAILABLE vs OK
- Human-only resolve
- Gate `packages/agents/src/wave16-gate.cjs`

## Wave 15 (Part II) — Detectors + alerting (2026-09-25)


### Added
- `packages/agents/src/detectors.ts`
- FAIL→danger, INCONCLUSIVE→warn, PASS silent
- Gate `packages/agents/src/wave15-gate.cjs`

## Wave 14 (Part II) — Risk observe wiring (2026-09-25)


### Added
- `packages/agents/src/risk-observe.ts`
- Fail-open ObservingRiskPort
- Gate `packages/agents/src/wave14-gate.cjs`

## Wave 13 (Part II) — Agent runtime + tier contracts (2026-09-25)


### Added
- `packages/agents/src/runtime.ts` — FakeLlmClient, budgets, prompt hash
- Disabled-by-default run path
- Gate `packages/agents/src/wave13-gate.cjs`

## Wave 12 (Part II) — Read-only tool registry (2026-09-25)


### Added
- `packages/agents/src/tool-registry.ts`
- SELECT-only SQL guard; protected-target reject
- Gate `packages/agents/src/wave12-gate.cjs`

## Wave 11 (Part II) — Deterministic probes (2026-09-25)


### Added
- `packages/agents/src/probes.ts`
- null-never-zero, paper-mode, protected-untouched
- Gate `packages/agents/src/wave11-gate.cjs`

## Wave 10 (Part II) — Feature capture (2026-09-25)


### Added
- `packages/agents/src/feature-capture.ts` fail-open observe()
- Gate `packages/agents/src/wave10-gate.cjs`

## Wave 9 (Part II) — Agent OS knowledge base (2026-09-25)


### Added
- `packages/agents/src/knowledge-base.ts`
- Untrusted-text sanitize + protected-source reject
- Gate `packages/agents/src/wave9-gate.cjs`

## Wave 8 (Part II) — Agent OS foundation (2026-09-25)


### Added
- `packages/agents/src/charter.ts` — PROTECTED_TARGETS, advisory-only asserts
- `docs/agents/CHARTER.md`
- Gate `packages/agents/src/wave8-gate.cjs`

### Explicit non-actions
- No apply path, no RiskPort/ExecutionAuthorization wiring, no LLM runtime

## Wave O5 — PAPER 24/7 readiness evidence (2026-09-25)


### Added
- Evidence checklist `docs/architecture/o5-readiness-evidence.md`
- Gate that refuses LIVE claims and marks soak n=0 as INSUFFICIENT_SAMPLE

### Verdict
24/7 PAPER readiness **not passed** (no soak logs). LIVE **not granted**.

## Wave O4 — Resource bounds & WS reconnect hygiene (2026-09-25)


### Added
- `packages/runtime/src/resource-guard.ts`
- Socket cap, reconnect rate limit, jittered backoff, idle watchdog
- Gate `packages/runtime/src/o4-gate.cjs`

## Wave O3 — Supervisor + single-instance (2026-09-25)


### Added
- `packages/runtime/src/supervisor.ts` — lock guard + crash-loop window
- Gate `packages/runtime/src/o3-gate.cjs`
- `docs/architecture/supervisor.md`

## Wave O2 — Outbound RPC 429 policy (2026-09-25)


### Added
- `RpcRateLimitedError`, Retry-After parse, -32005 classification
- Backoff 1s→30s ±25% jitter, max 5
- Process-wide `OutboundRpcBudget` (retries consume budget)
- `BoundedSolanaCaller` fail-closed
- `docs/architecture/rpc-outbound.md`
- Gate `packages/solana/src/o2-gate.cjs`

## Wave O1 — Process lifecycle (2026-09-25)


### Added
- `packages/runtime/src/graceful-shutdown.ts`
- API + pipeline drain adapters
- Drain timeout, duplicate-signal guard, crash counter
- Gate `packages/runtime/src/o1-gate.cjs`

### Not claimed
- 24/7 readiness (O5)
- Supervisor crash-loop (O3)

## Wave E5 — PAPER verification + exit policy (2026-09-25)


### Added
- `docs/exits/E5_PAPER_POLICY.md`
- Fixture matrix gate `services/exits/src/e5-gate.cjs` (re-runs E4)
- Honest soak marker: INSUFFICIENT_SAMPLE n=0

### Not claimed
- LIVE authorization
- 5x–50x capture
- Multi-day PAPER soak

## Wave E4 — Time-stop that does not kill winners (2026-09-25)


### Added
- `maxHoldMs` default 4h; `timeStopExemptPnlPct` default +2%
- Time-stop skipped for winners (pnl/peak/legs/trail)
- No time-stop when mark is not OK
- Gate `services/exits/src/e4-gate.cjs`

## Wave E3 — Peak trail + moon-bag (2026-09-25)


### Added
- Trail arm at +20% peak, giveback 8 pnl points
- Moon-bag floor 15% (TP/TRAIL cannot sell it; SL/kill/manual can)
- Ladder third leg reduced 34% → 19% so bag remains
- Gate `services/exits/src/e3-gate.cjs`

## Wave E2 — Break-even stop + multi-leg ladder (2026-09-25)


### Added
- `services/exits/src/exit-engine.ts` deterministic evaluateExit
- Default ladder 12/25/50% with 33/33/34 size fractions
- Break-even arm at +6% with +0.3% buffer
- Gate: `services/exits/src/e2-gate.cjs`

### Unchanged
- No LLM in evaluate
- Hard SL still first among price exits
- No LIVE / capture claims

## Wave E1 — Exit baseline metrics (2026-09-25)


### Added
- `services/exits/src/baseline-metrics.ts` observation collector
- Null-safe unrealized PnL (STALE/UNAVAILABLE → null → "—")
- `docs/exits/E1_BASELINE.md` and `MASTER_WAVE_E1_REPORT.md`

### Explicit non-changes
- ExitEngine.evaluate() behavior not modified
- No LLM on exit path
- No LIVE claim; soak sample remains INSUFFICIENT_SAMPLE until n≥30 live PAPER observations

## Wave D5 — Dashboard acceptance package (2026-09-24)


### Added
- `docs/design/acceptance/*` evidence package
- Honest NOT-captured list for screenshots / axe / full web build

### Status
Human sign-off required. productionReady remains false.

## Wave D4 — Assemble Dashboard (2026-09-24)

### Added
- Client methods for D3 read models
- `usePolledAvailability` (pause when hidden, backoff on error)
- Dashboard panels via DataState; Section 70 display-only
- Design-preview flag `VITE_HELIOS_DESIGN_PREVIEW=1` (off by default)

## Wave D3 — Read-model contracts (2026-09-24)

### Added
- GET `/v1/health/snapshot`, `/v1/risk/state`, `/v1/pipeline/funnel`,
  `/v1/portfolio/series`, `/v1/events/recent`, `/v1/readiness`
- Extended `ControlPlaneDataSource` optional methods; default UNAVAILABLE
- Handlers pass `DataAvailability` discriminant through; correlationId on body

## Wave D2 — Design system and shell (2026-09-24)

### Added
- `apps/web/src/ui/*` — DataState, PanelCard, MetricTile, StatusBadge, ModeBanner,
  KillSwitchIndicator, FreshnessStamp, DataTable, ChartFrame (null = gap).
- Extended CSS tokens; Shell mode banner + role chip; Dashboard uses DataState.

### Chart choice
- No third-party chart lib — no time-series API yet; SVG ChartFrame only.

## Wave D1 — Dashboard design spec (2026-09-24)

### Added
- `docs/design/dashboard-spec.md` — IA, wireframes, state matrix, tokens, a11y, truthfulness, gaps.
- No application code (review gate before D2).

## Wave 11 — Section 70 Live Trading Activation Gate (2026-09-24)

### Confirmed
- All six Section 70 preconditions unmet (honest).
- `LiveTradingActivationGate` still denies at first failure.
- Display-only tests: apps/api + apps/web cannot set activation flags.

### Explicit non-actions
- No real TransactionSigner.
- No wallet keys.
- No automated manualAdminApproval.

## Wave 10 — Production-gate verification pass (2026-09-24)

### Verified (live evidence)
- Primary Helius RPC (getHealth/getSlot)
- Backup public mainnet RPC
- Helius WebSocket slotSubscribe

### Explicit non-claims
- productionReady remains **false**
- Section 70 untouched
- Wallet / secrets / live backup restore / recovery boot still open

## Wave 9 — CI, containers, secrets, backups (2026-09-24)

### Added
- `.github/workflows/ci.yml` with Postgres + Redis service containers.
- Multi-stage Docker template + package Dockerfiles; compose profiles.
- `infrastructure/backup/pg_dump_backup.sh` + `pg_restore_test.sh`.
- `docs/architecture/secrets.md` password rotation guidance.

### Explicit non-claims
- CI not run green in-agent; restore test not executed against live Postgres.

## Wave 8B — Postgres control-plane read models (2026-09-24)

### Added
- `readOnlyQuery()` rejects write verbs (packages/database).
- `PostgresControlPlaneDataSource` — OK/EMPTY/STALE/UNAVAILABLE honesty.
- Grep test: no SQL writes under `apps/api/src/data`.

### Default
- `UnavailableDataSource` when no DB configured.

## Wave 8 — Worker wiring & continuous PAPER run (2026-09-24)

### Added
- `assertPaperMode` / `LiveModeRefusedError` — refuse LIVE at worker start.
- `StageResult` status `UNAVAILABLE` — short-circuits token, not worker.
- `R5_FULL_STAGE_ORDER` including quote/build/simulate/exits.
- `ExitsEngineStage` optional port.
- Grep test: no `services/execution` imports.

### Unchanged
- Section 70 / live execution never invoked.

## Wave 7 — Transaction simulation against live RPC (2026-09-24)

### Added
- `LiveSolanaSimulateClient` with safe config (sigVerify:false + replaceRecentBlockhash:true).
- Fail-closed taxonomy for 429/5xx/network vs simulation-result RPC codes.
- `PlanIdLiveSimulateClient` adapter for existing RpcSimulateClient seam.

### Unchanged
- Five-check AND in TransactionSimulator (never trust rpcSuccess alone).

## Wave 6 — Live wallet-activity provider (2026-09-24)

### Added
- `HeliusTransactionsProvider` — `getTransactionsForAddress` (raw txs).
- `HeliusTradeActivitySource` — TradeActivitySource adapter (empty → null).
- Fail-closed 429/5xx/network; empty ≠ ok; null blockTime preserved.

### Unchanged
- SmartMoneyEngine single-wallet NEUTRAL invariant.

## Wave 5 — Jupiter live quotes (2026-09-24)

### Added
- `JupiterAggregatorClient` → `GET https://api.jup.ag/swap/v1/quote` with `x-api-key`.
- Fail-closed HTTP mapping (429/4xx/5xx/network/malformed).
- Unit tests with injectable fetch (no key leakage in logs).

### Unchanged
- `QuoteSource` interface and `QuoteEngine` expiry logic.

## Wave 4 — DEX pool parsing / PumpSwap (2026-09-24)

### Added
- Vendored `vendor/pump_amm.json` + SHA-256 pin.
- `findPoolPda` with IDL seeds: pool + index + creator + base + quote.
- `decodePumpSwapPoolAccount` (owner + discriminator fail-closed).
- `verifyPoolByAddress` / `verifyPoolByDerivation` for confirm path.

### Notes
- Wave brief's `["pool", mint_a, mint_b]` superseded by official IDL seeds.
- Raydium v4 not implemented (no pre-March-2025 fixtures present).

## Wave 3 — Metaplex metadata parsing (2026-09-24)

### Added
- `findMetadataPda` (seeds metadata + program + mint)
- `decodeMetadata` / `decodeMetadataFromAccountInfo` (key=4, mint match, fail closed)
- Token-2022 detection → `token_2022_unsupported` (≠ absent)
- Live BONK metadata fixture + PDA cross-check

### Notes
- `@solana/web3.js` dependency for PDA derivation
- `@metaplex-foundation/mpl-token-metadata` declared as optional cross-check devDep

## Wave 2 — Pump.fun log parsing (2026-09-24)

### Added
- Vendored `vendor/pump.json` + SHA-256 pin.
- `parseLogEntry` / `decodePumpProgramData` with IDL discriminators.
- Live mainnet TradeEvent fixture; synthetic CreateEvent unit test.
- Discriminator pins cross-checked with `sha256("event:Name")`.

### Notes
- TradeEvent → null for discovery candidates (no token name/symbol).
- Live CreateEvent fixture deferred (RPC 429 during capture).

## Wave B7 — Gap closure + Start Gate verification (2026-09-24)

### Added
- `docs/phase-reports/MASTER_WAVE_B7_REPORT.md` — 13-gap final status + Start Gate checklist.

### Result
- 12/13 gaps closed with evidence; money float64 deferred (honest plan-only marker).
- Start Gate **not passed** in agent session (full `pnpm` gate + live RPC/WS not verified).
- **STOP before Wave 1** until operator pastes green gate evidence.

## Wave B6 — Money math plan, graceful shutdown, liveness/readiness (2026-09-24)

### Added
- `docs/architecture/money-math-migration.md` — versioned plan for float64 → decimal (no runtime change).
- SIGTERM/SIGINT graceful drain for `apps/api` and `workers/pipeline`.
- Health `live` / `ready` distinction; 503 when not ready; drain flips ready=false.

### Changed
- `HealthResponse` includes `live`, `ready`, optional `checks`.
- Process uptime is explicitly not trading authorization.

### Not changed
- Risk/portfolio money field runtime types (still `number`).

## Wave B5 — Dependency-audit baseline (2026-09-24)

### Added
- `docs/testing/dependency-audit-baseline.md` from `pnpm audit --registry https://registry.npmjs.org`.
- Floor policy: new critical/high findings require explicit justification; no silent major bumps.

### Snapshot
- Metadata: 2 critical, 3 high, 11 moderate (16 total) across 445 dependencies.
- No dependency versions changed in this wave (baseline only).

## Wave B4 — Secrets, redaction, role-scope hardening (2026-09-24)

### Added
- Value-pattern redaction pass in shared logger (`redactSecretValues`) for free text / messages.
- Migration `0014_role_scope_and_password_policy.sql` — `helios_readonly` SELECT-only role.
- Runbook `docs/runbooks/db-role-passwords.md` — rotate off `change_me_in_production` before non-dev.

### Changed
- `redactSecrets` now scans string values, not only secret-shaped keys.
- Role scope documented (helios_app write path vs helios_readonly).

### Not changed
- `audit_logs` append-only grants (still SELECT+INSERT only).

## Wave B3 — WebSocket gateway auth/RBAC (2026-09-24)

### Added
- `GatewayAuthPort` / `GatewayIdentity` / `MapGatewayAuthPort` in control-gateway.
- WS upgrade rejects unauthenticated connections when auth is required.
- RBAC on WS (and HTTP) COMMAND paths; actor overwritten from verified identity.
- Tests: `services/control-gateway/tests/ws-auth.test.ts`.
- `WsControlGatewayClient.accessToken` for bearer forwarding.

### Changed
- `createControlGatewayServer` accepts auth options.
- README documents Wave B3; mTLS remains an honest deferred marker.

## Wave B2 — Boot-time fail-closed auth (2026-09-24)

### Added
- `AuthEngineRequiredError` when production (or `requireAuth: true`) starts without AuthEngine.
- `isProductionRuntime` / `mustRequireAuth` helpers.
- Tests: `apps/api/tests/boot-auth.test.ts`.

### Changed
- `createApiServer` refuses construction without AuthEngine in production.
- Auth remains optional for existing test path (`NODE_ENV` not production).
- README documents the production boot contract.

### Not changed
- Auth hashing, session tokens, lockout, or RBAC logic.

## Wave B1 — HTTP edge hardening (2026-09-24)

### Added
- Explicit CORS allowlist (`apps/api/src/middleware/cors.ts`); origins never `*`.
- Sliding-window rate limiting with memory|redis store abstraction (`rate-limit.ts`); auth fails closed when store down.
- Security headers: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, optional HSTS.
- TLS termination / reverse-proxy section in `docs/architecture/deployment-topology.md`.
- Tests: `apps/api/tests/edge-hardening.test.ts`.

### Changed
- `ApiConfig` extended with `cors`, `rateLimit`, `securityHeaders`.
- `createApiServer` accepts optional `rateLimitStore`.
- `routeRequest` applies security headers, CORS, and rate limits before routing.

## Topology — single-host Hostinger VPS (docs)

### Changed
- README + infrastructure READMEs: operator-selected single-host Hostinger VPS
- `docs/architecture/deployment-topology.md` — residual risk vs two-host split
- Env example headers clarify process roles (not physical VPS requirement)
- Architecture audit addendum; config schema comments

### Unchanged (intentional)
- Section 70 live gate
- `forbidLiveSecrets` on control-plane process
- `apps/api` import boundary tests

### Tests
- packages/config 13/13, apps/api boundary 3/3

## Phase R12 — Observability, secrets, deployment

### Added
- `.env.control-plane.example` / `.env.vps.example` (match packages/config schemas)
- `infrastructure/docker/docker-compose.vps.yml` (Postgres + Redis only)
- MetricsRegistry + Prometheus text export
- Structured JSON Logger with secret redaction
- PRODUCTION_READINESS.md updated honestly (no false checks)

### Tests
- monitoring 12/12, config 13/13

## Phase R11 — Live path wiring (still gated)

### Added
- LiveExecutionPipeline (recovery gate → Section 70 → engine → persist/publish)
- RefusingTransactionSigner (Section 52 — no wallet material)
- Gateway: recoveryLiveAllowed required for START LIVE (default false)

### Explicit non-goals
- Did **not** set any Section 70 checklist flags
- Did **not** enable LIVE mode in default configs

### Tests
- execution 44/44, control-gateway 19/19

## Phase R10 — Startup Reconciliation (Section 50)

### Added
- StartupReconciliationEngine + recovery ports
- Sequence: LOAD_KILL_SWITCH → LOAD_OPEN_POSITIONS → RECONCILE_POSITIONS → RECONCILE_PENDING_ORDERS → FINALIZE
- liveTradingAllowed=false on FAILED/DEGRADED/kill-switch block

### Tests
- services/execution 39/39 PASS (12 recovery)

## Phase R9 — Frontend / API read wiring

### Added
- ControlPlaneDataSource + Unavailable/InMemory sources
- GET /v1/positions, /v1/opportunities, /v1/portfolio (auth + *:read)
- Web client + Positions/Opportunities pages consume availability discriminants
- Equity Unknown/Unavailable never rendered as $0

### Tests
- apps/api 76/76, apps/web 12/12

## Phase R8 — Control-plane Auth persistence

### Added
- `PostgresAuthStore` over users/sessions (migration 0001)
- Durable lockout + session expiry across process restart
- Unit tests with FakeAuthDb (shared state = restart simulation)

### Tests
- apps/api 72/72 PASS (incl. 4 postgres-auth-store)

## Phase R7 — Portfolio Wiring

### Added
- Migration `0013_portfolio_snapshot_nullability.sql` (nullable equity + mark fields)
- PortfolioSnapshotsRepository, PnlSnapshotsRepository, FeesRepository
- PortfolioPipeline: snapshot / pnlSnapshot / recordFee
- Rule 1: unpriced legs excluded from equity; null drawdown when equity null

### Tests
- services/portfolio 30/30 PASS

## Worker binding — Quote → Build → Simulate before risk/paper

### Added
- QuoteEngineStage, BuildEngineStage, SimulateEngineStage
- buildEngineBoundStages inserts quote→build→sim before risk when ports set
- Fail-closed: missing amount/wallet → BLOCK; sim unavailable/failed → BLOCK
- Full path test: quote→build→sim→risk→paper→position

### Tests
- workers/pipeline 25/25 PASS

## Worker binding — Paper → Position after risk AUTHORIZED

### Added
- `PaperEngineStage` / `PositionEngineStage` in workers/pipeline adapters
- `buildEngineBoundStages` appends paper→position when ports provided
- `PipelineJobResult.paperExecuted` / `positionOpened`
- Rule 2: paper BLOCKs without riskAuthorized; position requires CONFIRMED fill + real entry params

### Tests
- workers/pipeline 20/20 PASS

## Phase R6 — Paper Execution, Position, Exit wiring

### Added
- PaperPipeline → ORDER_CONFIRMED/FAILED (mode always PAPER; PAPER- signatures)
- PositionPipeline → POSITION_OPENED from CONFIRMED paper fill
- ExitPipeline → TP/SL/TIME_STOP/EMERGENCY events + POSITION_CLOSED/PARTIAL_EXIT
- Optional order/position DB ports; fail-closed rejections preserved

### Tests
- paper-execution 26/26, position 28/28, exits 35/35

## R5 follow-up — Engine-bound pipeline stages

### Added
- `workers/pipeline/src/adapters/` — ports + Discovery/Analysis/Scoring/Signal/Risk stages
- `buildEngineBoundStages(deps)` wires real engines via ports
- Analysis blocks on SECURITY UNKNOWN/CRITICAL; Risk sets riskAuthorized only on AUTHORIZED
- Tests against real SecurityEngine, ScoringEngine, SignalEngine, RiskEngine (14/14)

## Phase R4 — Quote, Transaction Builder, Simulation wiring

### Added
- Migration `0012_plans_and_simulations.sql`
- QuotesRepository (findValidById enforces expiry)
- TransactionPlansRepository, SimulationResultsRepository
- QuotePipeline → QUOTE_CREATED
- BuilderPipeline → TRANSACTION_BUILT; blocks expired quotes
- SimulationPipeline → SIMULATION_PASSED / SIMULATION_FAILED

### Tests
- quote 28/28, transaction-builder 13/13, transaction-simulator 20/20

### Notes
- Simulation still uses injected/mock RPC sources — no live mainnet claimed.

## Phase R3 — Scoring, Signal, Risk wiring + Kill Switch

### Added
- Migration `0011_signals_and_kill_switch.sql` (signals, kill_switch_state, kill_switch_events)
- ScoresRepository, SignalsRepository, KillSwitchRepository
- ScoringPipeline → SCORE_CREATED
- SignalPipeline → SIGNAL_CREATED (isExecutionAuthorized always false)
- RiskPipeline loads durable kill switch; publishes RISK_CHECK_STARTED / AUTHORIZED / REJECTED
- InMemoryKillSwitchStore restart-survival tests

### Tests
- scoring 22/22, signal 26/26, risk 49/49 (incl. 3 kill-switch + 3 risk-pipeline)

## Phase R2 — DB/Event Wiring (Security, Smart Money, Momentum)

### Added
- Migration `0010_security_analyses.sql`
- Repositories: SecurityAnalysesRepository, SmartMoneyRepository, MomentumSnapshotsRepository
- SecurityPipeline / SmartMoneyPipeline / MomentumPipeline — engine → persist → publish → audit
- Fail-closed outcomes: PERSIST_FAILED, PUBLISH_FAILED, TOKEN_NOT_FOUND
- Pipeline unit tests (DB/Redis outage coverage)

### Tests
- services/security: 21/21
- services/smart-money: 20/20
- services/momentum: 21/21

## Phase R5 — Continuous Pipeline Worker

### Added
- `workers/pipeline` — PipelineOrchestrator, PipelineWorker, InMemoryJobQueue,
  injectable PipelineStage chain (discovery→analysis→scoring→signal→risk).
- Fail-closed: BLOCK/FAIL halts downstream; no execution call from this worker.
- Graceful start/stop, health snapshot, continuous poll loop.
- 11 vitest tests (orchestrator + worker loop).

### Notes
- Real engine adapters and Redis Streams queue adapter still open (R2–R4 + event-bus wiring).

## Phases 29–30 — Backtest + Observability / Production Gate

### Added
- `packages/types` analytics + observability contracts.
- `services/analytics` BacktestEngine (7 tests).
- `apps/web` Paper / Backtest page (local replay UI).
- `services/monitoring` HealthAggregator + ProductionGate (8 tests).
- `docs/operations/health-and-alerting.md`, `docs/deployment/topology.md`.
- Updated `PRODUCTION_READINESS.md` (still NOT PRODUCTION READY).

## Phases 24–28 — Frontend (apps/web)

### Added
- `apps/web` Vite + React + TypeScript control-plane UI.
- Phase 24: shell, routing, login, session restore, HeliosApiClient.
- Phase 25: Dashboard from GET /v1/status.
- Phase 26: Opportunity Terminal (honest empty state).
- Phase 27: Positions & Portfolio (no fake PnL; MANUAL_EXIT control).
- Phase 28: Risk & Controls with UI RBAC hints.
- 12 vitest tests (api client, rbac-ui, page honesty).

### Changed
- IMPLEMENTATION_STATUS.md — phases 24–28 → PARTIAL.

## Phase 23 — RBAC enforcement

### Added
- `packages/types/src/rbac.ts` — `roleHasPermission`, `checkPermission`,
  `permissionForControlCommand`, permission constants.
- `apps/api/src/rbac/enforce.ts` — route-level require helpers + 403 body.
- Command permission map enforced before control-gateway submit.
- 17 RBAC tests; apps/api suite **68/68 PASS**.

### Changed
- `handleCommand` accepts optional `role` and returns 403 without calling gateway when denied.
- Router passes authenticated role into command handler and checks status read.

## Phase 22 — Authentication

### Added
- `packages/types/src/auth.ts` — AuthUser, AuthSession, login/verify outcomes, AuthContext.
- `apps/api/src/auth/` — AuthEngine, scrypt password hashing, opaque session tokens,
  InMemoryAuthStore, Bearer middleware.
- Routes: `POST /v1/auth/login`, `POST /v1/auth/logout`, `GET /v1/auth/me`.
- Protected `/v1/status` and `/v1/commands` when AuthEngine is injected; actor spoofing blocked.
- 19 new auth tests (12 engine + 7 HTTP) → apps/api **51/51 PASS**.

### Changed
- `createApiServer` accepts optional `auth` option.
- `IMPLEMENTATION_STATUS.md` — Phase 22 → PARTIAL.

## Phase 21 — WebSocket Gateway (control-gateway + api relay)

### Added
- `packages/types/src/gateway.ts` — GatewayStatus, kill-switch, config whitelist,
  WebSocket frame types (COMMAND / COMMAND_ACK / STATUS / PING / PONG / ERROR).
- `services/control-gateway` — `ControlGatewayEngine` (independent re-validation),
  HTTP + WebSocket server (`ws`), 18 tests.
- `apps/api` — `HttpControlGatewayClient`, `WsControlGatewayClient` relays;
  `gateway-relay.test.ts` end-to-end against real gateway server (+6 tests → 32 total).

### Changed
- `services/control-gateway/package.json` — renamed to `@helios/services-control-gateway`.
- `IMPLEMENTATION_STATUS.md` — Phase 21 → PARTIAL.

## Phase 20 — REST API (control-plane)

### Added
- `packages/types/src/api.ts` — ControlCommand union (START/PAUSE/STOP/MANUAL_EXIT/CONFIG_CHANGE),
  ControlCommandAck, ControlPlaneStatus, HealthResponse, ApiErrorBody.
- `apps/api` — Node HTTP control-plane server: `/health`, `/v1/status`, `/v1/commands`;
  `ControlGatewayClient` port + in-memory test double; 26 tests including Section 3.0
  boundary (no risk/execution imports).
- `infrastructure/docker/README.md` and `infrastructure/vps/README.md` — explicit
  deployment-target boundary notes per Section 3.0.

### Changed
- `apps/api/package.json` — real test/typecheck scripts (scaffold removed).
- `IMPLEMENTATION_STATUS.md` — Phase 20 → PARTIAL.

## Phase 19 — Portfolio (balance / equity / PnL / drawdown)

### Added
- `packages/types/src/portfolio.ts` — portfolio mark status, snapshots,
  period PnL snapshots, high-water mark, discriminated outcomes.
- `services/portfolio` — `PortfolioEngine.snapshot()` and
  `pnlSnapshot()`; 24 tests (22 unit + 2 PositionEngine pipeline);
  README documenting Rule 1 mark-status table and PARTIAL gaps.

### Changed
- `services/portfolio/package.json` — renamed from Phase 01 scaffold
  `@helios/service-portfolio` to `@helios/services-portfolio`.
- `IMPLEMENTATION_STATUS.md` — Phase 19 row flipped from NOT STARTED
  to PARTIAL with verified test counts.

### Fixed
- Pipeline test floating-point residual on
  `(exitPrice - entryPrice) * amount` asserted with `toBeCloseTo`.

## Phase 18 — Live Execution (gated) (2026-08-22)

### Added
- `packages/types/src/execution.ts` — `LiveFill`, `LiveExecutionResult`,
  `LiveExecutionRejectionCode`, `LiveExecutionRejection`,
  `LiveExecutionOutcome`: the LIVE counterpart to Phase 15's
  `PaperExecutionResult`, appended to the same file specifically because
  its own module docstring already said a future LIVE engine should
  reuse `ExecutionState`/`EXECUTION_STATE_TRANSITIONS` from right there.
- `packages/types/src/live-trading-gate.ts` (new file) —
  `LiveTradingGateCode`, `LiveTradingActivationDenial`,
  `LiveTradingActivationGrant`, `LiveTradingActivationDecision`: Section
  70's gate contract, a discriminated union following the same pattern
  as `RiskDecision` (Phase 12) — no way to obtain a grant except through
  the `GRANTED` branch.
- `services/execution/src/live-trading-gate.ts` —
  `LiveTradingActivationGate.evaluate()`: walks Section 70's six
  preconditions in exact sequence, denies on the first unmet one.
- `services/execution/src/live-execution-engine.ts` —
  `LiveExecutionEngine.execute()`: Section 27's live path, requiring
  BOTH a valid Risk Engine `ExecutionAuthorization` (Rule 2) and a
  currently-valid `GRANTED` Section 70 decision. Calls an injected
  `TransactionSigner` interface for sign/submit/confirm — no real
  implementation of that interface ships (Section 52).
- `services/execution/src/idempotency-store.ts` —
  `InMemoryLiveIdempotencyStore`.
- 27 tests: `tests/live-trading-gate.test.ts` (10) +
  `tests/live-execution-engine.test.ts` (17), covering the gate's
  sequencing, the two-part authorization requirement, idempotency
  (including that a cached result survives a since-denied activation on
  replay, and that an `ABORTED` attempt is never cached), the full
  sign/submit/confirm state walk against every transition in
  `EXECUTION_STATE_TRANSITIONS`, and the CONFIRMED-with-no-actualFill
  case being treated as FAILED rather than fabricating a fill from the
  plan.

### Changed
- `services/execution/package.json` — renamed from the Phase 01
  scaffold's `@helios/service-execution` to `@helios/services-execution`,
  same class of fix as Phase 17's own package-name correction.

### Verification note
Same disclosed gap as Phase 17: no network access in this phase's
authoring sandbox, so `npm install`/`vitest` never ran. Additionally
this time: the strict typecheck pass was re-run against every other
service in the repo that imports `packages/types` (`risk`, `position`,
`paper-execution`, `quote`, `transaction-builder`,
`transaction-simulator`, `signal`, `scoring`) to confirm this phase's
additions to shared type files caused zero regressions — zero errors
found. See `services/execution/README.md`'s "Verification note" section
for full detail, and `docs/phase-reports/PHASE_18_LIVE_EXECUTION_REPORT.md`.

## Phase 17 — Exit Engine (2026-08-22)

### Added
- `packages/types/src/trading.ts` — `ExitDecision`, `ExitTrigger`,
  `ExitHold` (discriminated union): the Exit Engine's decision output,
  appended alongside the existing `ExitReason`/`EXIT_REASONS`/`ExitEvent`
  contracts that were already there waiting for this phase.
- `services/exits/src/types.ts` — `ExitEvaluationInput`,
  `ExitEngineConfig`, `PriceContext`, `ManualExitRequest`,
  `RiskForcedExit`, `TakeProfitLadderConfig`.
- `services/exits/src/exit-engine.ts` — `ExitEngine.evaluate()`:
  decides whether an OPEN/PARTIAL_EXIT position should exit right now
  and why, checking EMERGENCY → RISK → STOP_LOSS → LIQUIDITY →
  MIGRATION → MANUAL → TAKE_PROFIT (TP_1 partial / TP_2 full) →
  TIME_STOP in that fixed order (Section 74's capital-protection-first
  hierarchy, applied structurally — first match wins, mirroring how
  `services/risk`'s hard limits are checked).
- 29 unit tests (`tests/exit-engine.test.ts`) + 1 pipeline test
  (`tests/full-pipeline.test.ts`, real `PaperExecutionEngine` →
  `PositionEngine` → `ExitEngine` → `PositionEngine.recordExit()`
  across two exit legs, exact cumulative realized PnL verified: $125
  then $375).

### Changed
- `services/exits/package.json` — renamed from the Phase 01 scaffold's
  `@helios/service-exits` to `@helios/services-exits`, matching the
  `@helios/services-<name>` convention every other real service package
  in this repo uses.

### Fixed
- N/A — no bugs found during this phase's own development this time; see
  the "Verification note" below for why that claim is weaker than usual.

### Verification note (read before trusting this phase's tests)
Every prior phase's report in this repository ran its tests for real —
`npm test` against an actually-installed `vitest`, often against a real
local Postgres/Redis/mock-RPC. This phase's authoring environment had no
network access, so `npm install` could not run and `vitest` was never
executed. What was actually done instead: a strict `tsc --noEmit` pass
(same `strict`/`noUncheckedIndexedAccess`/`exactOptionalPropertyTypes`
flags this package's own `tsconfig.json` declares) against the real
`packages/types`, `services/risk`, `services/position`, and
`services/paper-execution` source already in this repository came back
with zero type errors across every new file, source and tests alike; and
every assertion in both test files was manually traced against the
engine's actual branch logic and arithmetic. This is real verification of
type-correctness and logical correctness, but it is not the same as a
green `vitest` run, and `IMPLEMENTATION_STATUS.md`'s Phase 17 row says so
explicitly rather than reusing the "N/N tests passing" phrasing every
other PARTIAL row earns from an actual run.

## Merge — Phases 08–16 integrated into the Phase 00–07 monorepo (2026-08-21)

This repository was assembled from two separate delivery batches: Phases
00–07 (this monorepo's original foundation) and Phases 08–16 (built
independently against a matching `@helios/types` contract). This entry
records exactly what the merge did — see `docs/MERGE_NOTES.md` for the
full reasoning.

### Added
- `services/security`, `services/smart-money`, `services/momentum`,
  `services/scoring`, `services/signal`, `services/risk`, `services/quote`,
  `services/transaction-builder`, `services/transaction-simulator`,
  `services/paper-execution`, `services/position` — real, tested
  implementations, replacing the Phase 01 placeholder stub directories of
  the same names (`services/quotes` and `services/positions` were removed;
  the real services use the singular `quote`/`position` naming their own
  internal package references already depended on — see `MERGE_NOTES.md`).
- `packages/types/src/{execution,momentum,position,quote,signal,simulation,
  smart-money,transaction}.ts` — new, real type contracts for their
  respective subsystems.
- `docs/phase-reports/PHASE_08_REPORT.md` through `PHASE_16_POSITION_REPORT.md`,
  plus `docs/phase-reports/DELIVERY_INDEX.md` — the original phase reports
  from the 08–16 delivery, unmodified.
- `docs/MERGE_NOTES.md` — documents every type collision found and how it
  was resolved.

### Changed
- `packages/types/src/{risk,scoring,security}.ts` replaced with their
  Phase 08–16 counterparts. The Phase 01 versions of these three files were
  documented in `IMPLEMENTATION_STATUS.md` as "PARTIAL — shared contracts
  only, no consumers" and were not imported by any Phase 00–07 service, so
  this is a superseding replacement, not a breaking change to working code.
- `packages/types/src/trading.ts` trimmed to keep only what nothing else
  now supersedes (`ExecutionOrder`, `EXIT_REASONS`/`ExitReason`/`ExitEvent`
  for the not-yet-built Exit Engine). Its old `Quote`, `ExecutionState`,
  `EXECUTION_STATES`/`EXECUTION_TRANSITIONS`/`canTransitionExecution`,
  `Position`, `PositionState`, `POSITION_STATES`/`POSITION_TRANSITIONS`/
  `canTransitionPosition`, and `isQuoteFresh` were removed — each has a
  real, superseding definition in `quote.ts`, `execution.ts`, or
  `position.ts` now.
- `packages/types/src/index.ts` updated to export the new module set with
  no duplicate symbol names.

### Removed
- `packages/types/src/{risk,scoring,security,trading}.test.ts` — these
  tested the old placeholder shapes directly and no longer apply. Real
  coverage for this logic now lives in each service's own `tests/`
  directory (228 tests total across the 11 merged services — see
  `docs/phase-reports/DELIVERY_INDEX.md`).

### Verified
- `packages/types` (merged): `tsc --noEmit` clean, `vitest run` — 5/5
  passing (the surviving `migration.test.ts`).
- All 11 merged services independently `npm install` + `vitest run`
  against the merged `packages/types` — 228/228 tests passing, matching
  the original delivery's count exactly.

## Phase 07 — Migration (2026-08-17)

### Added
- `packages/types/src/migration.ts` — `MigrationStage` state machine (`pre-migration → migration-detected → migration-confirmed → post-migration`) with `canTransitionMigration()`, 5 unit tests.
- `packages/database/src/repositories/token-migrations.ts` — `TokenMigrationsRepository`: idempotent `createDetected()`, SQL-guarded `confirm()`/`markPostMigration()` (each requires the current stage to match via `WHERE stage = ...`, independent of the pure state-machine check). 10 integration tests.
- `database/migrations/0009_token_migrations_unique.sql` — added a `UNIQUE(token_id)` constraint that the original Phase 02 schema was missing; without it, the repository's race-handling logic (catch-unique-violation-and-refetch) would have been silently incorrect, since concurrent inserts could both succeed. Caught before it shipped, not after.
- `services/migration/src/migration-engine.ts` — `MigrationEngine`: `detect()` (idempotent, publishes `MIGRATION_DETECTED`), `confirm()` (Section 13 steps 1-3: on-chain pool-existence check + pluggable liquidity/trading-availability verifiers, fails closed on RPC outage), `markPostMigration()` (final transition, publishes `TOKEN_UPDATED`). 10 integration tests against real Postgres/Redis/mock-RPC.
- `docs/architecture/migration-testing.md`.

### Fixed
- **`@helios/database` was missing a declared dependency on `@helios/types`.** It had been importing nothing from that package until this phase's `TokenMigrationsRepository` needed `MigrationStage`, at which point `tsc` correctly failed with "Cannot find module." This had been latent since Phase 02 — every previous repository happened to only need `pg` types. Fixed by adding the dependency to `packages/database/package.json`. A real gap caught by the gate, not by inspection.
- The `token_migrations` table's missing `UNIQUE(token_id)` constraint (see above) — caught while writing the repository, before any test ran against it, by reasoning through what the race-handling code actually needed rather than assuming the Phase 02 schema was already sufficient for a use case Phase 02 didn't anticipate.

### Notes
- Continued the honest-gap pattern from Phases 05/06: `MigrationEngine.confirm()` takes DEX-specific liquidity/trading-availability checks as caller-supplied functions rather than decoding real Raydium/Orca pool account layouts this environment can't verify. See `docs/architecture/migration-testing.md`.
- Section 13's post-migration steps 4-8 (quote refresh, market data refresh, position routing, risk recalculation, exit recalculation) are explicitly not implemented here — they belong to services (Quote, Position, Risk, Exit engines) that don't exist until later phases. `markPostMigration()` performs the state transition and publishes the event; it doesn't fabricate the downstream work.

## Phase 06 — Token Analysis (2026-08-16)

### Added
- `packages/database`: `TokenCurveSnapshotsRepository`, `HoldersRepository`, `CreatorProfilesRepository`, `TokenMetadataRepository`, and `TokensRepository.listByCreator()`. 21 new/updated tests, all passing against real Postgres (55 total in the package now).
- `services/token-analysis/src/curve/` — `bonding-curve-math.ts` (constant-product AMM formula, velocity/acceleration; pure, 12 unit tests) and `bonding-curve-engine.ts` (`BondingCurveEngine`: persists snapshots, publishes `CURVE_UPDATED`, publishes `MIGRATION_THRESHOLD_APPROACHING` exactly once per threshold crossing, never a migration-confirmed event — Section 12's explicit rule).
- `services/token-analysis/src/holders/` — `holder-math.ts` (concentration/rate/velocity; pure, 10 unit tests) and `holder-analysis-engine.ts` (`HolderAnalysisEngine`: upserts balances, computes growth vs. previous snapshot, publishes `HOLDERS_UPDATED`).
- `services/token-analysis/src/creator/` — `creator-risk.ts` (frequency-based classification heuristic; pure, 8 unit tests) and `creator-analysis-engine.ts` (`CreatorAnalysisEngine`: persists creator profile, records a `RISK_LEVEL_CHANGED` event only on actual transitions).
- `services/token-analysis/src/metadata/metadata-service.ts` — `MetadataService`: fetches an account via `SolanaProvider`, delegates parsing to a caller-supplied function, fails closed (`rpc_unavailable`) on RPC outage.
- `docs/architecture/token-analysis-testing.md`.
- 46 tests in `services/token-analysis` (30 unit + 16 integration against real Postgres/Redis/mock-RPC), all passing on first full run.

### Notes
- No implementation bugs this phase either (same as Phase 04) — every engine's tests passed on the first full run once written. The `NUMERIC(38,18)` full-precision-string lesson from Phase 02/05 was applied proactively to the new repository tests rather than rediscovered.
- Continued the Phase 05 honesty pattern for anything requiring unverifiable on-chain byte-level parsing: `MetadataService` takes account address + parser as inputs rather than deriving Metaplex PDAs or decoding Borsh layouts it can't verify against live data. See `docs/architecture/token-analysis-testing.md` for the full list of scoped-out gaps (Metaplex parsing, post-migration DEX liquidity, single-signal creator heuristic).

## Phase 05 — Discovery (2026-08-16)

### Added
- `services/discovery/src/normalize.ts` — structural validation/normalization of raw upstream discovery events, with 16 unit tests covering every rejection path.
- `services/discovery/src/discovery-engine.ts` — `DiscoveryEngine`: normalize → dedupe (fast-path `findByMint` + race-safe unique-violation fallback) → on-chain mint verification via `SolanaProvider` (fail-closed on RPC outage, Rule 3) → persist via `TokensRepository` → publish `TOKEN_DISCOVERED` via `EventPublisher` → audit every outcome via `AuditLogRepository`.
- `services/discovery/src/validation-engine.ts` — `TokenValidationEngine` implementing Section 11's checks (mint/account validity, creator presence, already-tracked, age, blacklist), honestly reporting metadata/market/liquidity as not-yet-available (Phase 06+) rather than defaulting them to true.
- `services/discovery/src/types.ts` + `sources/test-source.ts` — `DiscoverySource` interface and a fully test-controlled implementation.
- `services/discovery/src/sources/pumpfun-logs-source.ts` — real, tested subscription wiring on top of Phase 04's `SubscriptionManager`; explicitly does NOT include fabricated Pump.fun log-parsing logic (documented gap, not a silent one).
- `docs/architecture/discovery-testing.md`.
- 33 tests: 19 unit + 14 integration, all against real local Postgres, real local Redis, and a real local mock RPC HTTP server (from `@helios/solana`'s test-support, reused via deep import).

### Fixed
- **Real cross-package test concurrency bug**, caught by running the full workspace gate rather than each package in isolation: `@helios/database` and `services/discovery` share the same local `helios_test` Postgres database, and Turborepo's default parallel task execution let their test suites run concurrently — one package's `TRUNCATE TABLE` setup was racing against the other's inserts, causing an intermittent, reproducible test failure (`expected 'duplicate' to be 'discovered'`). Fixed by running `turbo run test --concurrency=1` from the root `test` script. Documented in `docs/architecture/discovery-testing.md` so it isn't mistaken for flakiness later. Verified fixed with a clean-cache rerun (0 cached, 37/37 passed), not just a lucky green run.

## Phase 04 — Solana Infrastructure (2026-08-15)

### Added
- `packages/solana/src/circuit-breaker.ts` — CLOSED/OPEN/HALF_OPEN circuit breaker with an injectable clock for deterministic tests.
- `packages/solana/src/retry.ts` — exponential backoff retry helper with an injectable delay function and configurable `isRetryable` predicate.
- `packages/solana/src/json-rpc-client.ts` — minimal JSON-RPC 2.0 client over `fetch`, with a real `AbortController`-based timeout. Deliberately independent of `@solana/web3.js` — see scoping note in `docs/architecture/solana-testing.md`.
- `packages/solana/src/rpc-endpoint.ts` — wraps one RPC URL with retry + circuit breaker + health tracking; distinguishes non-retryable client-side JSON-RPC errors from retryable transient ones.
- `packages/solana/src/provider.ts` — `SolanaProvider`: ordered primary+backup failover across Section 9's typed method surface, `getHealth()`, and fail-closed behavior (`AllEndpointsUnavailableError`) when every endpoint is down.
- `packages/solana/src/subscription-manager.ts` — WebSocket connect/reconnect with backoff and full subscription resubscription/reconciliation after reconnect.
- `packages/solana/src/test-support.ts` + `test-support-ws.ts` — real local `node:http` and `ws` mock servers used by the integration tests (not mocks of the client's own logic).
- `docs/architecture/solana-testing.md`.
- 36 tests: 13 unit (circuit breaker + retry state-machine/backoff logic) + 23 integration (RPC failover, circuit-open skip, fail-closed on total outage, non-retryable-error fast-fail, WebSocket reconnect + full resubscription) — all against real local HTTP/WS servers.

### Notes
- No bugs required fixing this phase — typecheck, lint, unit tests, and integration tests all passed on their first full run once written. Worth stating plainly rather than manufacturing a "lessons learned" section: the first three phases established patterns (fail-closed error types, injectable clocks/delays for determinism, real-server-not-mock testing) that this phase followed directly, and it paid off.

## Phase 03 — Redis / Event Bus (2026-08-15)

### Added
- `packages/events/src/redis-client.ts` — fail-closed Redis client factory (no default connection string).
- `packages/events/src/stream-routing.ts` — exhaustive `EventType -> stream` mapping (`events:tokens`, `events:signals`, `events:risk`, `events:orders`, `events:positions`, `events:alerts`), with a compile-time exhaustiveness guard so a new `EventType` added to `@helios/types` without routing is a build error.
- `packages/events/src/publisher.ts` — `EventPublisher.publish()`: `MAXLEN`-trimmed `XADD`, idempotent on `eventId` via a `SET NX EX` dedup window (Section 55).
- `packages/events/src/consumer.ts` — `EventConsumer`: consumer-group reads via `XREADGROUP`, explicit ACK only on handler success, `reclaimStale()` for `XPENDING`/`XCLAIM`-based retry with dead-lettering to `dlq:<stream>` once delivery count reaches `maxAttempts`.
- `infrastructure/redis/` setup notes and `docs/events/testing.md`.
- 16 tests (7 unit covering stream-routing exhaustiveness + naming; 9 integration against a real local Redis: publish/consume roundtrip, multi-stream routing, idempotent dedup, failed-handler-leaves-pending, retry-then-succeed, retry-then-dead-letter with DLQ payload verification).

### Fixed
- `ioredis`'s default-export type didn't resolve cleanly under this repo's `NodeNext` + `isolatedModules` TypeScript config ("Cannot use namespace 'Redis' as a type"); switched every import to `ioredis`'s named `{ Redis }` export instead of the default export.
- `ioredis`'s typed `xreadgroup()` overloads require an exact literal argument shape that a conditionally-built arg list (optional `BLOCK`) can't satisfy; used the generic `.call()` escape hatch for that one command, documented inline.
- `turbo.json`'s `test` task env passthrough extended to include `REDIS_TEST_URL`/`REDIS_URL` (same class of issue caught in Phase 02 with `DATABASE_TEST_URL`).
- A test's own expectation was wrong, not the implementation: `reclaimStale()`'s delivery-count check happens *before* the `XCLAIM` that increments it, so dead-lettering happens one call later than a naive read of the code suggests. Fixed the test to match the real (correct) semantics and documented the exact sequencing in a code comment.

## Phase 02 — Database (2026-08-15)

### Added
- `database/migrations/0001`–`0008` — full PostgreSQL schema per Section 6: auth/RBAC, wallets, tokens + curve/migration/holders/creator/smart-money/market/momentum, scores + risk decisions + quotes, orders + transactions, positions + exits, portfolio + alerts + system + audit logs, and an app-role permission migration making `audit_logs` append-only at the grant level.
- `packages/database/src/migrate.ts` — checksummed, idempotent, transactional migration runner.
- `packages/database/src/pool.ts` — fail-closed pool factory (no default connection string).
- Repositories: `TokensRepository`, `WalletsRepository`, `RiskDecisionsRepository`, `OrdersRepository` (idempotent order creation + state-transition audit trail), `TransactionsRepository` (duplicate-signature guard), `PositionsRepository` (state-transition audit trail), `AuditLogRepository` (no update/delete method exposed, by design).
- `infrastructure/postgres/setup-local-db.sh` and `docs/database/testing.md` — local dev/test database setup.
- 34 integration tests (`packages/database/src/repositories/*.integration.test.ts`) run against a real local PostgreSQL 16 instance.

### Fixed
- `turbo.json`'s `test` task now declares `env: [DATABASE_TEST_URL, DATABASE_URL, REDIS_URL, NODE_ENV]` — Turborepo 2.x's strict env-passthrough mode was silently stripping `DATABASE_TEST_URL` from child processes, which would have made `pnpm test` at the repo root look green without ever touching the database. Caught by actually running the gate, not by inspection.
- Postgres 15+ revokes `CREATE` on the `public` schema from non-owner roles by default; local setup script now grants it explicitly.
- `CREATE EXTENSION pgcrypto` requires superuser/database-owner privileges; documented as a one-time manual step in `docs/database/testing.md` (the migration itself still declares `CREATE EXTENSION IF NOT EXISTS` for environments where the app role already has the privilege, e.g. most managed Postgres providers).

## Phase 01 — Foundation (2026-08-14)

### Added
- Monorepo tooling: pnpm workspaces, turbo pipelines, shared `tsconfig.base.json`, ESLint, Prettier.
- `packages/types`: event envelope, token/validation types, security result (with UNKNOWN-not-SAFE invariant), scoring types + weighted-score math, risk/authorization contracts, execution & position state machines, standardized error class, RBAC/system enums. 25 tests.
- `packages/config`: control-plane vs trading-runtime environment schemas (Zod), `loadEnv()` fail-closed loader, `forbidLiveSecrets()` guard. 13 tests.
- `packages/shared`: structured JSON logger with secret redaction, ID generation helpers. 12 tests.
- Placeholder packages (`events`, `database`, `solana`, `risk-models`, `validation`) and placeholder apps/services for the full Section 4 repository layout.
- `HELIOS_ARCHITECTURE_AUDIT.md`, `IMPLEMENTATION_STATUS.md`, `KNOWN_ISSUES.md`, `PRODUCTION_READINESS.md`.

### Verified
- `pnpm install`, `pnpm test`, `pnpm build`, `pnpm typecheck`, `pnpm lint` all run clean across all 32 workspace packages.

## Phase 00 — Repository Audit (2026-08-14)
- Produced `HELIOS_ARCHITECTURE_AUDIT.md`. Confirmed greenfield (no prior repository supplied).
