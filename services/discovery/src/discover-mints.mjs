import { PUMPFUN_PROGRAM_ID, isPubkey, parsePumpFunCreatesFromTx } from "./sources/pumpfun-parse.mjs";

export async function rpcJson(rpc, method, params) {
  try {
    const res = await fetch(rpc, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    if (!res.ok) return { availability: "UNAVAILABLE", value: null };
    const json = await res.json();
    if (json.error) return { availability: "UNAVAILABLE", value: null };
    return { availability: "OK", value: json.result };
  } catch {
    return { availability: "UNAVAILABLE", value: null };
  }
}

function keysFromMessage(message, meta) {
  const raw = message?.accountKeys ?? [];
  const staticKeys = raw.map((k) => (typeof k === "string" ? k : k?.pubkey)).filter(Boolean);
  const loaded = [
    ...(meta?.loadedAddresses?.writable ?? []),
    ...(meta?.loadedAddresses?.readonly ?? []),
  ].map((k) => (typeof k === "string" ? k : k?.pubkey)).filter(Boolean);
  return [...staticKeys, ...loaded];
}

function instructionsFromTx(tx) {
  const message = tx?.transaction?.message ?? tx?.message;
  if (!message) return [];
  const keys = keysFromMessage(message, tx?.meta);
  const collected = [];
  const pushIx = (ix) => {
    const programId =
      ix.programId ?? (typeof ix.programIdIndex === "number" ? keys[ix.programIdIndex] : null);
    const accounts = Array.isArray(ix.accounts)
      ? ix.accounts.map((a) => (typeof a === "string" ? a : keys[a])).filter(Boolean)
      : (ix.accountKeyIndexes ?? []).map((i) => keys[i]).filter(Boolean);
    collected.push({ programId, accounts, data: ix.data ?? null });
  };
  for (const ix of message.instructions ?? []) pushIx(ix);
  for (const group of tx?.meta?.innerInstructions ?? []) {
    for (const ix of group.instructions ?? []) pushIx(ix);
  }
  return collected;
}

export async function discoverMintUniverse(input = {}) {
  const paper = String(input.mints ?? input.paperMints ?? process.env.PAPER_MINTS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(isPubkey);
  if (paper.length) {
    return {
      source: "paper_env",
      mints: [...new Set(paper)],
      availability: "OK",
      reason: "operator PAPER_MINTS override",
    };
  }

  const rpc = input.rpc ?? process.env.SOLANA_RPC_PRIMARY ?? "https://api.mainnet-beta.solana.com";
  const sigs = await rpcJson(rpc, "getSignaturesForAddress", [PUMPFUN_PROGRAM_ID, { limit: 3 }]);
  if (sigs.availability !== "OK" || !Array.isArray(sigs.value)) {
    return {
      source: "unavailable",
      mints: [],
      availability: "UNAVAILABLE",
      reason: "pumpfun signatures unavailable",
    };
  }

  const mints = [];
  for (const row of sigs.value.slice(0, 3)) {
    const sig = row?.signature;
    if (!sig) continue;
    const tx = await rpcJson(rpc, "getTransaction", [
      sig,
      { encoding: "json", maxSupportedTransactionVersion: 1 },
    ]);
    if (tx.availability !== "OK" || !tx.value) continue;
    const parsed = parsePumpFunCreatesFromTx({
      instructions: instructionsFromTx(tx.value),
      logs: tx.value.meta?.logMessages ?? [],
    });
    for (const c of parsed) mints.push(c.mint);
  }

  const unique = [...new Set(mints)];
  if (!unique.length) {
    return {
      source: "empty",
      mints: [],
      availability: "EMPTY",
      reason: "no pump.fun create mints in recent signatures",
    };
  }
  return { source: "pumpfun", mints: unique, availability: "OK", reason: "parsed pump.fun creates" };
}
