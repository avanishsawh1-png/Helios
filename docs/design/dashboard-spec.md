# Helios Control-Plane Dashboard — Design Spec (Wave D1)

**Status:** Design only. No application code in this wave.  
**Review gate:** Human approval required before Wave D2 (implementation).  
**Boundary:** Hostinger control plane talks only to `apps/api`. Never holds wallet keys. Never sets Section 70 flags.

---

## 1. Information architecture (5-second rule)

Within **5 seconds** of landing on the shell (authenticated), an operator must answer:

1. **What mode is the system in?** — LIVE / PAPER / DRY_RUN / TESTNET / stopped  
2. **Is the gateway healthy?** — HEALTHY / DEGRADED / UNREACHABLE  
3. **Can we trade?** — kill-switch + risk posture, not a green marketing banner  
4. **Are we production-ready?** — `productionReady: false` until Section 69 is fully verified  
5. **Is live trading activated?** — Section 70 always show *display-only* denied until humans pass the six steps  

### Primary nav (left rail)

| Route | Purpose | 5-second content |
|-------|---------|------------------|
| `/` Dashboard | Mode, gateway, health, readiness, kill-switch | Status strip + 4 KPI cards |
| `/opportunities` | Scored tokens / signals | Table or honest EMPTY/UNAVAILABLE |
| `/positions` | Open / recent positions | Rows or EMPTY; null PnL as `—` |
| `/portfolio` | Equity / exposure / drawdown | Summary cards; `equityUnknown` callout |
| `/risk` | START / PAUSE / STOP / CONFIG | Controls + last risk decision feed |
| `/paper` | Paper fill history | PAPER-only; never looks like LIVE fills |
| `/readiness` | Section 69 checklist + Section 70 panel | Display-only gates |

### Page priority (above the fold)

1. **Mode badge** (color + label + optional pulse only for LIVE)  
2. **Kill-switch chip** (NONE / SOFT / HARD / EMERGENCY)  
3. **Gateway reachability** (`VPS_CONTROL_GATEWAY` boundary label)  
4. **Data freshness** (`asOf` or STALE age)

Secondary: tables, charts (out of scope until types exist), detail drawers.

---

## 2. Wireframes

### 2.1 Desktop (≥1280px)

```
┌──────────┬────────────────────────────────────────────────────────────┐
│ HELIOS   │  [MODE: PAPER]  [KS: NONE]  [GW: HEALTHY]  [asOf 12:04:01Z]│
│          │  user@… · VIEWER|TRADER|ADMIN                    [Logout] │
│ Dashboard├────────────────────────────────────────────────────────────┤
│ Opport.  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│ Positions│  │ Mode     │ │ Open pos │ │ Exposure │ │ Prod ready│     │
│ Portfolio│  │ PAPER    │ │ 3        │ │ —        │ │ false     │     │
│ Risk     │  │ asOf …   │ │ unpriced2│ │ null pct │ │ 3/25 items│     │
│ Paper    │  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
│ Readiness│                                                            │
│          │  Gateway status                                            │
│          │  ┌────────────────────────────────────────────────────┐   │
│          │  │ mode PAPER · liveActivationRecorded false          │   │
│          │  │ authorizationBoundary: VPS_CONTROL_GATEWAY         │   │
│          │  └────────────────────────────────────────────────────┘   │
│          │                                                            │
│          │  Health components (grid)                                  │
│          │  ┌────┐ ┌────┐ ┌────┐ ┌────┐                             │
│          │  │API │ │RPC │ │DB  │ │Redis│  UNAVAILABLE → amber, not  │
│          │  │ OK │ │ OK │ │ —  │ │ OK  │  empty green               │
│          │  └────┘ └────┘ └────┘ └────┘                             │
└──────────┴────────────────────────────────────────────────────────────┘
```

**Opportunities / Positions:** full-width table under the same topbar.  
**Risk:** left = control buttons (RBAC-disabled if VIEWER); right = recent decisions / acknowledgements.  
**Readiness:** two columns — Section 69 checklist (scroll) · Section 70 steps (locked, display-only).

### 2.2 Tablet (≥768px)

