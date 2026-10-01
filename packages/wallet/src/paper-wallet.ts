/**
 * Isolated wallet view for the control plane / paper runtime.
 * Public key only. No private key material.
 */

export class WalletPrivateKeyError extends Error {
  constructor() {
    super("wallet module refuses private keys in the Helios monorepo");
    this.name = "WalletPrivateKeyError";
  }
}

export function loadPaperWallet(env = process.env) {
  if (env.WALLET_PRIVATE_KEY || env.PRIVATE_KEY || env.SECRET_KEY) {
    throw new WalletPrivateKeyError();
  }
  const publicKey = env.PAPER_WALLET_PUBKEY || env.WALLET_PUBLIC_KEY || null;
  return { publicKey, signing: "refusing", live: false };
}
