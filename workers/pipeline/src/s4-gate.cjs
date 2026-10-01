const assert = require("node:assert/strict");
const path = require("node:path");

async function main() {
  const { fetchJupiterQuote, fetchJupiterSwapTx } = await import(
    path.resolve(__dirname, "../../../services/quote/src/jupiter-fetch.mjs")
  );
  let n = 0;
  const q = await fetchJupiterQuote({
    outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    attempts: 3,
    fetchImpl: async () => {
      n += 1;
      if (n < 3) return { status: 429, ok: false, json: async () => ({}) };
      return { status: 200, ok: true, json: async () => ({ outAmount: "42", outputMint: "x" }) };
    },
  });
  assert.equal(q.availability, "OK");
  assert.equal(q.quote.outAmount, "42");
  assert.equal(n, 3);

  const noKey = await fetchJupiterSwapTx({ quote: { outAmount: "1" } });
  assert.equal(noKey.availability, "UNAVAILABLE");

  console.log("S4 quote/build/sim unit checks: PASS retry_429_then_ok no_pubkey_no_swap");
}

main();
