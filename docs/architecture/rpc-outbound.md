# Wave O2 — Outbound Solana RPC 429 policy

**Date:** 2026-09-25  
**Scope:** `packages/solana/src/` only.

## Policy

- Treat HTTP 429, HTTP 503, JSON-RPC `-32005` as rate limits  
- Honor `Retry-After` when present  
- Else 1s → double → cap 30s, ±25% jitter, max 5 attempts  
- Process-wide token-bucket budget; retries must `take()` again  
- All endpoints exhausted → `AllEndpointsUnavailableError` (fail closed)  
- Never invent slot/block/account data  
- Do not retry JSON-RPC `-32600/-32601/-32602`

Not 24/7 (O5). Not LIVE. Wallet module untouched.
