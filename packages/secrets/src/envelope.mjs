/**
 * Local secret envelope. AES-256-GCM + scrypt.
 * Never commit the .enc file or the passphrase. Never put raw private keys in git.
 */
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

export function encryptSecrets(plainObject, passphrase) {
  if (!passphrase || passphrase.length < 12) {
    throw new Error("passphrase must be at least 12 characters");
  }
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = scryptSync(passphrase, salt, 32);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(plainObject), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    v: 1,
    alg: "aes-256-gcm+scrypt",
    salt: salt.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: ciphertext.toString("base64"),
  };
}

export function decryptSecrets(envelope, passphrase) {
  const key = scryptSync(passphrase, Buffer.from(envelope.salt, "base64"), 32);
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(envelope.iv, "base64"));
  decipher.setAuthTag(Buffer.from(envelope.tag, "base64"));
  const out = Buffer.concat([
    decipher.update(Buffer.from(envelope.data, "base64")),
    decipher.final(),
  ]);
  return JSON.parse(out.toString("utf8"));
}

export const PUBLIC_ONLY_PLACEHOLDERS = {
  PAPER_WALLET_PUBKEY: "9VwsQdfnsb7YmsY2egUs3bMVjCj8PxqRNjHkd27nchFN",
  EXTERNAL_PUBLIC_KEY: "CeTo1A7B4cE7mRbhG9QMCVSepFj6NfSeT3eLkGbnhtsS",
  TRADING_MODE: "PAPER",
};
