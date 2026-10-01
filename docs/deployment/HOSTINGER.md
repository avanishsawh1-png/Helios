# Hostinger VPS — PAPER compose

Do this on the VPS as user `helios`. Do not open LIVE.

```bash
cd /home/helios/helios
cp .env.control-plane.example .env.control-plane
cp .env.trading-runtime.example .env.trading-runtime
# set paid RPC + rotated DATABASE password; no private keys in control-plane file
chmod 600 .env.control-plane .env.trading-runtime

docker compose -f infrastructure/docker/docker-compose.prod.yml --env-file .env.control-plane up -d postgres redis
docker compose -f infrastructure/docker/docker-compose.prod.yml --profile migrate --env-file .env.control-plane run --rm migrate
docker compose -f infrastructure/docker/docker-compose.prod.yml --env-file .env.control-plane up -d
```

Checks:

- `control-gateway` and `signer` use `expose`, not `ports` (no host 3100/3200)
- `TRADING_MODE=PAPER` on api, worker, gateway, signer
- `HELIOS_SIGNER_ENABLE=0`

Do not: publish signer, set Section 70, put `WALLET_PRIVATE_KEY` in compose.