```
┌─────────────────────────────────────────┐
│ ≡ HELIOS    [PAPER] [KS:NONE]  [user]   │
├─────────────────────────────────────────┤
│ Mode PAPER │ Open 3 │ Ready false       │
├─────────────────────────────────────────┤
│ Gateway HEALTHY · boundary VPS_…        │
├─────────────────────────────────────────┤
│ Health: API OK · RPC OK · DB UNAVAIL    │
└─────────────────────────────────────────┘
```

- Left rail collapses to **hamburger** drawer.  
- KPI cards stack **2×2** then full width.  
- Tables: horizontal scroll; sticky first column (mint / position id).  
- Risk controls: full-width stack; confirm modals remain centered.

### 2.3 Narrow (<768px) — acceptable degradation

- Single column; mode badge sticky under topbar.  
- Tables → card list (mint, state, score/`—`).  
- Destructive controls require confirm + typed mode name for LIVE (future); PAPER uses standard confirm.

---

## 3. State matrix

Every panel must implement **all** of:

| State | UI treatment |
|-------|----------------|
| **loading** | Skeleton / subtle pulse; `aria-busy="true"`; no fake numbers |
| **OK** | Data + `asOf` timestamp |
| **EMPTY** | Distinct empty illustration/copy: “No open positions” + reason string |
| **UNAVAILABLE** | Amber/neutral panel: “Source not configured / unreachable” + reason; **not** empty table |
| **STALE** | Show data + **STALE** chip + age (`staleReason` / computed age) |
| **error** | Danger border; message from API `error.message`; retry control |

### Panel × state

| Panel | loading | OK | EMPTY | UNAVAILABLE | STALE | error |
|-------|---------|----|-------|-------------|-------|-------|
| Mode / gateway strip | skeleton badges | badges filled | — | “Gateway unreachable” | “Status older than Ns” | banner |
| Health grid | skeleton tiles | per-component OK | — | component UNAVAILABLE | component STALE | tile error |
| Production readiness | skeleton list | checklist | — | report UNAVAILABLE | — | error |
| Section 70 panel | skeleton steps | all steps shown, flags false | — | n/a | n/a | error |
| Opportunities table | skeleton rows | rows | “No scored opportunities” | reason panel | STALE chip on table | error |
| Positions table | skeleton rows | rows | “No open positions” | reason panel | STALE chip | error |
| Portfolio summary | skeleton cards | numbers or `—` | “No positions for summary” | reason panel | STALE + data | error |
| Risk controls | disabled | enabled per RBAC | — | gateway down disables START | — | show ack errors |
| Paper history | skeleton | rows | “No paper fills” | UNAVAILABLE | STALE | error |

**Rule:** `EMPTY` and `UNAVAILABLE` never share the same visual.  
EMPTY = we successfully asked and there is nothing.  
UNAVAILABLE = we could not obtain a trustworthy answer.

---

## 4. Design tokens (extend existing)

Existing (`apps/web/src/styles.css`):

```css
--bg, --panel, --border, --text, --muted, --accent, --ok, --warn, --danger
--font, --mono
```

**Add (do not replace):**

```css
:root {
  /* Mode */
  --mode-live: #ff4d4f;
  --mode-paper: #3d9cf0;
  --mode-dry: #8b9aab;
  --mode-testnet: #a78bfa;
  --mode-stopped: #5c6b7a;

  /* Availability */
  --state-ok: var(--ok);
  --state-empty: var(--muted);
  --state-unavailable: var(--warn);
  --state-stale: #e6a23c;
  --state-error: var(--danger);
  --state-loading: #2a3542;

  /* Spacing scale */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.5rem;
  --space-6: 2rem;

  /* Type */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-md: 1rem;
  --text-lg: 1.125rem;

  /* Focus */
  --focus-ring: 0 0 0 2px var(--bg), 0 0 0 4px var(--accent);
}
```

Semantic classes (suggested): `.mode-badge.live|paper|dry|testnet|stopped`, `.avail.ok|empty|unavailable|stale|error`.

---

## 5. Mode treatment (unmistakable)

| Mode | Badge color | Label | Extra |
|------|-------------|-------|-------|
| **LIVE** | `--mode-live` solid | `LIVE` | Optional slow pulse; never default theme accent alone |
| **PAPER** | `--mode-paper` | `PAPER` | Default for control-plane demos |
| **DRY_RUN** | `--mode-dry` | `DRY RUN` | |
| **TESTNET** | `--mode-testnet` | `TESTNET` | |
| **null / stopped** | `--mode-stopped` | `STOPPED` | |

