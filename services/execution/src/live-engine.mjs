import { evaluateLiveGate, loadSection70FromEnv } from "./live-trading-gate.mjs";
import { IsolatedSigner } from "../../../workers/signer/src/isolated-signer.mjs";
import { defaultLiveAdapter } from "./live-adapter.mjs";

export class LiveExecutionEngine {
  constructor(opts = {}) {
    this.adapter = opts.adapter ?? defaultLiveAdapter;
    this.signer = opts.signer ?? new IsolatedSigner();
    this.state = opts.state ?? loadSection70FromEnv();
  }

  async execute(intent = {}) {
    const gate = evaluateLiveGate(this.state);
    if (!gate.allowed) {
      return {
        submitted: false,
        signature: null,
        gate,
        signerRefused: false,
        stages: [],
        note: `live engine idle — ${gate.reason}`,
      };
    }

    const quote = await this.adapter.quote(intent.mint, intent.amountLamports);
    const built = await this.adapter.build(quote);
    const sim = await this.adapter.simulate(built.swapTx);
    const stages = [
      { stage: "quote", kind: quote.availability },
      { stage: "build", kind: built.availability },
      { stage: "simulate", kind: sim.availability },
    ];
    if (quote.availability !== "OK" || built.availability !== "OK" || sim.availability !== "OK") {
      return {
        submitted: false,
        signature: null,
        gate,
        signerRefused: false,
        stages,
        note: "live path blocked — quote/build/sim not OK",
      };
    }

    const signed = await this.signer.sign({ description: "live_swap", bytes: built.swapTx });
    if (signed.refused || !signed.signature) {
      return {
        submitted: false,
        signature: null,
        gate,
        signerRefused: true,
        stages,
        note: signed.reason ?? "isolated_signer_refused",
      };
    }

    const sent = await this.adapter.send(signed.signature);
    return {
      submitted: Boolean(sent?.submitted),
      signature: sent?.signature ?? null,
      gate,
      signerRefused: false,
      stages,
      note: sent?.reason ?? "broadcast_result",
    };
  }
}

export const defaultLiveEngine = new LiveExecutionEngine();
