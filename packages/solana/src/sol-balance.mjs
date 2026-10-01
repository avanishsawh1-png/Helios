import { rpcCallPooled } from "../../../packages/solana/src/rpc-pool.mjs";

const LAMPORTS_PER_SOL = 1_000_000_000;

export function lamportsToSol(lamports) {
  if (lamports == null || !Number.isFinite(Number(lamports))) return null;
  return Number(lamports) / LAMPORTS_PER_SOL;
}

export async function fetchSolBalance(pubkey, endpoints, rpcCall = rpcCallPooled) {
  if (!pubkey) {
    return { availability: "EMPTY", reason: "no_pubkey", pubkey: null, lamports: null, sol: null };
  }
  const rpcList = endpoints ?? [
    process.env.SOLANA_RPC_PRIMARY ?? "https://api.mainnet-beta.solana.com",
    process.env.SOLANA_RPC_BACKUP ?? "https://solana-rpc.publicnode.com",
  ].filter(Boolean);
  const res = await rpcCall(rpcList, "getBalance", [pubkey]);
  if (res.availability !== "OK" || res.value == null) {
    return { availability: "UNAVAILABLE", reason: "rpc_balance_unavailable", pubkey, lamports: null, sol: null };
  }
  const lamports = typeof res.value === "number" ? res.value : res.value.value;
  const sol = lamportsToSol(lamports);
  if (sol == null) {
    return { availability: "UNAVAILABLE", reason: "malformed_balance", pubkey, lamports: null, sol: null };
  }
  return { availability: "OK", reason: "rpc_getBalance", pubkey, lamports, sol };
}

export async function fetchPaperAndLiveBalances(opts = {}) {
  const paperPk = opts.paperPubkey ?? process.env.PAPER_WALLET_PUBKEY ?? null;
  const livePk = opts.livePubkey ?? process.env.LIVE_WALLET_PUBKEY ?? process.env.EXTERNAL_PUBLIC_KEY ?? null;
  const endpoints = opts.endpoints;
  const paper = await fetchSolBalance(paperPk, endpoints, opts.rpcCall);
  const live = await fetchSolBalance(livePk, endpoints, opts.rpcCall);
  return {
    tradingMode: "PAPER",
    liveTradingEnabled: false,
    paper,
    live: {
      ...live,
      note: "read-only on-chain balance — LIVE execution still gated",
    },
  };
}
