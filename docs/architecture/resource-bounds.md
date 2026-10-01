# Wave O4 — Resource bounds & WS reconnect hygiene

**Date:** 2026-09-25

- Cap concurrent WS sockets (`maxWsSockets`)
- Reconnect rate limit per window (no reconnect storms)
- Exponential backoff + jitter, capped
- Idle watchdog flags silent stalls (no invented backfill data)
- Shutdown releases sockets and refuses new reconnects

Not a 24/7 evidence wave (O5). Uptime ≠ LIVE.
