# HELIOS Codebase Inventory & Wiring Audit

## What Exists, What Is Connected, What Is Missing

**Audit target:** `Helios.zip`\
**Purpose:** Establish an implementation-oriented baseline of the
repository: existing components, actual runtime wiring, gaps, and the
recommended integration sequence.\
**Status:** Static/code-level audit based on the repository inspection
and findings recorded for this review. It is not a claim that live-chain
execution, production load, or every external integration has been
independently validated.

> **Overall assessment:** HELIOS has a substantial modular foundation
> and a fail-closed PAPER/LIVE boundary, but it is not yet a fully
> integrated, production-ready end-to-end trading system. Several
> subsystems exist as libraries, adapters, or read models without being
> connected to the authoritative runtime path.

------------------------------------------------------------------------

# 1. Executive Summary

## What exists

-   A monorepo-style project structure with separate applications,
    packages, workers, scripts, and documentation.
-   A paper trading pipeline that connects token discovery, feature
    extraction, candidate scoring, Jupiter quote/build operations,
    transaction simulation, paper fills, and position/exit evaluation.
-   Solana RPC abstractions and supporting provider integrations.
-   Pump.fun transaction parsing/discovery code.
-   Candidate feature and scoring modules.
-   Jupiter quote and swap-transaction construction adapters.
-   A live execution engine and chain adapter with live broadcasting
    deliberately disabled.
-   A signer module designed around fail-closed behavior.
-   Risk, exit-policy, control-plane, API, persistence, and agent/policy
    modules.
-   PostgreSQL schemas/read-model code, Redis deployment configuration,
    Docker/Compose artifacts, and numerous safety/invariant gates.
-   A React/TypeScript dashboard source tree and API client source.
-   Documentation that explicitly identifies production-readiness
    limitations.

## What is not yet complete

-   The control gateway validates commands but does not dispatch them to
    a running pipeline supervisor.
-   The API's actual handlers use an in-memory ledger rather than
    consistently using the PostgreSQL read-model architecture.
-   The pipeline's state, the in-memory ledger, file snapshots, and
    PostgreSQL are not yet one authoritative state system.
-   The web Docker build copies a placeholder HTML file instead of
    compiling and serving the React application.
-   TypeScript checking is reported as `NOT_RUN`; a real
    compile/typecheck step is not established.
-   Live broadcast is deliberately disabled.
-   Signer code is imported directly by execution code rather than
    reached through a separate authenticated IPC boundary.
-   Risk checks in the paper pipeline are narrower than the complete
    risk framework described by the repository.
-   The environment kill switch and manual-exit request are not
    propagated into the pipeline exit evaluation in the inspected path.
-   Paper PnL/marking uses quote output quantities in a way that
    requires correction and explicit unit normalization.
-   Exit decisioning exists, but a complete sell execution and
    confirmation/reconciliation path is not wired.
-   Discovery is based on limited recent-transaction polling, not a
    demonstrated persistent low-latency event stream.
-   Redis and the agent/policy subsystem are not shown as authoritative,
    end-to-end runtime dependencies.
-   Database migration automation is incomplete; the migration script
    checks/report files but leaves applying migrations to an operator.
-   CI/local checks did not complete within the audit run; this must not
    be reported as a fully green build.

## Production status

**Current classification: Integration / paper-runtime foundation. Not
production-ready for live trading.**

Do not enable live trading by changing a single flag. The missing
accounting, command, risk, signer-isolation, sell-execution,
persistence, and reconciliation wiring must be implemented and tested
first.

------------------------------------------------------------------------

# 2. Status Legend

  -----------------------------------------------------------------------
  Status                              Meaning
  ----------------------------------- -----------------------------------
  **Exists**                          Source code, configuration, schema,
                                      or documentation is present.

  **Wired**                           Connected to the actual runtime
                                      path examined in this audit.

  **Partial**                         Some runtime path exists, but it is
                                      incomplete, narrow, or not
                                      authoritative.

  **Disconnected**                    Code/configuration exists but is
                                      not connected to the operational
                                      path.

  **Blocked by design**               Deliberately refuses or disables
                                      the operation, usually as a safety
                                      measure.

  **Unverified**                      The source alone does not establish
                                      correct end-to-end behavior;
                                      integration tests are needed.
  -----------------------------------------------------------------------

