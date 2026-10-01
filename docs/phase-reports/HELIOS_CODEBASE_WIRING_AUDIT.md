# HELIOS Codebase Audit: Existing Components, Runtime Wiring, Gaps, and Completion Plan

**Audit scope:** `Helios.zip` repository  
**Purpose:** Record what exists in the codebase, what is connected at runtime, what is only a scaffold/library, and the wiring required before production use.  
**Status:** Engineering audit / implementation handoff  
**Important:** This document is based on the repository inspection and checks performed for this audit. It is not a claim that every possible runtime path has been exhaustively tested. Re-run the verification commands listed below after changes.

---

## 1. Executive Summary

HELIOS has a substantial monorepo foundation: discovery and feature extraction, candidate ranking, Jupiter quote/build adapters, simulation, a paper pipeline, exit decision logic, API/control-plane code, signer abstractions, agent/policy packages, persistence code, deployment files, and many safety gates.

However, **the repository is not yet a single, fully connected production trading system**. Several components exist in isolation or are only partially wired. The key distinction is:

- **Implemented:** source code or an interface exists.
- **Wired:** the runtime path actually calls the component and propagates its results/state.
- **Production-complete:** it has robust persistence, lifecycle/control integration, error handling, tests, deployment packaging, and operational verification.

The most consequential gaps identified are:

1. Control gateway validates commands but does not dispatch them to a pipeline supervisor/worker.
2. API handlers use in-memory ledger data in key paths instead of consistently using the PostgreSQL read-model/data-source layer.
3. Runtime state is split across in-memory structures, file state, and PostgreSQL rather than having one authoritative repository.
4. The web Dockerfile copies a placeholder HTML file instead of building the React application.
5. TypeScript checking/build verification is not genuinely implemented; the typecheck status script reports `NOT_RUN`.
6. Live broadcast is deliberately disabled; live trading is not operational.
7. Signer abstraction is imported into execution directly rather than being isolated behind a separate authenticated process/IPC boundary.
8. Exit decision logic does not submit real sell transactions.
9. Kill-switch and manual-exit inputs are hardcoded or not propagated into the actual pipeline path.
10. Paper PnL/marking logic appears to compare raw quote output quantities obtained with different input amounts; this needs normalization and unit-correct accounting.
11. Discovery is based on a small recent-transaction poll, not a demonstrated persistent low-latency event stream.
12. Redis and the Agent OS are not shown as authoritative, end-to-end runtime dependencies.
13. CI/local gate execution did not complete within the audit run; do not treat the partial output as a full green build.

**Current conclusion:** HELIOS is a useful engineering foundation with meaningful safety boundaries, but it should remain in PAPER/TEST mode until the integration work and verification below are completed.

---

## 2. Status Definitions

| Status | Meaning |
|---|---|
| **EXISTS** | Source code, interface, configuration, or documentation is present. |
| **WIRED** | The live runtime path invokes it and uses its output/state. |
| **PARTIAL** | Some paths are connected, but required behavior or integration is missing. |
| **SCAFFOLD** | The interface or initial implementation exists, but operational behavior is incomplete. |
| **NOT WIRED** | The component is not connected to the authoritative runtime path. |
| **BLOCKED BY DESIGN** | The code deliberately refuses the operation, such as live broadcast. |
| **NOT VERIFIED** | There is insufficient completed test/build evidence to claim it works end-to-end. |

---

## 3. Runtime Architecture: What Actually Exists

The repository contains several substantial subsystems:

- **Discovery:** Pump.fun program transaction parsing and mint discovery.
- **Feature extraction:** RPC/Helius-backed token and transaction features.
- **Scoring:** candidate ranking using security, smart-money, momentum, and holder-related features.
- **Execution preparation:** Jupiter quote and swap transaction construction, plus RPC simulation.
- **Paper trading:** paper ledger/fill and position lifecycle.
- **Exit logic:** stop-loss, break-even, take-profit, trailing, time-stop, kill-switch, and manual-exit decision types.
- **API/control plane:** status/readiness and portfolio/risk/funnel endpoints, plus a control gateway.
- **Persistence:** file-state and PostgreSQL-related code/migrations.
- **Signer abstraction:** signer package and isolated-signer interface.
- **Agent/policy system:** policy evaluation/proposal, shadow/replay/promotion and related modules.
- **Deployment/observability:** Docker/Compose, scripts, gates, and monitoring-related files.

Presence of these parts does **not** mean all of them form one end-to-end execution path.

