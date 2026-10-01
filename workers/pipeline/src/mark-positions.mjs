import { fetchJupiterQuote } from "../../../services/quote/src/jupiter-fetch.mjs";
import { priceFromQuote } from "./pnl.mjs";

const MARK_IN = 10_000_000;

/** Mark using the same input lamports as paper quotes. */
export async function markPositions(positions, opts = {}) {
  const inAmount = opts.amountLamports ?? MARK_IN;
  const out = [];
  for (const pos of positions) {
    if (!pos?.mint) {
      out.push({ ...pos, markStatus: "UNAVAILABLE", markPrice: null, markInAmount: inAmount });
      continue;
    }
    const q = await fetchJupiterQuote({ outputMint: pos.mint, amountLamports: inAmount });
    if (q.availability !== "OK" || !q.quote?.outAmount) {
      out.push({ ...pos, markStatus: "UNAVAILABLE", markPrice: null, markInAmount: inAmount });
      continue;
    }
    const markPrice = priceFromQuote(q.quote, inAmount);
    out.push({
      ...pos,
      markStatus: markPrice != null ? "OK" : "UNAVAILABLE",
      markPrice,
      markInAmount: inAmount,
      markOutAmount: Number(q.quote.outAmount),
    });
  }
  return out;
}