A component can exist without being wired, and wired code can still be
incorrect or not production-ready.

------------------------------------------------------------------------

# 3. Repository Capability Inventory

## 3.1 Discovery and market data

  -------------------------------------------------------------------------------------------
  Capability        What exists                     Actual wiring /    Status
                                                    gap                
  ----------------- ------------------------------- ------------------ ----------------------
  Pump.fun          Program transaction parsing and Current path polls Partial
  discovery         mint-discovery code             a very small       
                                                    number of recent   
                                                    signatures;        
                                                    persistent         
                                                    streaming/event    
                                                    consumption is not 
                                                    demonstrated       

  Solana RPC access RPC abstraction/pool and        Used by discovery  Partial
                    request helpers                 and feature        
                                                    collection;        
                                                    production         
                                                    failover/latency   
                                                    behavior needs     
                                                    integration        
                                                    testing            

  Helius/provider   Provider adapter code           Some enrichment is Partial
  enrichment                                        called from        
                                                    feature            
                                                    collection; not    
                                                    all documented     
                                                    data fields/feeds  
                                                    are proven in the  
                                                    live path          

  Token feature     Mint/security/holder/activity   Connected to       Wired, limited
  extraction        feature code                    candidate          
                                                    analysis, but some 
                                                    features are       
                                                    proxies rather     
                                                    than comprehensive 
                                                    on-chain analysis  

  Smart-money       Fee-payer/unique-wallet-style   Implemented as a   Partial
  analysis          signals                         simplified         
                                                    heuristic, not a   
                                                    demonstrated       
                                                    wallet-history     
                                                    intelligence       
                                                    pipeline           

  Candidate scoring Weighted security, smart-money, Connected to       Wired, limited
                    momentum, and holder components candidate ranking; 
                                                    score quality and  
                                                    calibration are    
                                                    unverified         

  Continuous event  Redis is present in deployment  No authoritative   Disconnected/partial
  queue             configuration                   Redis-backed       
                                                    discovery queue is 
                                                    demonstrated in    
                                                    the inspected path 
  -------------------------------------------------------------------------------------------

### Required discovery target

``` text
Pump.fun / Solana event source
        ↓
Persistent stream consumer
        ↓
Deduplication + durable event queue
        ↓
Mint/program validation
        ↓
Feature enrichment
        ↓
Candidate scoring
        ↓
Risk pre-screen
        ↓
Quote / execution pipeline
```

The event consumer must support reconnects, replay/cursors,
deduplication, backpressure, rate limits, and observability.

------------------------------------------------------------------------

## 3.2 Strategy and candidate decisions

  -------------------------------------------------------------------------------------------------
  Capability           What exists         Actual wiring / gap               Status
  -------------------- ------------------- --------------------------------- ----------------------
  Feature analysis     Feature-analysis    Called by the paper pipeline      Wired
                       functions                                             

  Candidate ranking    Weighted scoring    Used to rank candidates           Wired
                       function                                              

  Policy/agent         Policy evaluation,  No single authoritative           Partial/disconnected
  packages             proposals,          agent-runtime-to-trade-decision   
                       shadow/replay,      chain is established              
                       promotion-related                                     
                       modules                                               

  Strategy-to-order    Individual          Needs one versioned, typed        Partial
  contract             signal/quote        decision object that flows        
                       functions           through risk and execution        

  Strategy             Supporting modules  End-to-end replay against         Partial
  replay/calibration   and gates           persisted market/trade data needs 
                                           verification                      
  -------------------------------------------------------------------------------------------------

### Required decision contract

Every candidate decision should carry, at minimum:

-   Mint and chain/program identity.
-   Event timestamp and data freshness.
-   Feature values, source timestamps, and missing-data indicators.
-   Strategy/policy version.
-   Score and rejection reasons.
-   Proposed side and size.
-   Quote input/output amounts and units.
-   Risk decision and risk-state version.
-   Correlation/idempotency key.

Unknown, stale, or missing security data must not be interpreted as
safe.

------------------------------------------------------------------------