---

## 4. End-to-End Runtime Flow and Wiring

### 4.1 Current paper path (high-level)

```text
Pump.fun program / RPC
        |
        v
Recent transaction polling and mint parsing
        |
        v
Feature adapters (RPC / Helius)
        |
        v
Feature analysis and candidate ranking
        |
        v
Jupiter quote
        |
        v
Swap transaction construction
        |
        v
RPC simulation
        |
        v
Risk authorization (currently simplified)
        |
        v
Paper fill / in-memory ledger
        |
        v
Position marking and exit decisions
        |
        v
File/Postgres-related persistence (not one authoritative path)
```

This is a **paper-oriented pipeline**, not a complete live trading loop.

### 4.2 Current control/UI path

```text
React dashboard source
        |
        |  (production image currently does not build this source)
        X
Web Docker image copies placeholder HTML
```

Separately:

```text
API handlers
   |
   +--> some endpoints read in-memory ledger directly
   |
   +--> PostgreSQL read-model/data-source code exists,
        but is not consistently the active handler path
```

Control commands currently follow:

```text
Client -> Control Gateway -> command validation -> response
                                      |
                                      X
                              no worker dispatch
```

### 4.3 Intended integrated architecture

```text
React Dashboard
      |
      v
Authenticated API
      |
      v
Control Gateway / Command Dispatcher
      |
      v
Pipeline Supervisor / Worker
      |
      +-------------------------------+
      |                               |
      v                               v
Discovery + Features              Control State
      |                               |
      v                               v
Strategy / Candidate Ranking      Central Risk Engine
      |                               |
      +---------------+---------------+
                      |
                      v
               Execution Interface
                      |
             +--------+---------+
             |                  |
             v                  v
         PAPER adapter       LIVE adapter
                                |
                                v
                       Simulation + Risk Gate
                                |
                                v
                       Authenticated Signer IPC
                                |
                                v
                         Broadcast / Confirm
                                |
                                v
                      Reconciliation / Position
                                |
                                v
                      Repository / PostgreSQL
                                |
                                v
                       API Read Models / UI
```

The intended architecture is a target design, not a statement that the current repository already implements it.

---

## 5. Component Inventory

| Subsystem | What exists | Current wiring assessment | Main gap |
|---|---|---|---|
| Monorepo structure | Packages, apps, services, workers, scripts | Partial | Verify dependency graph and runnable package scripts |
| Pump.fun discovery | Program transaction parsing and mint discovery | Partial | Small recent-signature poll; no demonstrated persistent event consumer |
| RPC pool | RPC abstraction, retries/fallback concepts | Partial/Wired in some paths | Verify all consumers use it and test failover/rate limits |
| Feature extraction | RPC/Helius adapters and token features | Wired in pipeline | Data completeness, latency, provider failures, and caching need validation |
| Candidate scoring | Security, smart-money, momentum, holder-related scoring | Wired in paper pipeline | Features are simplified; thresholds need replay/backtest validation |
| Jupiter quotes | Quote adapter | Wired in paper preparation | Validate response schema, stale quotes, rate limits, and route failures |
| Swap transaction build | Transaction builder | Wired in preparation path | Validate versioned transactions, token decimals, and exact-in/out semantics |
| RPC simulation | Simulation adapter | Wired in preparation path | Simulation is not proof of successful landing or profitable execution |
| Paper execution | Paper fills/ledger | Wired | Needs realistic fees, slippage, latency, partial-fill/failure modelling |
| Position state | In-memory positions and exit decisions | Partial | State is split; reconciliation and restart recovery are incomplete |
| PnL/marking | Quote-based mark logic | Suspect / not verified | Normalize prices and units; use same base amount and account for decimals/fees |
| Exit engine | Stop, take-profit, trail, time-stop, kill/manual decision types | Partial | Decisions do not trigger a complete sell-execution path |
| Sell execution | No complete live sell path demonstrated | Not wired | Build, simulate, authorize, sign, submit, confirm, reconcile |
| Risk engine | Risk modules and a simplified pipeline authorization | Partial | Centralize and enforce all limits at every execution entry point |
| Kill switch | Environment/API/exit concepts | Incomplete wiring | Propagate a single authoritative state; test new-entry block and emergency behavior |
| Manual exit | Decision input exists | Not wired end-to-end | API/gateway command must reach position manager and execution adapter |
| Control gateway | Authentication/command validation concepts | Partial | Dispatch commands to supervisor and return actual lifecycle result |
| Pipeline supervisor | No fully connected command lifecycle demonstrated | Not verified / gap | Implement start/pause/resume/stop, health, graceful shutdown |
| API | HTTP handlers and read endpoints | Partial | Use shared repository/read models; validate auth, schemas, and errors |
| PostgreSQL | SQL/migrations and data-source code | Partial | Wire active handlers and writes; reconcile schema with query expectations |
| Migration runner | Migration validation/checking | Scaffold | Implement versioned, transactional migration execution or documented deployment process |
| File state | JSON/file persistence | Exists | Do not treat as authoritative alongside Postgres; define recovery policy |
| Redis | Compose/service/config presence | Not meaningfully wired in core path | Either wire queue/cache/coordination or remove until needed |
| React dashboard | React/TypeScript source and API client | Source exists; deployment not wired | Real frontend build and static asset serving |
| TypeScript checks | Status script | Not run | Add actual `tsc --noEmit` and frontend build |
| Signer | Signer package/interface | Partial | Separate process and authenticated IPC; enforce narrow signing policy |
| Live broadcast | Explicit refusal/disabled adapter | Blocked by design | Keep disabled until safety, signer, sell path, and integration tests pass |
| Agent OS | Policy/agent/shadow/replay-related modules | Mostly library-level/partial | Define and test the exact runtime call path; prevent risk bypass |
| Monitoring | Metrics/health/gates and operational files | Partial | Verify live metrics, alerting, dashboards, and service health |
| Docker/Compose | Service deployment definitions | Partial | Build actual app artifacts; validate health checks, secrets, volumes, migrations |
| CI/local gates | Many custom gates | Partial | Some gates are source-pattern checks; full CI run did not complete in this audit |

