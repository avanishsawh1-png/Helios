#!/usr/bin/env node
/**
 * Encrypt operator secrets to .env.secrets.enc (gitignored).
 * Usage:
 *   HELIOS_SECRETS_PASSPHRASE='your-long-passphrase' \
 *   HELIUS_API_KEY='...' WALLET_PRIVATE_KEY_B58='...' \
 *   node scripts/encrypt-secrets.mjs
 *
 * Do not pipe private keys into the repo or Helios.zip.
 */
import fs from "node:fs";
import path from "node:path";
import { encryptSecrets, PUBLIC_ONLY_PLACEHOLDERS } from "../packages/secrets/src/envelope.mjs";

const passphrase = process.env.HELIOS_SECRETS_PASSPHRASE;
if (!passphrase) {
  console.error("Set HELIOS_SECRETS_PASSPHRASE (>=12 chars). Refusing to write plaintext secrets.");
  process.exit(1);
}

const payload = {
  PAPER_WALLET_PUBKEY: process.env.PAPER_WALLET_PUBKEY ?? PUBLIC_ONLY_PLACEHOLDERS.PAPER_WALLET_PUBKEY,
  EXTERNAL_PUBLIC_KEY: process.env.EXTERNAL_PUBLIC_KEY ?? PUBLIC_ONLY_PLACEHOLDERS.EXTERNAL_PUBLIC_KEY,
  HELIUS_API_KEY: process.env.HELIUS_API_KEY ?? null,
  SOLANA_RPC_PRIMARY: process.env.SOLANA_RPC_PRIMARY ?? null,
  SOLANA_WS_PRIMARY: process.env.SOLANA_WS_PRIMARY ?? null,
  WALLET_PRIVATE_KEY_B58: process.env.WALLET_PRIVATE_KEY_B58 ?? null,
  TRADING_MODE: "PAPER",
};

if (payload.WALLET_PRIVATE_KEY_B58) {
  console.error("NOTE: private key will be encrypted locally. It is not loaded by apps/api or apps/web.");
}

const envelope = encryptSecrets(payload, passphrase);
const out = process.env.HELIOS_SECRETS_PATH ?? path.resolve(".env.secrets.enc");
fs.writeFileSync(out, JSON.stringify(envelope, null, 2));
fs.chmodSync(out, 0o600);
console.log(`wrote ${out} encrypted=true live=false`);