## 3.3 Quotes, transaction construction, and simulation

  -----------------------------------------------------------------------------
  Capability          What exists         Actual wiring / gap Status
  ------------------- ------------------- ------------------- -----------------
  Jupiter quote       Quote adapter       Called in the paper Wired
                                          pipeline            

  Swap transaction    Swap transaction    Called before       Wired
  build               construction        simulation in the   
                                          inspected paper     
                                          path                

  RPC simulation      Simulation step     Used as a           Wired
                                          pre-execution gate  

  Transaction         Transaction/quote   Needs end-to-end    Unverified
  freshness           validity handling   tests for expiry,   
                                          blockhash           
                                          freshness, and      
                                          retries             

  Fee/slippage        Some quote/config   Must be included    Partial
  accounting          support             consistently in     
                                          expected and        
                                          realized PnL        

  Retry/idempotency   Helper logic exists Needs               Partial
                                          transaction-level   
                                          idempotency and     
                                          reconciliation      
                                          tests               
  -----------------------------------------------------------------------------

A successful quote, transaction build, or simulation is not proof that a
transaction was broadcast, confirmed, or filled.

------------------------------------------------------------------------

## 3.4 Paper execution and position lifecycle

  ------------------------------------------------------------------------------------
  Capability        What exists               Actual wiring /   Status
                                              gap               
  ----------------- ------------------------- ----------------- ----------------------
  Paper fill        Paper ledger/fill logic   Connected to the  Wired
                                              paper pipeline    

  Position tracking In-memory positions and   Runtime state is  Partial
                    state                     not consistently  
                                              backed by one     
                                              durable           
                                              repository        

  Exit decision     Stop loss, break-even,    Evaluates paper   Partial
  engine            take profit, trailing,    positions, but    
                    time stop,                some inputs are   
                    kill-switch/manual-exit   hardcoded rather  
                    inputs                    than sourced from 
                                              control state     

  Sell execution    No complete live          Exit decision is  Missing
                    sell/confirm/reconcile    not equivalent to 
                    chain established         an executed sell  

  PnL/marking       Quote-based marking logic Raw output        Incorrect/incomplete
                                              quantities can be 
                                              compared across   
                                              different quote   
                                              input amounts;    
                                              this is not a     
                                              valid general     
                                              price calculation 
                                              without           
                                              normalization     

  Restart recovery  File/Postgres persistence Recovery of a     Partial
                    pieces exist              single            
                                              authoritative     
                                              position/ledger   
                                              state is not      
                                              demonstrated      
  ------------------------------------------------------------------------------------

### Critical accounting defect to fix

The inspected path stores an entry quote output amount and later obtains
a mark quote output amount using a different quote input amount.
Comparing those raw output quantities as if they were prices can distort
PnL and trigger exit rules incorrectly.

Implement explicit units and normalized values:

-   `inputAmountRaw`
-   `inputTokenDecimals`
-   `outputAmountRaw`
-   `outputTokenDecimals`
-   `tokenQuantity`
-   `entryPriceInQuoteCurrency`
-   `markPriceInQuoteCurrency`
-   `quoteCurrency`
-   `estimatedFees`
-   `estimatedSlippage`
-   `realizedPnL`
-   `unrealizedPnL`
-   `netPnL`

Use integer/raw token amounts for transaction accounting and carefully
normalized decimal/price values for analytics. Add tests with different
quote input sizes, token decimals, fees, partial fills, and missing
quotes.

------------------------------------------------------------------------

# 4. Control Plane and API Wiring

## 4.1 Control gateway

The gateway contains command validation for operations such as:

-   `START`
-   `PAUSE`
-   `STOP`
-   `CONFIG_CHANGE`

However, the inspected handler validates the command and returns an
acceptance-style response (for example, `accepted_paper`) without
dispatching it to a pipeline supervisor.

### Current path

``` text
UI / client
    ↓
Control gateway
    ↓
Command validation
    ↓
Acceptance response
    X
Pipeline worker does not receive the command
```

### Required path

``` text
Authenticated request
    ↓
RBAC + schema validation
    ↓
Idempotency / audit record
    ↓
Command dispatcher
    ↓
Pipeline supervisor
    ↓
State-machine transition
    ↓
Acknowledgement with command ID and actual state
```

