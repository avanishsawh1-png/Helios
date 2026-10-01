/**
 * Isolated signer process. Default: refuse.
 * Control plane must never import this with a private key in-process.
 * HELIOS_SIGNER_ENABLE=1 is still not enough — Section 70 must also be open,
 * and this module still refuses unless IsolatedSigner is constructed with
 * an injected sign fn from the signer process only.
 */

export class IsolatedSigner {
  constructor(opts = {}) {
    this.pubkey = opts.pubkey ?? process.env.PAPER_WALLET_PUBKEY ?? null;
    this.enable = opts.enable === true || process.env.HELIOS_SIGNER_ENABLE === "1";
    this.signFn = opts.signFn ?? null;
  }

  publicView() {
    return { pubkey: this.pubkey, process: "signer", hasSignFn: Boolean(this.signFn), enable: this.enable };
  }

  async sign(tx) {
    if (!this.enable || !this.signFn) {
      return {
        signature: null,
        refused: true,
        reason: "isolated_signer_refused",
        pubkey: this.pubkey,
      };
    }
    return this.signFn(tx);
  }
}

export const defaultIsolatedSigner = new IsolatedSigner();
