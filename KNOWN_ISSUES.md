# KNOWN_ISSUES.md

## Phase 01

1. **Turbo build-output warnings for placeholder packages.**
   Packages whose `build` script is just an `echo` (all `services/*`,
   `apps/web`, `apps/api`) produce a turbo `WARNING no output files found`
   line. Cosmetic only — does not fail the build, does not affect exit code.
   Will disappear naturally as each service gets a real build step in its
   own phase.

2. **One ESLint warning, not an error, in `packages/shared/src/logger.ts`.**
   A single `eslint-disable-next-line no-console` is present on the default
   log sink so the package can ship with zero runtime dependencies. Callers
   who want a different sink (e.g. to a log shipper, or to silence stdout in
   tests) can inject one via `createLogger({ sink })`. Documented in-code.

3. **No CI pipeline yet.** Phase 01 only requires local `pnpm` gates to
   pass, which they do. A CI workflow (GitHub Actions or similar) enforcing
   these same gates on every push is recommended before Phase 02, but is not
   part of the Section 66 Phase 01 deliverable list.

4. **No Dockerfiles / docker-compose yet.** Correctly deferred — Section 62
   (Deployment) is not until Phase 30 in the build order, and Section 3.0
   requires the Hostinger VPS split to be reflected in any compose file, which
   isn't meaningful until there's a real service to containerize.

No security, correctness, or data-integrity issues are currently known in
the Phase 01 deliverable.

## Phase 02

1. **`change_me_in_production` placeholder password on the `helios_app` role.**
   Migration `0008_app_role_permissions.sql` creates this role with a
   placeholder password for local development. Any shared/staging/production
   environment MUST rotate this before use — tracked here so it isn't
   forgotten. Not a Phase 02 blocker since Section 3.0 doesn't provision real
   infrastructure until later phases.

2. **`CREATE EXTENSION pgcrypto` requires elevated privilege.** On a fresh
   database where the app role isn't the owner (common on managed providers
   with strict role separation), the first migration will fail unless
   `pgcrypto` is pre-created by an admin/superuser. Documented in
   `docs/database/testing.md`; most managed Postgres providers (RDS, Neon,
   Supabase — all mentioned in Section 3 as acceptable hosts) grant this by
   default to the primary app role, so this mainly affects strict local
   setups. Not fixed by code, because there is no code-level fix that
   doesn't either require superuser (defeats the purpose) or silently
   swallow the error (Rule 1 violation).

3. **No connection pooler (e.g. PgBouncer) configured yet.** Fine for a
   single always-on VPS process per Section 3.0's topology; revisit if
   `services/*` end up needing many short-lived connections.

4. **`risk_limits` table exists in schema but has no repository yet.**
   Section 21/22's hard limits are read by `services/risk`, which is not
   built until Phase 12. The table is ready; the reader isn't yet, and isn't
   claimed to be.

No security, correctness, or data-integrity issues are currently known in
the Phase 02 deliverable — every constraint claimed in
`IMPLEMENTATION_STATUS.md` was verified with a test that would fail if the
constraint were removed.

## Phase 03

1. **No long-running worker loop yet.** `EventConsumer.processNew()` and
   `reclaimStale()` are single-pass methods, called once per test. A real
   worker (Phase 05+) will need to call these in a scheduled loop with
   backoff, health reporting, and graceful shutdown — none of which exists
   yet. Deliberately out of scope for "build the bus" vs. "build a worker
   that uses the bus."
2. **No cross-service wiring.** Nothing actually publishes a
   `TOKEN_DISCOVERED` event yet because `services/discovery` doesn't exist
   yet (Phase 05). This phase only proves the bus itself works correctly.
3. **`ioredis`'s strict `xreadgroup()` typed overloads were bypassed via
   `.call()`** for the one command whose optional-`BLOCK` argument shape
   didn't fit the library's overload set. Still goes over the same
   real connection/protocol — this is a typing-ergonomics workaround, not a
   functional gap. Every other command (`xadd`, `xack`, `xpending`,
   `xclaim`, `xrange`, `xgroup`, `xlen`) uses ioredis's normal typed API.
4. **Dedup window is 24h, not permanent.** `EventPublisher`'s idempotency
   guard (`SET NX EX 86400`) means a truly identical `eventId` republished
   more than 24h later would NOT be deduplicated. This matches typical
   idempotency-key TTL practice (Section 55 doesn't specify a retention
   period) but is worth knowing if a caller ever needs longer-lived replay
   protection.

No security, correctness, or data-integrity issues are currently known in
the Phase 03 deliverable.

## Phase 04