Do not report a command as completed merely because it passed
validation. Responses should distinguish `accepted`, `queued`,
`executing`, `completed`, and `rejected`.

## 4.2 API read models

The repository includes a PostgreSQL control-plane data source and
handlers for readiness, risk state, pipeline funnel, and portfolio
series.

The actual API server inspected reads directly from the in-memory ledger
for important values such as cycles, positions, and outcomes. This
bypasses the richer Postgres read-model path.

### Consequences

-   API values can disappear on process restart.
-   Dashboard state may differ from database state.
-   Different endpoints may have different definitions of a position or
    cycle.
-   The database layer can exist without powering the actual API.

### Required change

Make API handlers depend on repository/read-model interfaces. Use
PostgreSQL as the authoritative durable state where appropriate, with an
explicitly defined cache policy. Do not let HTTP handlers read internal
mutable arrays directly.

## 4.3 Kill switch and manual exit

The inspected paper pipeline passes `killSwitchActive: false` and
`manualExitRequested: false` into exit evaluation. This means the exit
engine's supported inputs are not connected to the actual control-plane
state in that path.

Required behavior:

-   A centrally stored kill-switch state must block new entries
    immediately.
-   The system must define whether and how the kill switch requests
    position flattening.
-   Manual exit must create an authenticated, auditable command.
-   The pipeline must consume and acknowledge those commands.
-   Kill-switch state must survive process restarts and be checked at
    every relevant execution boundary.
-   Live execution must remain disabled until the emergency behavior is
    tested in a controlled environment.

------------------------------------------------------------------------

# 5. Risk Engine Wiring

The inspected paper path uses a simple USD-size ceiling (default maximum
around `$250`) as its direct authorization check. That does not
establish that the broader risk modules are authoritative for every
order.

## Risk controls to centralize

-   Maximum risk per trade.
-   Maximum position size and notional.
-   Maximum portfolio exposure.
-   Daily loss limit.
-   Maximum consecutive losses.
-   Maximum trades per day.
-   Token/liquidity/holder eligibility.
-   Quote freshness and slippage ceiling.
-   Fee and priority-fee ceiling.
-   Duplicate order prevention.
-   Exposure to correlated tokens/creators.
-   Stale market-data rejection.
-   Global pause and kill switch.
-   Recovery and reconciliation state.

### Required invariant

``` text
Every entry or exit order
        ↓
One authoritative risk decision
        ↓
Allow / reject with reason
        ↓
Execution adapter
```

No API endpoint, agent, manual command, retry worker, or execution
adapter should be able to bypass the risk authority. Risk decisions
should be recorded with the policy version and input snapshot.

------------------------------------------------------------------------

# 6. Live Execution and Signer

## 6.1 Live broadcast

The live execution code exists, but broadcast is deliberately closed.
The inspected adapter returns a `broadcast_port_not_wired`-style result
when the broadcast port is absent/disabled, and the send path explicitly
refuses broadcasting.

  Step                     State
  ------------------------ -----------------------------------------------------------
  Quote                    Exists / used in the pipeline
  Build swap transaction   Exists / used in the pipeline
  Simulate                 Exists / used in the pipeline
  Risk authorization       Partial; needs one authoritative risk service
  Sign                     Signer refuses live signing in the current safety posture
  Broadcast                **Blocked by design**
  Confirmation             Not established as a complete live lifecycle
  Reconciliation           Not established as a complete live lifecycle

Do not treat the existence of a `LiveExecutionEngine` as proof of live
trading capability.

## 6.2 Signer isolation

The execution path imports the signer module directly. That is not the
same as a separately isolated signer process communicating through
authenticated IPC.

### Required target

``` text
Execution service
    ↓ authenticated, schema-validated IPC
Signer worker process
    ↓ key access restricted to signer
Signed transaction returned
    ↓
Execution service validates result
    ↓
Broadcast adapter (still disabled until approved)
```

The signer must validate transaction intent, program/address allowlists
where applicable, amount limits, freshness, and request identity.
Secrets must never enter dashboard/API logs or general worker
environments.

## 6.3 Live order lifecycle still required

Before live activation, implement and test:

