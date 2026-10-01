# Secrets on Hostinger

Public keys may live in `.env.trading-runtime` (gitignored):

- `PAPER_WALLET_PUBKEY=9VwsQdfnsb7YmsY2egUs3bMVjCj8PxqRNjHkd27nchFN`
- `EXTERNAL_PUBLIC_KEY=CeTo1A7B4cE7mRbhG9QMCVSepFj6NfSeT3eLkGbnhtsS`

Private key + Helius API key:

```bash
export HELIOS_SECRETS_PASSPHRASE='choose-a-long-passphrase'
export HELIUS_API_KEY='your-rotated-key'
export WALLET_PRIVATE_KEY_B58='your-rotated-key'
export SOLANA_RPC_PRIMARY='https://mainnet.helius-rpc.com/?api-key=your-rotated-key'
export SOLANA_WS_PRIMARY='wss://mainnet.helius-rpc.com/?api-key=your-rotated-key'
node scripts/encrypt-secrets.mjs
chmod 600 .env.secrets.enc
```

`apps/api` and `apps/web` never decrypt this file. Isolated signer (S6) is the only future reader. Section 70 stays closed.