1. **Live Solana RPC testing (Wave 1).** Gated suite
   `src/__integration__/live-rpc.integration.test.ts` runs when
   `LIVE_RPC_TEST_URL` is set; skips cleanly otherwise. Local mock-server
   resilience tests remain the default CI path. Provider-specific quirks
   beyond the smoke methods may still exist — expand coverage as needed.
2. **`@solana/web3.js` declared (Wave 1)** as a dependency for future typed
   account/transaction parsing. `SolanaProvider` remains generic JSON-RPC
   for the resilience layer; web3.js is not required for the live smoke tests.
3. **`SubscriptionManager`'s notification router is simplified.** It routes
   any unmatched notification to every subscription with an unset
   server-assigned id, which is adequate for this phase's single-
   subscription-type tests but will need real per-method notification
   parsing (`accountNotification` vs `logsNotification` shapes, etc.) once
   Phase 05+ wires up actual token/account subscriptions.
4. **No metrics/observability hooks yet** (RPC latency, circuit state
   changes, reconnect counts) — Section 64 metrics are a Phase 30 concern.

No security, correctness, or data-integrity issues are currently known in
the Phase 04 deliverable.

## Phase 05

1. **`PumpFunLogsSource` parsing (Wave 2).** IDL-pinned parser in
   `sources/pumpfun-parse.ts` with live mainnet TradeEvent fixture.
   CreateEvent live capture was rate-limited (429) in-session; layout from
   official `pump-public-docs` IDL. Trade events do not become discovery
   candidates (no name/symbol). Re-capture Create fixture when possible.
2. **`services/discovery` isn't wired into a long-running worker yet.**
   `DiscoveryEngine.handleRawEvent()` is called directly by tests; a real
   `workers/discovery.worker.ts` that starts a source and runs continuously
   with health reporting and graceful shutdown is a later-phase concern
   (same category as Phase 03's note about `EventConsumer`).
3. **Cross-package shared-database test concurrency**: `pnpm test` at the
   root now runs `turbo run test --concurrency=1` because
   `@helios/database` and `services/discovery` (and separately
   `@helios/events` and `services/discovery`) share the same local test
   Postgres/Redis instances. This makes the full-repo test run slower than
   parallel execution would be, but correctness beats speed here — see
   `docs/architecture/discovery-testing.md` for the full explanation. A
   future phase could give each package its own test database/schema to
   restore parallelism, but that's an optimization, not a correctness gap.
4. **`TokenValidationEngine`'s metadata/market/liquidity checks are
   permanently false in this phase** — not a bug, just unpopulated data
   until Phase 06 (Token Analysis) exists. Reasons are stated explicitly in
   the result rather than silently passed.

No security, correctness, or data-integrity issues are currently known in
the Phase 05 deliverable.

## Phase 06

1. **`MetadataService` has no verified Metaplex PDA derivation or account
   parsing.** As documented in `docs/architecture/token-analysis-testing.md`,
   this sandbox cannot fetch or verify the real Metaplex metadata account
   layout against live chain data, so the service takes the account address
   and a parser as caller-supplied inputs rather than deriving/decoding
   them itself. Same honesty pattern as Phase 05's `PumpFunLogsSource`.
2. **Liquidity analysis only covers the bonding-curve phase.** Post-
   migration DEX pool liquidity decoding is deferred to Phase 07, since it
   requires knowing which pool a token migrated to.
3. **Creator risk classification is a single-signal (token-creation
   frequency) heuristic.** Funding patterns, sell behavior, and token
   relationships from Section 16 require wallet-transaction-history
   analysis that belongs to Phase 09 (Smart Money) and beyond. Documented
   as a starting point, not a final model, in `creator-risk.ts`.
4. **No worker/scheduler wiring**, consistent with every prior service
   phase — these are directly-callable, fully-tested engines, not
   long-running processes yet.
5. **`BondingCurveEngine`'s market cap calculation requires a caller-
   supplied `totalSupply`.** The engine doesn't fetch total supply from
   chain itself (that's a `getAccountInfo`/mint-account concern this phase
   didn't need to duplicate from `TokenValidationEngine`'s existing check);
   market cap is `null` in the result if `totalSupply` isn't provided,
   which is honest rather than silently wrong.

No security, correctness, or data-integrity issues are currently known in
the Phase 06 deliverable.

## Phase 07

1. **`MigrationEngine.confirm()` has no verified DEX pool account parsing.**
   Same pattern as Phases 05/06 — liquidity and trading-availability checks
   are caller-supplied functions rather than real Raydium/Orca account
   decoding, which this sandboxed environment cannot verify against live
   chain data. See `docs/architecture/migration-testing.md`.
2. **Section 13 steps 4-8 are not implemented.** Refreshing quote sources,
   refreshing market data, updating position routing, recalculating risk,
   and recalculating exit conditions after a confirmed migration are all
   owned by services that don't exist yet (Quote/Position/Risk/Exit
   engines, Phases 12-17). `markPostMigration()` publishes the event those
   services will react to; it doesn't do their job for them.