1.  Order intent and idempotency key.
2.  Risk approval tied to the exact intent.
3.  Fresh quote and transaction build.
4.  Simulation and transaction validation.
5.  Isolated signing.
6.  Broadcast with a unique transaction signature.
7.  Confirmation/finality tracking.
8.  Timeout and ambiguous-submission handling.
9.  Wallet/token-balance reconciliation.
10. Durable position and fee updates.
11. Recovery after worker/API/RPC restart.

Never blindly resubmit an order after an ambiguous network timeout.
First reconcile whether the original transaction landed.

------------------------------------------------------------------------

# 7. Persistence and Database

## What exists

-   PostgreSQL schema/migration files.
-   A PostgreSQL control-plane data-source implementation.
-   A file-backed state snapshot path.
-   An in-memory runtime ledger.
-   Migration-related scripts.

## Gaps

-   These do not currently form one authoritative persistence
    architecture.
-   The main API path reads in-memory state rather than consistently
    using Postgres read models.
-   The migration script does not itself apply migrations; it
    checks/reports migration artifacts and leaves application to an
    operator.
-   The inspected migration/table names and read-model expectations need
    to be reconciled.
-   Durable order intent, transaction attempts, confirmations, fills,
    fees, and reconciliation state need to be represented consistently.
-   Restart recovery and concurrent updates require integration tests.

## Recommended data model areas

-   `pipeline_cycles`
-   `discovery_events`
-   `candidate_features`
-   `candidate_decisions`
-   `risk_decisions`
-   `order_intents`
-   `execution_attempts`
-   `transaction_confirmations`
-   `positions`
-   `fills`
-   `fees`
-   `trade_outcomes`
-   `control_commands`
-   `control_state`
-   `policy_versions`
-   `audit_events`

Use migrations that are versioned, repeatable where appropriate, and
applied by a controlled deployment step. Add indexes and uniqueness
constraints for transaction signatures, idempotency keys, and other
identity fields.

------------------------------------------------------------------------

# 8. Redis and Background Workers

Redis is present in deployment configuration, but the inspected pipeline
does not establish Redis as an authoritative queue/event bus.

Do not count a Redis container as completed queue integration.

If Redis is retained, specify and implement its actual role, for
example:

-   Discovery work queue.
-   Short-lived feature cache.
-   Distributed rate limiter.
-   Worker coordination.
-   Event notification.

For durable order and trade state, use a persistence design with
recovery guarantees rather than relying on ephemeral queue state alone.

Workers need health checks, graceful shutdown, retry limits, dead-letter
handling where appropriate, backpressure, and observable queue
depth/age.

------------------------------------------------------------------------

# 9. Frontend and Deployment

## What exists

-   React/TypeScript dashboard source.
-   API client source.
-   Docker and Compose configuration.
-   Nginx/static web deployment artifacts.

## Confirmed wiring gap

The inspected web Dockerfile creates `dist` and copies the source
`index.html`. It does not compile the React/TypeScript application. The
copied HTML is a placeholder, not the actual dashboard.

### Required build

``` text
apps/web/src
      ↓
package manager install
      ↓
TypeScript check
      ↓
Vite/React production build
      ↓
apps/web/dist/index.html + assets
      ↓
Nginx/static server
      ↓
Browser dashboard
```

Add a deployment test that builds the image and verifies that the
expected JS/CSS bundles exist and that the served page loads the real
application.

## Frontend controls must reflect actual backend state

For every control, define:

-   API endpoint and request schema.
-   Authentication/RBAC permission.
-   Command ID and idempotency behavior.
-   Pending/success/failure state.
-   Polling or event update mechanism.
-   Actual runtime state returned by the backend.
-   Audit event and error display.

The frontend must not optimistically label a command "running" just
because the HTTP request was accepted.

------------------------------------------------------------------------

# 10. TypeScript, Build, CI, and Test Coverage

The inspected typecheck-status script reports `NOT_RUN`, rather than
executing TypeScript. The build status is reported as partial.

The local CI command was started during the audit, but it timed out
before a complete result was obtained. Initial checks printed passing
results, including monorepo pack checks, blocker wiring unit checks, and
live-engine gate-closed unit checks. **This is not a complete green CI
result.**

## Required checks

