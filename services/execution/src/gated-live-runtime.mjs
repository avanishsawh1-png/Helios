import { evaluateLiveGate, loadSection70FromEnv } from "./live-trading-gate.mjs";

export class RefusingTransactionSigner {
  async sign() {
    return { signature: null, refused: true, reason: "RefusingTransactionSigner — no keys in Helios process" };
  }
}

export class GatedLiveRuntime {
  constructor(signer = new RefusingTransactionSigner(), state = loadSection70FromEnv(), submit = null) {
    this.signer = signer;
    this.state = state;
    this.submit = submit;
  }

  async submitLive(tx) {
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
    throw new Error("broadcast forbidden while Section 70 is closed");
  }
}

export const defaultLiveRuntime = new GatedLiveRuntime();
