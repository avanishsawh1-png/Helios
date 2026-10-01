import { fetchJupiterQuote, fetchJupiterSwapTx } from "../../quote/src/jupiter-fetch.mjs";
import { rpcCallPooled } from "../../../packages/solana/src/rpc-pool.mjs";

export class LiveChainAdapter {
  constructor(opts = {}) {
    this.rpcList = (opts.rpcList ?? [
      process.env.SOLANA_RPC_PRIMARY,
      process.env.SOLANA_RPC_BACKUP,
    ]).filter(Boolean);
    this.userPublicKey = opts.userPublicKey ?? process.env.LIVE_WALLET_PUBKEY ?? process.env.PAPER_WALLET_PUBKEY ?? null;
    this.broadcast = opts.broadcast ?? null;
    this.allowBroadcast = opts.allowBroadcast === true;
  }

  async quote(mint, amountLamports = 10_000_000) {
    if (!mint) return { availability: "EMPTY", reason: "no_mint", quote: null };
    return fetchJupiterQuote({ outputMint: mint, amountLamports });
  }

  async build(quoteRes) {
    if (quoteRes?.availability !== "OK") {
      return { availability: "UNAVAILABLE", reason: "no_quote", swapTx: null };
    }
    return fetchJupiterSwapTx({
      quote: quoteRes.quote,
      quoteRaw: quoteRes.raw,
      userPublicKey: this.userPublicKey,
    });
  }

  async simulate(swapTx) {
    if (!swapTx) return { availability: "UNAVAILABLE", reason: "no_tx", err: null };
    if (!this.rpcList.length) return { availability: "UNAVAILABLE", reason: "no_rpc", err: null };
    const sim = await rpcCallPooled(this.rpcList, "simulateTransaction", [
      swapTx,
      { encoding: "base64", sigVerify: false, replaceRecentBlockhash: true },
    ]);
    const err = sim.value?.value?.err ?? null;
    const ok = sim.availability === "OK" && !err;
    return { availability: ok ? "OK" : "UNAVAILABLE", reason: ok ? "simulated" : "simulate_failed", err };
  }

  async send(_signedBase64) {
    if (!this.allowBroadcast || !this.broadcast) {
      return { submitted: false, signature: null, reason: "broadcast_port_not_wired" };
    }
    throw new Error("LiveChainAdapter.send refused — Section 70 broadcast disabled");
  }
}

export const defaultLiveAdapter = new LiveChainAdapter();