-   Install dependencies reproducibly from the lockfile.
-   Run `tsc --noEmit` for TypeScript projects.
-   Build every deployable package and application.
-   Run unit tests.
-   Run API/gateway contract tests.
-   Run Postgres integration tests with a real test database.
-   Run Redis integration tests if Redis remains a runtime dependency.
-   Run pipeline tests with mocked RPC/Jupiter providers.
-   Run transaction accounting/PnL tests.
-   Run control-command end-to-end tests.
-   Run Docker image build and smoke tests.
-   Run restart/recovery tests.
-   Run live-path refusal tests to confirm that live broadcast remains
    closed.
-   Add timeout limits and diagnostics to CI so a timeout is a visible
    failure, not an ambiguous result.

Source-pattern gates are useful as guardrails, but they do not replace
behavior-level integration tests.

------------------------------------------------------------------------

# 11. Monitoring and Observability

Monitoring-related code/configuration exists, but production operational
readiness requires proving that metrics and alerts correspond to the
real runtime.

At minimum, expose:

## Discovery

-   Events received, parsed, rejected, and deduplicated.
-   Discovery-to-feature latency.
-   Queue depth and oldest-event age.
-   Provider/RPC error rate and rate-limit events.

## Strategy and risk

-   Candidates evaluated and rejected by reason.
-   Score distribution and policy version.
-   Risk approvals/rejections by reason.
-   Stale-data blocks.
-   Kill-switch state and command age.

## Execution

-   Quote/build/simulation latency.
-   Quote-to-submit age.
-   Submission attempts and ambiguous outcomes.
-   Confirmation latency and failure rate.
-   Slippage, fees, and realized execution price.
-   Reconciliation discrepancies.

## Runtime

-   Worker heartbeat and restart count.
-   API latency and error rate.
-   Database connection/transaction errors.
-   Queue lag.
-   Disk/memory/CPU.
-   Last successful durable state update.

Metrics should come from actual execution and persistence events, not
inferred UI state.

------------------------------------------------------------------------

# 12. Agent OS Integration

The repository includes a substantial agent/policy layer, including
evaluation/proposal, shadow/replay, promotion, and related support
modules.

The inspected trading pipeline directly calls feature loading, analysis,
and candidate ranking. A complete authoritative path from agent runtime
to trade decision is not established.

## Recommended integration boundary

``` text
Market/discovery event
        ↓
Feature snapshot
        ↓
Agent/policy evaluation
        ↓
Versioned strategy decision
        ↓
Deterministic risk authority
        ↓
Execution intent
        ↓
Execution state machine
```

Agents must not directly sign or broadcast transactions, mutate
positions outside the state machine, or bypass risk controls. Policy
changes should be versioned, auditable, and shadow-tested before
promotion.

------------------------------------------------------------------------

# 13. Key Wiring Findings

  -----------------------------------------------------------------------------------
  ID                Finding                   Impact                Priority
  ----------------- ------------------------- --------------------- -----------------
  W-01              Gateway validates         UI commands do not    P0
                    commands but does not     reliably control      
                    dispatch them to a        runtime               
                    pipeline supervisor                             

  W-02              Kill-switch/manual-exit   Emergency/exit        P0
                    inputs are hardcoded      controls are not      
                    false in the inspected    connected             
                    paper path                                      

  W-03              Paper PnL compares quote  Incorrect exit        P0
                    output quantities from    triggers/PnL          
                    different input sizes                           
                    without adequate                                
                    normalization                                   

  W-04              API uses in-memory ledger State loss and        P0
                    rather than authoritative inconsistent          
                    Postgres read models      dashboard             

  W-05              React dashboard is not    Deployed UI is a      P0
                    compiled by the web       placeholder           
                    Dockerfile                                      

  W-06              Live broadcast and        Live trading          P0 for live
                    signing are disabled      unavailable by design readiness; retain
                                                                    block

  W-07              Signer is imported        Security boundary     P1
                    directly instead of       incomplete            
                    isolated behind process                         
                    IPC                                             

  W-08              Exit decisions do not     Positions cannot be   P0 for live
                    lead to a complete        reliably closed live  readiness
                    sell/confirm/reconcile                          
                    lifecycle                                       

  W-09              Risk checks in the        Controls can be       P0
                    pipeline are narrower     inconsistent          
                    than the full risk                              
                    framework                                       

  W-10              Discovery polls a very    Missed events and     P1
                    small recent-signature    latency limits        
                    window                                          

  W-11              Redis deployment exists   Infrastructure and    P1
                    without demonstrated      runtime architecture  
                    authoritative queue use   diverge               

  W-12              Migration script does not Deployment/recovery   P1
                    apply migrations          risk                  
                    automatically                                   

  W-13              TypeScript typecheck is   Compile defects can   P1
                    not run                   pass gates            

  W-14              Agent/policy subsystem is Documented AI         P1
                    not fully integrated into behavior exceeds      
                    trade-decision path       runtime wiring        

  W-15              CI/local check timed out  Overall validation    P1
                    before full completion    status unknown        

  W-16              Pattern/source gates are  False confidence in   P1
                    not equivalent to         integration           
                    end-to-end tests                                
  -----------------------------------------------------------------------------------

