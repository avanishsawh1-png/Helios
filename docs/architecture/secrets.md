# Secrets management (Wave 9)

## Rules

1. **Never commit** `.env`, `.env.vps`, `.env.control-plane` (see root `.gitignore`).
2. **Control-plane** (`apps/api`, `apps/web`) loads `.env.control-plane` only — no wallet keys (`forbidLiveSecrets`).
3. **Trading runtime** loads `.env.vps` — RPC keys, gateway key, optional wallet public key + signing service URL.
4. **`services/execution` images** must not receive wallet private keys at **build** time.

## Database password (migration 0008)

Migration `0008_app_role_permissions.sql` historically created `helios_app` with
literal password `change_me_in_production`. That is **dev-only**.

**Rotation (operator):**

```bash
# As superuser on the target database
psql "$DATABASE_URL" -c "ALTER ROLE helios_app PASSWORD '$(openssl rand -base64 32)';"
# Update DATABASE_URL in the secret store / .env.vps — never commit the new password.
```

See also `docs/runbooks/db-role-passwords.md` (Wave B4).

For **new** environments, prefer creating the role outside migrations:

```sql
CREATE ROLE helios_app LOGIN PASSWORD :'app_password';
```

and keep migrations grant-only when the role already exists.

## Helius / Jupiter API keys

| Secret | Where |
|--------|--------|
| Helius API key | Query string on `SOLANA_RPC_PRIMARY` / `SOLANA_WS_PRIMARY` in `.env.vps` |
| Jupiter API key | `JUPITER_API_KEY` in `.env.vps` |
| Gateway key | `CONTROL_GATEWAY_API_KEY` (same value in hostinger + vps) |

Rotate any key that was pasted into chat or tickets.
