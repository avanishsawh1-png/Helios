/**
 * Full live path, Section 70 closed by default.
 * Human approval is a VPS-side check — this module never writes it.
 */

import { evaluateLiveGate, loadSection70FromEnv, type Section70State } from "./live-trading-gate.js";
import { RefusingTransactionSigner, type TransactionSigner, type UnsignedTx } from "./refusing-signer.js";

export interface LiveSubmitPort {
  send(signedTxBase64: string): Promise<{ signature: string }>;
}

export class ForbiddenBroadcastError extends Error {
  constructor() {
    super("broadcast forbidden while Section 70 is closed");
    this.name = "ForbiddenBroadcastError";
  }
}

export class GatedLiveRuntime {
  constructor(
    private readonly signer: TransactionSigner = new RefusingTransactionSigner(),
    private readonly state: Section70State = loadSection70FromEnv(),
    private readonly submit: LiveSubmitPort | null = null,
  ) {}

  async submitLive(tx: UnsignedTx) {
    const gate = evaluateLiveGate(this.state);
    if (!gate.allowed) {
      return { submitted: false, signature: null, gate, note: "awaiting VPS human approval / preconditions" };
    }
    const signed = await this.signer.sign(tx);
    if (signed.refused || !signed.signature) {
      return { submitted: false, signature: null, gate, note: signed.reason };
    }
    if (!this.submit) {
      return { submitted: false, signature: null, gate, note: "no broadcast port wired" };
    }
    throw new ForbiddenBroadcastError();
  }
}

export const defaultLiveRuntime = new GatedLiveRuntime();
