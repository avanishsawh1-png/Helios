import { rpcCallPooled } from "../../../packages/solana/src/rpc-pool.mjs";

function clamp01(n) {
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(1, n));
}

/**
 * Smart-money feed. No key → null (not measured).
 * Key + empty txs → 0 (measured none).
 * Key + txs → unique fee-payers / 20, capped at 1.
 * Never uses a hardcoded 0.5 metadata bonus.
 */
export async function fetchSmartMoney(mint, opts = {}) {
  const key = opts.apiKey ?? process.env.HELIUS_API_KEY;
  const fetchImpl = opts.fetchImpl ?? fetch;
  if (!key) return { value: null, reason: "no_helius_key" };
  const url =
    opts.url ??
    `https://api.helius.xyz/v0/addresses/${mint}/transactions?api-key=${encodeURIComponent(key)}&limit=20`;
  try {
    const res = await fetchImpl(url, { headers: { accept: "application/json" } });
    if (res.status === 429 || res.status >= 500) {
      return { value: null, reason: `helius_http_${res.status}` };
    }
    if (!res.ok) return { value: null, reason: `helius_http_${res.status}` };
    const body = await res.json();
    if (!Array.isArray(body)) return { value: null, reason: "helius_malformed" };
    if (body.length === 0) return { value: 0, reason: "helius_empty" };
    const payers = new Set(
      body.map((tx) => tx.feePayer || tx.fee_payer || tx.nativeTransfers?.[0]?.fromUserAccount).filter(Boolean),
    );
    const n = payers.size || body.length;
    return { value: clamp01(n / 20), reason: "helius_address_txs", n };
  } catch (err) {
    return { value: null, reason: String(err?.message ?? err) };
  }
}

export async function fetchMintFeatures(mint, endpoints) {
  const parsed = await rpcCallPooled(endpoints, "getAccountInfo", [mint, { encoding: "jsonParsed" }]);
  if (parsed.availability !== "OK" || !parsed.value?.value) {
    return { mint, availability: "UNAVAILABLE", reason: "mint_account_unavailable", features: null };
  }
  const info = parsed.value.value.data?.parsed?.info ?? {};
  const mintAuth = info.mintAuthority ?? null;
  const freezeAuth = info.freezeAuthority ?? null;
  const security = clamp01((mintAuth ? 0 : 0.5) + (freezeAuth ? 0 : 0.5));

  const largest = await rpcCallPooled(endpoints, "getTokenLargestAccounts", [mint]);
  let holder = null;
  if (largest.availability === "OK" && Array.isArray(largest.value?.value) && largest.value.value.length) {
    const amounts = largest.value.value.map((a) => Number(a.uiAmount ?? a.amount ?? 0)).filter((n) => Number.isFinite(n));
    const sum = amounts.reduce((a, b) => a + b, 0);
    if (sum > 0) holder = clamp01(1 - amounts[0] / sum);
  }

  const sigs = await rpcCallPooled(endpoints, "getSignaturesForAddress", [mint, { limit: 20 }]);
  let momentum = null;
  if (sigs.availability === "OK" && Array.isArray(sigs.value)) {
    momentum = clamp01(sigs.value.length / 20);
  }

  const sm = await fetchSmartMoney(mint);
  const features = { security, holder, momentum, smartMoney: sm.value };
  const complete = Object.values(features).every((v) => v != null);
  return {
    mint,
    availability: complete ? "OK" : "UNAVAILABLE",
    reason: complete ? "on_chain_features" : `incomplete:${sm.reason}`,
    features,
    smartMoneyReason: sm.reason,
  };
}

export async function loadFeatures(mints, endpoints, cap = 3) {
  const out = {};
  for (const mint of mints.slice(0, cap)) {
    const row = await fetchMintFeatures(mint, endpoints);
    if (row.availability === "OK") out[mint] = row.features;
  }
  return out;
}
