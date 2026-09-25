/**
 * Live execution engine — structurally inert while Section 70 is closed.
 * Wiring exists so a future human-open gate has a single call path.
 * This file does not set flags, load keys, or send transactions.
 */

import {
  evaluateLiveGate,
  loadSection70FromEnv,
  type LiveGateResult,
  type Section70State,
} from "./live-trading-gate.js";
import { RefusingTransactionSigner, type TransactionSigner, type UnsignedTx } from "./refusing-signer.js";

export interface LiveOrderIntent {
  mint: string;
  sizeUsd: number | null;
  tx: UnsignedTx;
}

export interface LiveEngineResult {
  submitted: boolean;
  signature: string | null;
  gate: LiveGateResult;
  signerRefused: boolean;
  note: string;
}

export class LiveExecutionEngine {
  constructor(
    private readonly signer: TransactionSigner = new RefusingTransactionSigner(),
    private readonly state: Section70State = loadSection70FromEnv(),
  ) {}

  async execute(intent: LiveOrderIntent): Promise<LiveEngineResult> {
    const gate = evaluateLiveGate(this.state);
    if (!gate.allowed) {
      return {
        submitted: false,
        signature: null,
        gate,
        signerRefused: false,
        note: `live engine idle — ${gate.reason} missing=${gate.missing.join(",")}`,
      };
    }
    // Even if a future human opens the gate, default signer still refuses.
    const signed = await this.signer.sign(intent.tx);
    if (signed.refused || !signed.signature) {
      return {
        submitted: false,
        signature: null,
        gate,
        signerRefused: true,
        note: signed.reason,
      };
    }
    return {
      submitted: false,
      signature: null,
      gate,
      signerRefused: false,
      note: "broadcast not implemented in this handoff — fail closed",
    };
  }
}

export function createClosedLiveEngine(): LiveExecutionEngine {
  return new LiveExecutionEngine();
}
