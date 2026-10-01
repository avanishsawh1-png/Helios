# Wave 10 — Instrumentation + feature capture

Observation hooks only.

- Hook throw → `UNAVAILABLE` + original value returned (fail-open)
- Non-OK availability stores `value: null` (never coerced to 0)
- No RiskPort / ExecutionAuthorization / recordExit calls
- Numbers an agent later cites must come from these typed events