3. **No worker/scheduler wiring**, consistent with every prior service
   phase — `MigrationEngine` is directly callable and fully tested that
   way, not a long-running process yet.
4. **`token_migrations` schema gap found and fixed this phase, not before.**
   The table was missing a `UNIQUE(token_id)` constraint since Phase 02;
   nothing depended on that invariant until this phase's repository needed
   it for race-safety. Documented in `CHANGELOG.md`'s Phase 07 entry as a
   real, caught issue rather than glossed over.

No security, correctness, or data-integrity issues are currently known in
the Phase 07 deliverable.

## Phases 08–18

Known issues for Phases 08–16 (Security through Position) live in each
phase's own report under `docs/phase-reports/` and in
`docs/phase-reports/DELIVERY_INDEX.md`'s "Explicitly out of scope"
section, not duplicated here — this top-level file's scope was fixed at
Phases 01–07 before those phases were merged in. Phases 17 and 18 follow
the same convention; their issues are in
`docs/phase-reports/PHASE_17_EXIT_REPORT.md` and
`docs/phase-reports/PHASE_18_LIVE_EXECUTION_REPORT.md` respectively, but
two items are worth surfacing at this top level because they differ in
*kind*, not just scope, from every other phase's gaps:

1. **Phases 17 and 18's tests were not actually run.** Every phase
   through 16 ran its tests for real against an installed `vitest` (and,
   where applicable, real local Postgres/Redis/mock-RPC). Both were
   authored in a sandbox with no network access, so `npm install` could
   not complete and `vitest` never executed for either. Verification
   instead consisted of a strict `tsc --noEmit` pass against this
   repository's real type contracts (zero errors — for Phase 18, also
   confirmed as zero regressions across every other service depending on
   `packages/types`) and a manual trace of every test assertion's logic
   and arithmetic. This is real work, but it is not the same guarantee a
   green test run provides — run `npm install && npm test` in
   `services/exits/` and `services/execution/` at the first opportunity
   and treat both phases' PARTIAL status as provisional until that
   happens.

2. **Phase 18's `LiveTradingActivationGate` cannot verify the truth of
   what it's told.** It enforces Section 70's sequencing and the
   presence of an admin-approval record, but it has no way to confirm
   that `paperModePass`, `testnetPass`, etc. are honestly sourced from a
   real, completed process rather than hand-set to `true`. Checked
   against this repository's actual current state, an honest caller can
   only ever receive `DENIED` — see `services/execution/README.md`'s
   status table. Closing this gap (a real source of truth for these six
   inputs, e.g. genuine CI-gate integration and a real signed
   admin-approval workflow) is Section 46/69 territory, not yet built.

## Phase 19

1. **PARTIAL — no DB / event-bus / live balance wiring.** Same intentional
   gap pattern as Phases 08–18. `portfolio_snapshots` and `pnl_snapshots`
   tables already exist in migration 0007; repositories and event publish
   are Track A work, not deferred by accident.

2. **No `PORTFOLIO_*` EventType entries added.** Event names will be added
   only when wiring publishes them, to avoid inventing dead event types
   (same discipline as prior PARTIAL phases).

3. **Cash balance is caller-supplied.** The engine does not read a wallet
   balance from chain or DB. A live balance adapter is a wiring concern.

No correctness or Rule-1 issues are known in the Phase 19 engine itself
after the 24/24 vitest run.

## Phase 20

1. **PARTIAL — no real VPS gateway client.** `ControlGatewayClient` is an injected
   port; only an in-memory test double ships. Phase 21 supplies the network
   implementation against `services/control-gateway`.

2. **No authentication or RBAC.** `actor` is opaque audit correlation only.
   Phases 22 and 23 add real identity and permission enforcement.

3. **No TLS / rate-limit / reverse-proxy.** Deployment concerns (Phase 30).

4. **Command audit rows not yet written to `audit_logs`.** Wiring concern once
   a DB client is available on the Hostinger control plane for append-only audit.

No Rule-1 or boundary violations known after the 26/26 vitest run.

## Phase 21

1. **PARTIAL — no durable mode/kill-switch store.** Process memory only;
   restart loses state. Persistence is a later wiring concern.

2. **No TLS / mutual authentication on the gateway socket.** Phase 22/30.

