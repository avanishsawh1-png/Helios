# Stage 3 §14 — Run instrumentation

- Every SCORE_CREATED / SIGNAL_CREATED carries `runId` + `policyVersion`
- Input snapshot persisted with the event
- All-null snapshot → EMPTY, score stored null (not 0)
- Null score → UNAVAILABLE
- No promotion, no LIVE, no LLM in ExitEngine
