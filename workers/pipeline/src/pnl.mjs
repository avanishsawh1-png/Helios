/** Normalize quote outAmount at a fixed in-amount so marks are comparable. */
export function priceFromQuote(quote, inAmount) {
  const out = Number(quote?.outAmount);
  const inn = Number(inAmount ?? quote?.inAmount);
  if (!Number.isFinite(out) || !Number.isFinite(inn) || inn <= 0) return null;
  return out / inn;
}

export function unrealizedPnlPct(entryPrice, markPrice) {
  if (entryPrice == null || markPrice == null) return null;
  if (!(entryPrice > 0) || !(markPrice > 0)) return null;
  return ((markPrice - entryPrice) / entryPrice) * 100;
}