3. **Accepted MANUAL_EXIT is not yet dispatched to ExitEngine workers.**
   The gateway accepts and acks; worker wiring is separate.

4. **Phase 20 KNOWN_ISSUES item about "no real VPS gateway client" is resolved**
   by `HttpControlGatewayClient` / `WsControlGatewayClient`.

No Rule-1 or trust-boundary violations known after the 18+32 vitest runs.

## Phase 22

1. **PARTIAL — in-memory auth store only.** `users` / `sessions` tables exist in
   migration 0001; Postgres-backed AuthStore is Track A wiring.

2. **No refresh tokens / rotation.** Single opaque session token with TTL.

3. **No MFA / OAuth / SSO.** Out of scope for this phase.

4. **RBAC permission checks not enforced on routes.** Identity is established;
   role→permission gating is Phase 23.

No credential-leak or lockout logic issues known after the 51/51 vitest run.

## Phase 23

1. **PARTIAL — permissions from static ROLE_PERMISSIONS table**, not yet
   loaded from `role_permissions` DB rows (migration 0001). Runtime table
   is the source of truth until wiring.

2. **No per-resource ACLs** (e.g. trader may only exit own positions) —
   position ownership checks belong with position service wiring.

3. **WebSocket gateway client auth/RBAC** on the VPS socket is still open
   (Phase 21/22 notes); control-plane HTTP path is covered.

RBAC enforcement on HTTP commands is covered by the 68/68 vitest run.

## Phases 24–28 (Frontend)

1. **PARTIAL — no signal/position/portfolio read APIs on apps/api yet.**
   Opportunity and position terminals show honest empty/unknown states.

2. **No charting, websockets, or live order book in the UI.** Control
   commands and status poll only.

3. **UI RBAC is advisory.** Buttons are disabled by role hints; the API
   still returns 403 if a caller bypasses the UI.

4. **No production CSS design system / accessibility audit yet.**

## Phases 29–30

1. **Backtest is single-lot / close-fill model** — not a full portfolio simulator.
2. **No historical market-data feed wiring** into BacktestEngine.
3. **HealthAggregator does not scrape live Prometheus/RPC** — caller supplies component rows.
4. **PRODUCTION READY remains false** until live infra checklist items are verified.

## Phase R5

1. **Stages are injectable stubs in tests** — not yet bound to live
   DiscoveryEngine / ScoringEngine / SignalEngine / RiskEngine instances
   with DB/event-bus wiring (R2–R4).

2. **Queue is InMemoryJobQueue** — Redis Streams consumer-group adapter
   not yet plugged in (packages/events is ready to host it).

3. **Worker does not start as a process from monorepo root** — no
   `pnpm --filter worker-pipeline start` entry in root package yet.

4. **Paper/live execution still outside this worker** — by design; risk
   authorization is the terminal success of R5.

## Phase R2

1. **Pipeline unit tests use mocked repos/publisher** — full Postgres/Redis
   integration for these three pipelines is not yet in CI in this sandbox
   (requires DATABASE_TEST_URL + REDIS_TEST_URL like discovery).

2. **Smart-money/momentum require token row** — TOKEN_NOT_FOUND if mint
   was never discovered/persisted (intentional FK integrity).

3. **Worker (R5) not yet bound to these pipelines** — stages remain injectable stubs.

## Phase R3

1. **Kill switch restart test uses InMemoryKillSwitchStore** — Postgres
   singleton-row behavior is implemented in KillSwitchRepository but not
   exercised against a live DATABASE_TEST_URL in this sandbox pass.

2. **RiskPipeline ports are structural** — wire real repos at process boot.

3. **R5 worker still not bound** to scoring/signal/risk pipelines.

## Phase R4

1. **No live aggregator / mainnet simulation RPC** in this environment —
   QuoteSource and SimulationSource remain injected (mock/fixture-backed).

2. **Quote DB id vs quoteId** — engine quoteId is UUID in memory; DB
   row id is separate; pipeline publishes both.

3. **R5 worker not yet bound** to quote/build/simulate stages.

## R5 engine binding

1. **Risk stage supplies account/quote/sim from port closure** — worker does
   not yet pull live account state from portfolio service.

2. **Discovery enrich port optional** — default only validates mint presence;
   full DiscoveryEngine persist/publish still separate.

3. **Persistence pipelines (R2–R4) not invoked inside stages** — engines only;
   durable write remains in *Pipeline classes at process boot composition.

## Phase R6

1. **No Redis-backed paper idempotency store** — InMemoryIdempotencyStore
   is process-local (Section 7 notes Redis for multi-process).