**P0** means resolve before any live-trading enablement.\
**P1** means resolve before production acceptance or as a prerequisite
to the relevant production capability.

------------------------------------------------------------------------

# 14. Recommended Build Plan

## Phase 0 --- Freeze and baseline

-   Keep live broadcast and live signing disabled.
-   Record the exact repository commit/hash and environment.
-   Run all existing checks with explicit timeouts.
-   Produce a package-by-package build/test report.
-   Separate source-presence gates from behavioral tests.
-   Document every service entrypoint and environment variable.

**Exit criteria:** Reproducible baseline; no claim of a passing build
unless all required commands finish successfully.

## Phase 1 --- Correct accounting and state contracts

-   Define raw amount/decimal/price/PnL types.
-   Correct entry/mark normalization.
-   Add deterministic unit tests for PnL, fees, partial exits, and
    missing data.
-   Define typed position/order/decision state machines.
-   Define idempotency and state-transition invariants.

**Exit criteria:** Accounting tests pass across differing quote sizes
and token decimals.

## Phase 2 --- One authoritative persistence path

-   Define repository interfaces.
-   Make pipeline writes durable.
-   Make API read models use the repository.
-   Reconcile schemas and migration expectations.
-   Add migration application to controlled deployment.
-   Add restart and reconciliation tests.

**Exit criteria:** Restarting API/workers does not silently erase or
contradict durable positions/orders.

## Phase 3 --- Real control-plane dispatch

-   Add command dispatcher and pipeline supervisor.
-   Implement START/PAUSE/STOP with explicit lifecycle states.
-   Wire kill switch and manual exit.
-   Add RBAC, audit records, idempotency, and command status.
-   Test command races and worker restarts.

**Exit criteria:** Each command produces an observable, verified state
transition---not merely an acceptance response.

## Phase 4 --- Central risk authority

-   Route all order intents through one risk service.
-   Implement configured position/exposure/daily-loss/trade-count
    controls.
-   Enforce data freshness, slippage, fee, and token eligibility.
-   Persist decisions and rejection reasons.
-   Prove every execution route fails closed when risk is unavailable.

**Exit criteria:** Tests demonstrate that no order path bypasses risk
authorization.

## Phase 5 --- Paper execution and sell lifecycle

-   Normalize paper fills and PnL.
-   Implement partial-exit accounting.
-   Connect exit decisions to paper sell orders.
-   Persist fills, fees, positions, and outcomes.
-   Test stop loss, take profit, trailing stop, time stop, kill switch,
    and manual exit.

**Exit criteria:** Complete deterministic paper lifecycle from entry
intent through exit and reconciliation.

## Phase 6 --- Frontend build and command integration

-   Add reproducible React/Vite build.
-   Run TypeScript checks.
-   Make Docker serve actual built assets.
-   Connect UI controls to real API/gateway commands.
-   Display server-confirmed command/runtime states.
-   Add browser/API smoke tests.

**Exit criteria:** Deployed dashboard is the real React app and reflects
backend state.

## Phase 7 --- Discovery/queue reliability

-   Implement persistent streaming or a documented polling design with
    cursors.
