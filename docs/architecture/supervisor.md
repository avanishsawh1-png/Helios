# Wave O3 — Supervisor, crash-loop limits, single-instance

**Date:** 2026-09-25

## Rules

- One owner per lock key (`pipeline`, `api`). Second process fails closed with `INSTANCE_LOCK_HELD`.
- Supervisor restarts a child until `maxRestarts` inside `windowMs`.
- A run that lasts `minStableMs` resets the crash window.
- Exceeding the loop → halt. Do not keep forking.
- Process uptime ≠ LIVE trading authorization.

File-lock composition on the VPS (`O_EXCL` / flock) maps onto `LockStore`.
