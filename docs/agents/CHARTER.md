# Wave 8 — Agent OS charter (read before later Part II waves)

- Read-only by construction
- Trading stays fail-closed; observation hooks fail-open
- No second trading path
- Advisory / staged only — `applyProposal` always throws
- `PROTECTED_TARGETS` is one list, extended not forked
- `AGENTS_ENABLED=false` by default
- No LLM inside ExitEngine
- No wallet, signer, Redis, RPC, shell, or control-gateway client for agents
- EvidenceRef required or REJECTED_UNVERIFIED
