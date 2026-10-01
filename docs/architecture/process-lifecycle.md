# Wave O1 — Process lifecycle

**Date:** 2026-09-25  
**Scope:** crash hygiene + graceful drain for `apps/api` and `workers/pipeline`.

## Behavior

- SIGTERM / SIGINT → stop accepting → drain in-flight → exit 0  
- Duplicate signals during drain are ignored  
- Drain timeout does not hang the process  
- uncaughtException / unhandledRejection increment a crash counter  
- `maxCrashes` is recorded here; supervisor crash-loop kill is Wave **O3**  
- PAPER assert remains on the pipeline adapter  

## Not claimed

24/7 readiness (O5). LIVE authorization. Unbounded RPC retry policy (O2).