---

## 6. Critical Wiring Gaps

### G1. Control gateway does not dispatch commands

**Observed behavior:** the gateway validates commands and returns an accepted-style response, but no actual worker/supervisor dispatch is demonstrated.

**Required work:**
- Define a typed command contract and command IDs.
- Implement a command dispatcher.
- Connect it to a single pipeline supervisor.
- Make START, PAUSE, RESUME, STOP, CONFIG_CHANGE, KILL_SWITCH, and MANUAL_EXIT affect actual runtime state.
- Return a result only after the supervisor accepts/rejects the command.
- Add idempotency, authorization, audit logs, and timeout handling.

**Acceptance test:** send each command through the same HTTP path used by the UI and assert the worker state/position state changes as expected.

### G2. State is split across in-memory ledger, file state, and PostgreSQL

**Observed behavior:** key API paths read arrays such as `ledger.cycles`, `ledger.positions`, and `ledger.outcomes`, while PostgreSQL data-source/read-model code also exists.

**Required work:**
- Define PostgreSQL as the authoritative durable state store.
- Add repository interfaces for cycles, positions, trades, fills, outcomes, risk state, and commands.
- Inject repositories into the pipeline and API.
- Keep in-memory state only as a cache or ephemeral working state.
- Define startup recovery and reconciliation after restart.
- Make writes transactional where multiple records represent one trade transition.

**Acceptance test:** execute a paper trade, restart all app services, and verify positions, outcomes, risk counters, and dashboard views remain consistent.

### G3. React dashboard is not built in the web image

**Observed behavior:** the web Dockerfile copies a placeholder `index.html` into `dist` rather than compiling the React source.

**Required work:**
- Add/verify package manifest, lockfile, Vite/build configuration, and TypeScript dependencies.
- Build the dashboard in a Node build stage.
- Copy compiled `dist` assets into the serving image.
- Configure SPA fallback and API base URL.
- Add a smoke test that verifies the built page contains the expected app bundle and renders the dashboard.

**Acceptance test:** build the production image, open the web service, and verify the actual React dashboard—not placeholder HTML—is served.

### G4. Typecheck/build verification is incomplete

**Observed behavior:** the typecheck status script reports `NOT_RUN`; the audit's local CI command timed out before a complete result.

**Required work:**
- Add actual TypeScript compiler execution.
- Add frontend production build.
- Run unit, integration, and contract tests.
- Set CI timeouts and report failures accurately.
- Do not let a status-reporting script substitute for compilation.

**Acceptance test:** a clean checkout can install from the lockfile, typecheck, build, and run tests in CI with a recorded exit code.

### G5. Live execution is intentionally closed

**Observed behavior:** live adapter/broadcast code explicitly refuses submission when the broadcast port is not wired or enabled.