-   Add event deduplication and durable queue semantics.
-   Add reconnect/replay/backpressure handling.
-   Enrich candidates with bounded concurrency and rate limiting.
-   Measure event-to-decision latency.

**Exit criteria:** No silent loss/duplication under reconnect and worker
restart tests; latency is measured, not assumed.

## Phase 8 --- Agent/policy integration

-   Define versioned policy-decision contracts.
-   Connect agent evaluation to the decision pipeline in shadow mode.
-   Compare agent decisions with deterministic baselines.
-   Add promotion/rollback controls and audit history.
-   Keep risk authority independent of agent output.

**Exit criteria:** Agent decisions are observable, replayable, and
unable to bypass risk.

## Phase 9 --- Signer isolation and live readiness (separate approval)

-   Implement authenticated signer IPC.
-   Add transaction-intent validation and key-access restrictions.
-   Implement live submission, confirmation, and reconciliation behind a
    separately controlled feature gate.
-   Test ambiguous submissions and duplicate prevention on testnet.
-   Validate emergency stop and recovery procedures.
-   Require explicit operator approval before any mainnet enablement.

**Exit criteria:** Signed/broadcast lifecycle is demonstrated in a
controlled environment, with durable reconciliation and tested safety
controls. A green unit-test suite alone is insufficient.

------------------------------------------------------------------------

# 15. Acceptance Checklist

Use this as the integration definition of done.

## Build and packaging

-   [ ] Every package has a reproducible install/build/test command.
-   [ ] TypeScript checks actually execute.
-   [ ] CI completes without timeout.
-   [ ] Docker builds the real frontend and all required services.
-   [ ] Runtime images do not contain development secrets.

## Data and accounting

-   [ ] Token amounts and decimals are normalized correctly.
-   [ ] Entry and mark prices use consistent quote units.
-   [ ] Fees/slippage are reflected in PnL.
-   [ ] Partial fills/exits are accounted for.
-   [ ] Orders, fills, positions, and outcomes persist durably.
-   [ ] Restart recovery and reconciliation pass tests.

## Control and risk

-   [ ] START/PAUSE/STOP dispatch to the actual supervisor.
-   [ ] Commands have authorization, idempotency, audit, and status.
-   [ ] Kill switch is centrally wired and tested.
-   [ ] Manual exit is wired end-to-end.
-   [ ] All execution routes use one risk authority.
-   [ ] Risk-service failure blocks new orders.

## Market data and strategy

-   [ ] Discovery is continuous or uses a documented, recoverable
    polling design.
-   [ ] Events are deduplicated and recoverable after reconnect.
-   [ ] Feature freshness and unknown values are explicit.
-   [ ] Candidate scores and policy versions are recorded.
-   [ ] Agent/policy behavior is replayable and cannot bypass risk.

## Execution safety

-   [ ] Paper entry and exit lifecycle is complete.
-   [ ] Live broadcast remains disabled until separately approved.
-   [ ] Signer is isolated behind a defined security boundary.
-   [ ] Duplicate/ambiguous submissions are reconciled before retry.
-   [ ] Confirmation/finality and balance reconciliation are durable.
-   [ ] Emergency stop behavior has been exercised in tests.

## Dashboard and operations

-   [ ] The real React app is served from the production image.
-   [ ] UI reflects server-confirmed state.
-   [ ] API read models use authoritative persisted data.
-   [ ] Metrics and alerts reflect real runtime events.
-   [ ] Runbooks cover restart, database failure, provider failure, and
    recovery.

------------------------------------------------------------------------

# 16. Final Conclusion

HELIOS is not an empty scaffold. It contains meaningful discovery,
feature analysis, scoring, quote/build/simulation, paper execution,
exit-policy, API, persistence, control-plane, agent, and deployment
code.

However, **component presence must not be confused with end-to-end
integration**. The main gaps are the command-dispatch path,
authoritative state/persistence, correct PnL accounting, central risk
and kill-switch propagation, sell execution/reconciliation, signer
process isolation, actual frontend compilation, continuous discovery,
and completed build/test verification.

The next engineering milestone should be a **Wiring and Integration
Phase**, not more strategy features and not live-broadcast activation.
Keep live execution fail-closed until the P0 issues are fixed and the
acceptance checklist is supported by completed integration tests.