2. **Entry token amount still caller-supplied** — decimals not inferred
   (Rule 1; no fabricated conversion).

3. **Exit settlement price required from caller** — ExitEngine does not
   invent prices before PositionEngine.recordExit.

## Phase R7

1. **No dedicated PORTFOLIO_SNAPSHOT event type** — uses POSITION_UPDATED
   with kind: PORTFOLIO_SNAPSHOT / PNL_SNAPSHOT payload (honest; no schema invent).

2. **Alerts service still empty stub** — not part of R7 scope (prompt: portfolio).

3. **Worker does not yet call PortfolioPipeline** on position open/close.

## Phase R8

1. **Live Postgres integration** not executed in this sandbox (no
   DATABASE_TEST_URL). FakeAuthDb proves SQL-shaped durability.

2. **apps/api boot** still defaults to InMemoryAuthStore until process
   composition injects PostgresAuthStore(pool).

## Phase R10

1. **Not yet invoked at process boot** — engine exists; VPS entrypoint must call
   `StartupReconciliationEngine.run()` before accepting LIVE commands.

2. **RECOVERY TEST PASS** (Section 70) remains unchecked — requires verified
   end-to-end restart against real Postgres/RPC, not unit mocks alone.

## Deployment topology

1. **Single-host Hostinger VPS residual risk** — network isolation between control
   plane and signing is gone. Documented in
   `docs/architecture/deployment-topology.md`; not mitigated by renaming
   Reserved VM to "VPS."

## Wave B1 (2026-09-24)

Closed edge gaps from the 13-gap register:
1. CORS policy — explicit allowlist implemented.
2. Rate limiting — sliding-window + memory/redis store; fail-closed on auth.
3. Security headers — CSP, XFO, XCTO, Referrer-Policy, optional HSTS.
4. TLS termination docs — deployment-topology.md.

Remaining (not B1): B2 auth boot, B3 WS auth/RBAC, B4 redaction/role/password, B5 dependency audit, B6 shutdown/readiness/money plan, B7 verification.

## Wave B2 (2026-09-24)

Closed gap 5 (Auth optional at boot): production / requireAuth now throws
AuthEngineRequiredError when AuthEngine is not injected. Test path unchanged.

## Wave B3 (2026-09-24)

Closed gap 6 (WebSocket gateway has no auth/RBAC): bearer identity on WS
upgrade + RBAC on COMMAND frames. Actor is bound to verified identity.

Deferred (honest marker): mutual TLS between apps/api and control-gateway
is not implemented in this wave; transport auth is bearer-token based.
Production must inject a real `GatewayAuthPort` (session store or service
credential) — `MapGatewayAuthPort` is test-only.

## Wave B4 (2026-09-24)

Closed gaps 7–9:
7. Redaction is key-name-only → value-pattern pass added (`redactSecretValues`).
8. Single broad helios_app role → documented + `helios_readonly` SELECT-only role (0014).
9. Placeholder password → runbook blocks non-dev use; operators must rotate before shared/staging/prod.

`audit_logs` append-only grants unchanged.

## Wave B5 (2026-09-24)

Closed gap 10 (no dependency-audit baseline): recorded in
`docs/testing/dependency-audit-baseline.md`.

Known accepted-at-baseline findings (mostly dev tooling — vite/vitest/esbuild;
see baseline for GHSA links). Production runtime impact to be reviewed before
LIVE; do not silently major-bump to "clear" the report.

## Wave B6 (2026-09-24)

Closed gaps 11–13 (documented / mitigated):
11. Money math float64 — migration path documented; runtime unchanged (M0).
12. No graceful shutdown handlers — SIGTERM/SIGINT drain added for api + pipeline.
13. No liveness/readiness distinction — HealthResponse.live / .ready; 503 when not ready.

Do not equate process uptime or health.ready with LIVE trading authorization.

## Wave B7 (2026-09-24)

Part 0.5 gap register closed except float64 money math (deferred with plan
in `docs/architecture/money-math-migration.md`).

**Start Gate: NOT PASSED in this session.** Missing raw monorepo gate output
and live RPC/WS/forbidLiveSecrets verification. Do not begin Part I Wave 1
until Start Gate items are green with pasted evidence. See
`docs/phase-reports/MASTER_WAVE_B7_REPORT.md`.

## Wave 3 (2026-09-24)

Metaplex metadata PDA + decode implemented under `services/token-analysis/src/metadata/`.
Seeds: `["metadata", program_id, mint]`. Live BONK fixture verified.
Token-2022 → explicit `token_2022_unsupported` (not `account_not_found`).

## Wave 4 (2026-09-24)