**Required work before any live mode:**
- Complete the live adapter and transaction confirmation/reconciliation.
- Complete authenticated signer IPC.
- Add independent risk authorization immediately before signing and broadcasting.
- Add durable idempotency and duplicate-submit protection.
- Add sell execution and emergency behavior.
- Add mainnet integration tests with broadcast disabled, plus controlled testnet tests where applicable.
- Keep production live mode fail-closed until all acceptance gates pass.

**Acceptance test:** with live disabled, every attempted broadcast must fail closed; with a test adapter, the full order lifecycle must be testable without real funds.

### G6. Signer isolation is not a process boundary

**Observed behavior:** execution imports the signer module directly; a separate authenticated IPC path is not demonstrated.

**Required work:**
- Run signer as a separate process/container with minimal permissions.
- Define a narrow request schema: transaction bytes, expected wallet, allowed operation, expiry/nonce, and request ID.
- Validate transaction intent and destination/program constraints before signing.
- Never expose secret key material to API, dashboard, or general pipeline workers.
- Audit every signing request and reject replayed requests.

**Acceptance test:** execution can request a signature over IPC while no private key or seed is available to the execution process.

### G7. Exit decisions do not trigger sell execution

**Observed behavior:** the exit engine evaluates exit reasons and updates paper state, but no complete sell quote/build/simulate/sign/submit/confirm/reconcile path is demonstrated.

**Required work:**
- Separate exit decision from exit execution.
- Convert an exit decision into an idempotent sell intent.
- Quote the actual token quantity.
- Validate decimals, minimum output, slippage, route, and token account state.
- Apply risk authorization.
- Execute through the selected PAPER/LIVE adapter.
- Reconcile confirmed token/SOL balances and fees before closing the position.

**Acceptance test:** a test position hitting stop-loss creates one sell intent, executes once through a mock adapter, and reaches a reconciled terminal state.

### G8. Kill switch and manual exit are not propagated consistently

**Observed behavior:** the paper pipeline passes a constant `false` for kill-switch state and manual-exit request in the relevant exit evaluation path.

**Required work:**
- Create one authoritative runtime control state.
- Propagate it to entry authorization, position manager, and exit engine.
- Define kill-switch semantics explicitly: block new entries, cancel pending entries, and determine whether open positions should be flattened or merely managed.
- Ensure manual exit identifies a specific position and is authorized/audited.
- Fail closed if control state cannot be read.

**Acceptance test:** activating the kill switch blocks all new entries immediately; manual exit for a known position creates exactly one exit intent.

### G9. PnL/marking needs unit-correct calculations

**Observed concern:** entry and mark values appear to use Jupiter `outAmount` values obtained with different input amounts. Raw output token quantities are not directly comparable as prices unless normalized.

**Required work:**
- Store input amount, output amount, token decimals, quote timestamp, and quote direction.
- Compute entry cost and current liquidation value in a common unit (e.g., lamports/SOL or USD with a timestamped SOL/USD rate).
- Include trading fees, priority fees, and slippage assumptions.
- Distinguish unrealized PnL from realized PnL.
- Treat failed/stale quotes as unavailable—not as zero price or a valid loss.
- Use the same valuation method for stop-loss, take-profit, and portfolio totals.

**Acceptance test:** deterministic fixtures for a flat price, +10%, -10%, decimals edge cases, failed quote, and fee-adjusted exit produce expected values.

### G10. Discovery is not yet a demonstrated continuous low-latency stream

**Observed behavior:** discovery queries a small number of recent signatures and parses those transactions. A continuously running subscription/stream feeding a durable queue is not demonstrated.

**Required work:**
- Implement a persistent WebSocket/Geyser/provider event consumer or clearly define polling semantics.
- Track cursors/signatures and deduplicate events.
- Handle reconnects, backfill, rate limits, and provider failover.
- Push events into a bounded queue with backpressure.
- Record event-to-decision and decision-to-submit latency percentiles.
- Never claim sub-50ms performance without measured production-like results.

**Acceptance test:** a replay/fixture stream produces no duplicate mints after reconnect and recovers missed events from a cursor.

### G11. Agent/policy layer is not yet the authoritative strategy runtime

**Observed behavior:** many agent and policy modules exist, while the paper pipeline directly invokes feature analysis and candidate ranking. One end-to-end agent-to-risk-to-execution call chain is not demonstrated.