- Mode badge appears on **every** authenticated page topbar.  
- LIVE pages that list fills must include a second `LIVE` chip on each LIVE row (vs PAPER rows).  
- Section 70 panel never uses green “activated” styling while flags are false.

---

## 6. Accessibility (WCAG 2.2 AA)

| Area | Target |
|------|--------|
| Contrast | Text/UI ≥ 4.5:1; large text ≥ 3:1; badges with text not color-only |
| Keyboard | All nav, buttons, tables (row actions), modals; visible `:focus-visible` using `--focus-ring` |
| Name/role/value | Mode, kill-switch, availability exposed via `aria-label` / text, not color alone |
| Status | `aria-live="polite"` region for gateway/mode changes; `assertive` for EMERGENCY_EXIT |
| Reduced motion | `prefers-reduced-motion: reduce` disables pulse/skeleton shimmer |
| Hit targets | ≥ 44×44px for primary controls on tablet |
| Forms | Labels bound; errors linked with `aria-describedby` |

---

## 7. Truthfulness rules

1. **`null` → `—` (em dash)** or explicit “unknown” — **never `0`**.  
2. **`equityUnknown: true`** → show callout; do not paint equity as `$0.00`.  
3. **`unpricedOpenPositionCount > 0`** → show count; unrealized column `—`.  
4. **`UNAVAILABLE` ≠ `EMPTY`** — different copy and color (`--state-unavailable` vs `--state-empty`).  
5. **`STALE`** always shows age or `staleReason`.  
6. **Section 70** is display-only; no control sets `manualAdminApproval` or other flags (Wave 11).  
7. **RBAC in UI** only hides/disables; API 403 remains authoritative.  
8. **No fabricated charts** — if series types are missing, omit the chart panel.

---

## 8. Gaps (types cannot support yet — do not invent)

| Desired UI | Blocker in current types / API |
|------------|--------------------------------|
| Live order book / depth chart | No order-book types; KNOWN_ISSUES Phases 24–28 |
| Intraday equity curve | `PortfolioSnapshot` exists in packages/types but control-plane API may not expose series |
| Per-component RPC latency sparkline | `HealthSnapshot` is point-in-time, not a series |
| Signal state timeline | `SignalResult` is a point result; no event stream DTO on apps/api |
| Realized vs unrealized breakdown by mint | Positions lack mark/unrealized column in DB (Wave 8B) |
| “Smart money” score on opportunity row | Not on `OpportunityListItem` |
| Push updates | No UI websocket client; gateway WS is VPS-side |
| LIVE activation toggle | **Forbidden** — Section 70 human-only |
| Wallet balance widget | Wallet verification still open (Wave 10) |

When a panel cannot be backed by a type, the design shows **UNAVAILABLE** or omits the panel — not a mock chart.

---

## 9. API mapping (read-only)

| UI panel | Source |
|----------|--------|
| Mode / kill-switch / gateway | `GET /v1/status` → `ControlPlaneStatus` / gateway status |
| Health | status payload / health aggregator fields if exposed |
| Positions | `GET /v1/positions` → `DataAvailability<PositionListItem[]>` |
| Opportunities | `GET /v1/opportunities` → `DataAvailability<OpportunityListItem[]>` |
| Portfolio | `GET /v1/portfolio` → `DataAvailability<PortfolioSummary>` |
| Readiness | monitoring `ProductionReadinessReport` when API exposes it |
| Commands | existing command routes; START LIVE rejected without Section 70 |

---

## 10. Out of scope for D2+ until approved

- Visual redesign that **replaces** existing CSS variables wholesale  
- Marketing polish that implies production readiness  
- Any control that mutates Section 70 flags  
- Wallet key entry fields  

---

## Review gate

**Stop.** Wave D1 produces this document only.

Human reviewers should confirm:

1. IA and 5-second questions are correct for operators  
2. State matrix is complete for planned panels  
3. Token extensions are acceptable  
4. Gaps list matches engineering reality  

**Approve explicitly before Wave D2** (implementation against this spec).