PumpSwap pool PDA + decode implemented (IDL seeds include index + creator,
not only mint_a/mint_b). Raydium AMM v4 parser not implemented — only needed
for pre-2025-03-20 historical tokens; no such fixtures in tree.
Live pool account fixture capture optional (owner+discriminator unit tests
cover decode path).

## Wave 5 (2026-09-24)

Live Jupiter client at `services/quote/src/providers/jupiter-client.ts`.
`priceUsd` is set to 0 when Jupiter does not return a USD price — amounts
and impact are authoritative; do not invent USD.
Requires `JUPITER_API_KEY` in process env for production wiring.

## Wave 6 (2026-09-24)

Helius `getTransactionsForAddress` provider returns raw txs. USD buy/sell
classification is not inferred from raw account keys (would be a guess) —
`HeliusTradeActivitySource` sets buyUsd/sellUsd to 0 with lastTradeAt when
activity exists. Full trade-side classification remains a follow-up.

## Wave 7 (2026-09-24)

Live simulate client maps missing `unitsConsumed` to MAX_SAFE_INTEGER so the
COMPUTE check cannot pass on an unknown value. Balance/touched account
extraction from simulate responses is left empty unless account data is
provided — never invented.

## Wave 8 (2026-09-24)

Pipeline worker PAPER-only gate + UNAVAILABLE stage status + exits port.
VERIFY-LIVE RPC-kill soak is an operator procedure (requires long-running
worker + injectable RPC fault); unit tests cover UNAVAILABLE short-circuit
and no-execution-import. CycleReport type is available for operators to
persist; automatic file logging of three soak logs is optional ops wiring.

## Wave 8B (2026-09-24)

PostgresControlPlaneDataSource bound with readOnlyQuery + helios_readonly role.
Positions table has no unrealized mark column — markStatus stays UNKNOWN and
unpricedOpenPositionCount equals open count until a mark feed exists.
UnavailableDataSource remains default when no DB configured.

## Wave 9 (2026-09-24)

CI workflow and Docker/backup scaffolding added. Full green CI not executed
in the agent environment (registry/install limits). Migration 0008 still
contains historical `change_me_in_production` for local bootstrap — rotate
outside migrations for any shared environment.

## Wave 10 (2026-09-24)

Live probes verified primary Helius RPC/WS and public backup HTTP RPC.
Wallet, secrets rotation, live backup restore, recovery boot, and Section 70
remain open. productionReady stays false.

## Wave 11 (2026-09-24)

Section 70 remains fully closed. Display-only enforcement test added under
services/execution. Multi-day paper/testnet soaks and human admin approval
are operator work outside the agent.

## Wave D1 (2026-09-24)

Dashboard design spec written. Implementation deferred to D2 after human review.
Type gaps (charts, WS UI, mark prices) documented in the spec — not invented.

## Wave D5 (2026-09-24)

Acceptance docs written without live screenshots/axe. Dashboard nav still lacks
dedicated /portfolio and /readiness routes (readiness embedded on Dashboard).

## Wave E1 (2026-09-25)

1. **Harness only in this handoff zip.** Full monorepo `ExitEngine.evaluate()`
   hook-up is a composition step at worker boot — collector is fail-open
   (throw must not change evaluate result).
2. **PAPER soak n≥30 not captured here.** Baseline rates are
   `INSUFFICIENT_SAMPLE` until a real soak writes observations.
3. **E2–E5 not started.** No break-even, trail, time-stop, or capture claims.

## Wave E2 (2026-09-25)

1. Engine is in-process and not yet bound to PositionEngine.recordExit
   or the pipeline worker (composition still PAPER-gated at boot).
2. Peak PnL must be supplied by the caller; engine does not persist peak.
3. E3 trail / moon-bag and E4 time-stop not implemented.

## Wave E3 (2026-09-25)

1. Peak must still be supplied by caller; engine does not persist peak.
2. Time-stop (E4) not implemented.
3. Worker still does not invoke evaluateExit on live marks.

## Wave E4 (2026-09-25)

1. holdMs is caller-supplied; engine does not clock itself.
2. E5 PAPER soak / policy doc not done — no LIVE or capture claim.
3. Worker wiring still open.

## Wave E5 (2026-09-25)

1. Fixture matrix only — no multi-day real-mark soak in this handoff.
2. Soak n=0 → INSUFFICIENT_SAMPLE for capture statistics.
3. evaluateExit still not bound to the pipeline worker.

## Wave O1 (2026-09-25)

1. Adapters are not yet called from the full monorepo `server.ts` / worker `main`
   (those files are not in this partial handoff). Composition remains a boot-wire step.