**Required work:**
- Specify exactly which agent output is consumed by the pipeline.
- Version and persist every policy used for a decision.
- Validate schema, confidence, freshness, and deterministic fallback behavior.
- Keep the risk engine authoritative; agents cannot sign, broadcast, or bypass risk.
- Run agents in shadow mode and compare decisions against the baseline before promotion.
- Add replay tests for policy changes.

**Acceptance test:** a recorded market event can be replayed to reproduce the feature set, policy version, decision, risk result, and resulting paper action.

### G12. Redis is present but not shown as a core runtime dependency

**Observed behavior:** Redis appears in deployment/configuration, but a Redis-backed token queue, event bus, or coordination path is not demonstrated in the core pipeline.

**Required work:**
- Either wire Redis for a specific documented purpose (queue/cache/coordination) with reconnect and persistence semantics, or remove it from the required deployment.
- Do not introduce Redis merely for architectural appearance.
- If Redis is used for commands or work queues, define delivery guarantees, deduplication, retries, and dead-letter behavior.

**Acceptance test:** the documented Redis use case has integration tests and remains correct through a Redis restart.

### G13. Database migration execution is not fully automated

**Observed behavior:** migration tooling checks/validates SQL presence, while actual application of migrations is left to an operator. Schema expectations between migrations and read-model queries need reconciliation.

**Required work:**
- Choose a migration runner and maintain a schema-version table.
- Apply migrations transactionally where supported.
- Fail deployment if migrations fail.
- Align table/column names and indexes with every repository query.
- Document backup and rollback strategy; avoid unsafe automatic destructive rollback.

**Acceptance test:** an empty test database can be migrated to the current schema, then all repository integration tests pass.

---

## 7. Security and Operational Requirements

Before any live trading is enabled, verify all of the following:

- [ ] API authentication is enabled in every non-local environment.
- [ ] Role-based permissions are enforced server-side, not just in the UI.
- [ ] Secrets are injected through a secret manager/environment, never committed.
- [ ] Signer has a separate process boundary and minimal permissions.
- [ ] Every command has an actor, request ID, timestamp, and audit record.
- [ ] Command requests are idempotent and replay-protected.
- [ ] Kill switch is independent of the dashboard and fails closed.
- [ ] New entries are blocked when risk state is unknown.
- [ ] Position and balance reconciliation runs after restart and transaction confirmation.
- [ ] RPC/provider failure cannot be interpreted as a safe trading signal.
- [ ] Stale quote, stale feature, and unknown token authority states block execution.
- [ ] Rate limits, timeouts, bounded queues, and retry budgets are enforced.
- [ ] Metrics include queue depth, RPC latency, quote latency, simulation latency, confirmation latency, dropped events, and error rates.
- [ ] Alerts cover process death, database unavailability, stale data, repeated transaction failures, and risk limit trips.
- [ ] Logs do not contain private keys, seed phrases, or sensitive credentials.

---

## 8. Recommended Implementation Order

Do not start by adding more indicators or AI strategy features. Close the integration gaps in dependency order.

### Phase W1 — Runtime contracts and state ownership
1. Define typed contracts for pipeline state, commands, position, trade, fill, quote, and risk decision.
2. Choose PostgreSQL as the durable source of truth.
3. Create repository interfaces and inject them into API and pipeline.
4. Define restart recovery and reconciliation.

**Exit gate:** a paper trade survives service restart and the API reports the same state.

### Phase W2 — Supervisor and control dispatch
1. Implement a single pipeline supervisor.
2. Connect gateway commands to it.
3. Implement lifecycle state machine: STOPPED, STARTING, RUNNING, PAUSED, STOPPING, FAILED.
4. Make commands idempotent and audited.
5. Wire kill switch and manual exit.

**Exit gate:** UI/API commands produce verified state transitions and tests cover unauthorized, duplicate, and unavailable-worker cases.

### Phase W3 — Correct accounting and exit lifecycle
1. Normalize price/amount units and token decimals.
2. Implement fee-aware realized/unrealized PnL.
3. Separate exit decision from exit intent and execution.
4. Add sell execution through a mock adapter first.
5. Reconcile positions from confirmed results.

**Exit gate:** deterministic accounting tests and complete mock sell lifecycle pass.

### Phase W4 — Real frontend build and API contracts
1. Add actual frontend build/typecheck.
2. Build React assets into the web image.
3. Validate API response schemas against frontend types.
4. Add frontend smoke tests and service health checks.

**Exit gate:** production image serves the real dashboard and all dashboard endpoints have contract tests.

