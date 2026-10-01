# Wave 23 — Preset API RBAC

- `admin` / `operator` may call stage
- `viewer` / `agent` → 403
- Body actor must be `human`
- `correlationId` on every response
- Rejected stage → 400, not silent apply