2. Crash-loop supervisor implemented in Wave O3 (`packages/runtime/src/supervisor.ts`).
3. No 24/7 claim.

## Wave O2 (2026-09-25)

1. Not wired into a pre-existing JsonRpcClient in this partial tree (those files
   were not in the handoff zip). Drop-in module ready for monorepo composition.
2. Sleep on budget miss is short/fixed (50ms) — operator can tune.
3. No 24/7 claim.

## Wave O3 (2026-09-25)

1. Lock store is in-memory in this package; VPS should use flock/O_EXCL on a path.
2. Supervisor records exits; it does not spawn OS children in this handoff.
3. Process uptime is not LIVE authorization.

## Wave O4 (2026-09-25)

1. Guard is in-process; SubscriptionManager in the full monorepo is not wired here.
2. Idle watchdog detects stall only — HTTP backfill is not implemented in this wave.
3. No 24/7 evidence claim.

## Wave O5 (2026-09-25)

1. No multi-day / weekend soak captured in this zip → INSUFFICIENT_SAMPLE.
2. 24/7 process uptime is not LIVE trading authorization.
3. productionReady remains false.

## Wave 8 Agent OS (2026-09-25)

1. Charter/scaffold only — no tools, no LLM client, no KB (Wave 9+).
2. applyProposal is hard-throw; no human confirm-token flow yet (later II.4/II.7).
3. Naming collision: earlier handoff Wave 8 was PAPER pipeline, not Agent OS.

## Wave 9 Agent OS (2026-09-25)

1. In-memory only — no Postgres KB table in this wave.
2. Search is substring, not embeddings.
3. No LLM narration layer yet.

## Wave 10 Agent OS (2026-09-25)

1. Capture is in-process memory; not persisted to Postgres.
2. Scoring/pipeline engines in the full monorepo are not yet wrapped.
3. Fail-open is tested at the hook, not at a live worker.

## Wave 11 Agent OS (2026-09-25)

1. Probes run on in-memory events only.
2. Not scheduled on the pipeline worker yet.
3. INCONCLUSIVE is not auto-paged (Wave 15 alerting).

## Wave 12 Agent OS (2026-09-25)

1. `read.sql_select` has no live Postgres adapter in this handoff (Wave 8B role exists separately).
2. Tool handlers for features/probes are registered by the caller; defaults are UNAVAILABLE.
3. No agent runtime loop yet (Wave 13).

## Wave 13 Agent OS (2026-09-25)

1. Runtime does not persist runs; no USD meter beyond config zeros.
2. Planned tool list is caller-supplied (no free-form model tool choice).
3. Real LLM client is not wired; FakeLlmClient only in this wave.

## Wave 14 Agent OS (2026-09-25)

1. Wrapper is not mounted on services/risk in the full monorepo boot yet.
2. Hard limits remain local constants in this module (source of truth still services/risk when composed).

## Wave 15 Agent OS (2026-09-25)

1. Alerts are in-memory; no operator inbox / page-out.
2. Monitor does not call control-gateway HARD_PAUSE.

## Wave 16 Agent OS (2026-09-25)

1. No Dashboard.tsx panel wired to this read model yet.
2. ACK/RESOLVE is a function contract, not a DB trigger (Wave 12 human-ownership trigger is later II.7).

## Wave 17 Agent OS (2026-09-25)

1. Single named series only; no cohort splits yet.
2. Time windows are implicit event order, not clock buckets.

## Wave 18 Agent OS (2026-09-25)

1. Evidence is not re-queried from live tools before persist (G15 full loop later).
2. No trade-trace path yet (Wave 19).

## Wave 19 Agent OS (2026-09-25)

1. Stages are caller-supplied; no automatic join to pipeline event log.
2. paper_fill is a record, not an execution call.

## Wave 20 Agent OS (2026-09-25)

1. HARD_LIMITS here are illustrative envelope values — compose with services/risk Section 22 at boot.
2. No persistence of accepted candidates (Wave 21).

## Wave 21 Agent OS (2026-09-25)

1. In-memory map only — no Postgres table in this handoff.
2. No staging delay / confirm token yet (Wave 22).

## Wave 22 Agent OS (2026-09-25)

1. Confirm token is a literal `CONFIRM` in this wave — not a one-time nonce store.
2. Delay is returned as metadata; no timer worker yet.
3. HTTP routes are Wave 23.

## Wave 23 Agent OS (2026-09-25)

1. Handler is not registered on apps/api router in this handoff zip.
2. Dashboard editor is Wave 24.

## Wave 24 Agent OS (2026-09-25)

