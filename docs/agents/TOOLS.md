# Wave 12 — Read-only data plane + tool registry

Allowlisted tools only: `kb.list`, `kb.get`, `features.snapshot`, `probes.run`, `read.sql_select`.

- Every result carries `toolCallId`
- SQL must match SELECT allowlist; write verbs rejected
- Protected targets rejected before handler
- Missing handler → `UNAVAILABLE`, not invented rows
- Agents still have no wallet, signer, Redis, RPC, or shell
