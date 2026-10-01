# 05 — Deviations from `docs/design/dashboard-spec.md`

| Spec item | Implementation | Severity |
|-----------|----------------|----------|
| Routes include `/portfolio`, `/readiness` | Nav still Opportunities / Positions / Risk / Paper; readiness is a **Dashboard panel** only | Medium |
| Tablet hamburger drawer | Shell still fixed 220px grid; no collapse | Medium |
| Opportunities / Positions / Risk restyled via DataState | Partially still legacy page structure (D4 focused on Dashboard) | Medium |
| Health grid of 13 components | Not a dedicated grid panel; status health string only | Low |
| Polling interval from spec | Fixed 8s base in `usePolledAvailability` | Low |
| WebSocket live updates | Explicitly out of scope (D4) | Spec OK |
| Section 70 display-only | Enforced — no setters in UI | OK |
| null → em dash | MetricTile / formatUnknown | OK |
| Chart null gaps | ChartFrame | OK |
| Design tokens extended | styles.css | OK |

None of these deviations invent data or weaken Section 70.