1. View-model is not yet mounted as a Dashboard zone.
2. Submit does not call handleStagePreset over HTTP in this handoff.

## Wave 25 Agent OS (2026-09-25)

1. No noise-null permutation harness yet (G18; Wave 26/28).
2. No market-data fixture soak attached.

## Wave 26 Agent OS (2026-09-25)

1. Tightening heuristic is a stub policy, not a fitted model.
2. Shadow comparison is Wave 27.

## Wave 27 Agent OS (2026-09-25)

1. Shadow pairs are not persisted.
2. No dashboard diverge panel yet.

## Wave 28 Agent OS (2026-09-25)

1. historyN is caller-supplied; no automatic lookback query.
2. Noise-null permutation still not a full eval harness.

## Wave 29 Agent OS (2026-09-25)

1. No durable task table / DB trigger for human-only DONE.
2. Digest is not emailed or paged.

## Wave 30 Agent OS (2026-09-25)

1. Promotion does not flip store.active (activate() still throws from Wave 21 by design until a dedicated human persist path).
2. No approval table / DB trigger yet.

## Wave 31 Agent OS (2026-09-25)

1. Suite is in-process; not a CI matrix across apps/api + services/risk.
2. Guardrails that block merges are Wave 32.

## Wave 32 Agent OS (2026-09-25)

1. Guard is a library, not a required CI job in this handoff.
2. Wave 36 still locked. Part II Agent OS track complete at library level.

## Wave C1 (2026-09-25)

1. Inventory covers this partial tree only.
2. C2/C3 blocked until a human marks DELETE.

## Wave C2/C3 (2026-09-25)

1. Only three superseded exit-gate files removed after human "Delete".
2. Inlined CJS copies of Agent OS / O2 logic remain (no vitest loader); not deleted.
3. C1 inventory still lists removed paths with human DELETE for audit.

## Wave C4 (2026-09-25)

1. Shared production logger from the full monorepo is not in this handoff; hygiene is a scanner only.
2. Gate scripts still use console.log for raw PASS lines (allowed).

## Wave C5 (2026-09-25)

1. Docs consistency is a presence/phrase check, not a full prose audit of every historical phase report.
2. C6 still needs to re-run functional gates.

## Wave C6 (2026-09-25)

1. Regression is the in-tree Node gates, not full `pnpm` monorepo CI.
2. Live soak / Section 70 still open.

## Wave 33 (2026-09-25)

1. Scorecard runs library contracts, not a live LLM leniency corpus.
2. Part II dashboard/editor HTTP mount still partial.
3. Interference check is Wave 34.

## Wave 34 (2026-09-25)

1. Check is in-library, not a running pipeline + agent process pair.
2. Wave 35 must not check manualAdminApproval.

## Wave 35 (2026-09-25)

1. Acceptance assembled; productionReady remains false.
2. Wave 36 locked — do not build.
3. Human sign-off is out of band.

## Stage 1 deploy artifacts (2026-09-25)

1. Docker images are stubs on this partial tree — not a full turbo monorepo build.
2. migrate.mjs does not apply the real schema.
3. Operator must still provision the VPS.

## Stage 3 §14 (2026-09-25)

1. Journal is in-memory; SCORE_CREATED is not yet emitted by the full scoring engine in this partial tree.
2. Outcomes table is §15.

## Stage 3 §15 (2026-09-25)

1. SQL is a contract file — not applied to a live Postgres here.
2. Evaluation aggregates are §16.

## Stage 3 §16 (2026-09-25)

1. Eval is a library, not a Compose service yet.
2. No live paper-trade rows in this sandbox — sample size will stay insufficient until Stage 2 soak.

## Stage 4 §17 (2026-09-25)

1. Scoring engine in the full monorepo does not yet read this store.
2. Proposal job is §18.

## Stage 4 §18 (2026-09-25)

1. Failure cluster is caller-supplied, not auto-mined from outcomes.
2. Proposal is not inserted into the store automatically (human/insert inactive is explicit).
3. Shadow compare is §19.

## Stage 4 §19 (2026-09-25)

1. Shadow pairs are not persisted to Postgres.
2. Promotion compare is §20.

## Stage 4 §20 (2026-09-25)

1. Edge rule is avg PnL only — not a full stats test.
2. Rollback is re-insert previous active row (no automatic timer).
3. Metrics per version are §21.

## Stage 4 §21 (2026-09-25)

1. Metrics are not scraped by Prometheus in this partial tree.
2. §22 must not flip Section 70 flags.

## Stage 4 §22 (2026-09-25)

1. Code plan A/B stages 3–4 are library-complete.
2. VPS deploy + PAPER soak still blocking operational evidence.





















































