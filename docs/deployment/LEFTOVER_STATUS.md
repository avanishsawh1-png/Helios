# Leftover work — what was completed vs still operator

## Completed in-repo (PAPER)

- 11-stage cycle runner `workers/pipeline/src/paper-system.mjs`
- API: `/health`, `/v1/status`, `/v1/funnel`, `/v1/positions`, `/v1/readiness`, `POST /v1/pipeline/cycle`
- Dashboard client can call those routes when `HELIOS_API_BASE` is set
- Live `getSlot` used for discover when public RPC answers
- Quote/build/simulate/fill stay **UNAVAILABLE** unless real adapters exist — no invented routes or fills
- Control gateway `/v1/command` re-validates START/PAUSE/STOP/CONFIG_CHANGE; refuses LIVE and Section 70 targets
- Analyze is EMPTY when no mint list (not a fake engine failure)
- Migrate script validates schema files
- Jupiter `priceUsd` missing → null (not 0)


## Still not completable from this session

- Hostinger VPS, TLS, real compose-up
- Full analysis / Jupiter / tx-build / simulate services from the missing monorepo packages
- Applying SQL to real Postgres
- 3-day PAPER soak, testnet, adversarial risk, execution dry-run, recovery drill
- Wallet/signer
- `manualAdminApproval` / LIVE