### Phase W5 — Continuous discovery and performance measurement
1. Add streaming/persistent discovery or document polling constraints.
2. Add cursor persistence and deduplication.
3. Add bounded queue and backpressure.
4. Measure p50/p95/p99 latency under load.
5. Test provider failover and reconnect/backfill.

**Exit gate:** no duplicate processing in replay tests and performance claims are supported by measurements.

### Phase W6 — Agent/policy integration
1. Connect a selected agent output to a versioned strategy interface.
2. Keep the agent in shadow mode first.
3. Persist policy version and decision evidence.
4. Compare replay outcomes before promotion.

**Exit gate:** deterministic replay and policy rollback tests pass.

### Phase W7 — Signer isolation and live readiness
1. Implement authenticated signer IPC.
2. Add transaction-intent validation and replay protection.
3. Complete live buy and sell adapters.
4. Add confirmation and reconciliation.
5. Keep mainnet broadcast disabled until independent sign-off.

**Exit gate:** full lifecycle passes against mocks/testnet, with fail-closed tests proving live broadcast remains disabled unless explicitly approved.

### Phase W8 — CI, migration, and operations hardening
1. Implement real TypeScript checks and production builds.
2. Run all unit, integration, contract, and security tests.
3. Implement schema migration execution.
4. Validate Compose health checks, secrets, persistence volumes, and restart policies.
5. Add alerts and incident/recovery runbooks.

**Exit gate:** clean CI run, successful deployment rehearsal, and documented recovery test.

---

## 9. Verification Checklist

Run these in a clean checkout, adapting package-manager commands to the repository's actual manifests and scripts:

```bash
# 1. Inspect package scripts and workspace configuration
cat package.json
find apps services packages workers -maxdepth 3 \
  \( -name package.json -o -name tsconfig.json \) -print

# 2. Install reproducibly from the lockfile
pnpm install --frozen-lockfile

# 3. Run the repository's advertised checks
pnpm typecheck
pnpm test
pnpm build

# 4. Inspect and build production images
docker compose config
docker compose build

# 5. Check migration state using the project's actual migration runner
# Then run repository integration tests against a disposable PostgreSQL database.

# 6. Exercise paper lifecycle
# discover -> score -> quote -> simulate -> paper fill -> mark -> exit -> persist

# 7. Exercise control lifecycle
# START -> PAUSE -> RESUME -> STOP -> restart recovery

# 8. Exercise safety behavior
# kill switch -> block new entry
# manual exit -> one idempotent exit intent
# stale quote/provider outage -> fail closed
# live broadcast disabled -> submission refused
```

**Verification note:** During this audit, the local CI command began passing early checks but timed out before a complete result. The typecheck status script reported `NOT_RUN`. Therefore, a complete green build/test result has **not** been established.

---

## 10. Definition of Done

HELIOS should not be called end-to-end complete until all of the following are true:

- [ ] One authoritative durable state model is used by pipeline and API.
- [ ] UI commands reach the real supervisor and produce auditable state transitions.
- [ ] Dashboard production image serves compiled React assets.
- [ ] TypeScript, build, unit, integration, and contract checks run for real.
- [ ] Discovery is continuous or its polling limitations are explicitly accepted and measured.
- [ ] Candidate decisions include persisted feature and policy versions.
- [ ] Risk authorization is central and applied immediately before every execution action.
- [ ] Kill switch and manual exit are wired to the live runtime state.
- [ ] PnL, price, token quantity, decimals, and fees use consistent units.
- [ ] Exit decisions produce idempotent sell intents and reconcile confirmed results.
- [ ] Signer is isolated behind authenticated IPC with transaction-intent validation.
- [ ] PostgreSQL migrations and repositories match all read/write queries.
- [ ] Restart recovery restores positions and risk state without duplicate trades.
- [ ] Observability measures actual latency and failures rather than inferred performance.
- [ ] Live broadcast remains fail-closed until a separate, documented readiness approval.

---

## 11. Final Assessment

**HELIOS currently has a substantial foundation, but the major subsystems are not yet one unified operational system.**

The primary engineering task is integration—not adding more code volume. Prioritize:

1. authoritative persistence,
2. control command dispatch,
3. correct accounting,
4. centralized risk and kill-switch wiring,
5. complete exit lifecycle,
6. real frontend build,
7. signer isolation,
8. reproducible CI and integration tests.

Keep the system in **PAPER mode** until the above work is implemented and verified. Do not enable live broadcast based only on passing source-pattern gates or the presence of modules.
