const WSOL = "So11111111111111111111111111111111111111112";

async function withRetry(fn, attempts = 3) {
  let last = null;
  for (let i = 0; i < attempts; i += 1) {
    last = await fn(i);
    if (last?.availability === "OK" || last?.availability === "EMPTY") return last;
    const retryable = last?.reason?.includes("429") || last?.reason?.includes("fetch") || last?.reason?.includes("http_5");
    if (!retryable || i === attempts - 1) return last;
    await new Promise((r) => setTimeout(r, 50 * (i + 1)));
  }
  return last;
}

export async function fetchJupiterQuote(input) {
  const attempts = input.attempts ?? 3;
  const fetchImpl = input.fetchImpl ?? fetch;
  return withRetry(async () => {
    const base = input.baseUrl ?? process.env.JUPITER_QUOTE_URL ?? "https://lite-api.jup.ag/swap/v1/quote";
    const url = new URL(base);
    url.searchParams.set("inputMint", input.inputMint ?? WSOL);
    url.searchParams.set("outputMint", input.outputMint);
    url.searchParams.set("amount", String(input.amountLamports ?? 10_000_000));
    url.searchParams.set("slippageBps", String(input.slippageBps ?? 50));
    const headers = { accept: "application/json" };
    if (input.apiKey ?? process.env.JUPITER_API_KEY) {
      headers["x-api-key"] = input.apiKey ?? process.env.JUPITER_API_KEY;
    }
    try {
      const res = await fetchImpl(url, { headers, signal: AbortSignal.timeout(8000) });
      if (res.status === 429) return { availability: "UNAVAILABLE", reason: "jupiter_429", quote: null };
      if (!res.ok) return { availability: "UNAVAILABLE", reason: `jupiter_http_${res.status}`, quote: null };
      const body = await res.json();
      if (!body?.outAmount) return { availability: "EMPTY", reason: "no_route", quote: null, raw: null };
      return {
        availability: "OK",
        reason: "jupiter_quote",
        raw: body,
        quote: {
          inputMint: body.inputMint ?? input.inputMint ?? WSOL,
          outputMint: body.outputMint ?? input.outputMint,
          inAmount: body.inAmount ?? null,
          outAmount: body.outAmount,
          priceImpactPct: body.priceImpactPct ?? null,
        },
      };
    } catch (e) {
      return { availability: "UNAVAILABLE", reason: String(e), quote: null };
    }
  }, attempts);
}

export async function fetchJupiterSwapTx(input) {
  if (!input.userPublicKey) {
    return { availability: "UNAVAILABLE", reason: "PAPER_WALLET_PUBKEY missing", swapTx: null };
  }
  if (!input.quote) return { availability: "UNAVAILABLE", reason: "no_quote", swapTx: null };
  const fetchImpl = input.fetchImpl ?? fetch;
  const attempts = input.attempts ?? 3;
  return withRetry(async () => {
    const url = input.swapUrl ?? process.env.JUPITER_SWAP_URL ?? "https://lite-api.jup.ag/swap/v1/swap";
    try {
      const res = await fetchImpl(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          quoteResponse: input.quoteRaw ?? input.quote,
          userPublicKey: input.userPublicKey,
          wrapAndUnwrapSol: true,
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (res.status === 429) return { availability: "UNAVAILABLE", reason: "jupiter_swap_http_429", swapTx: null };
      if (!res.ok) return { availability: "UNAVAILABLE", reason: `jupiter_swap_http_${res.status}`, swapTx: null };
      const body = await res.json();
      if (!body?.swapTransaction) return { availability: "EMPTY", reason: "no_swap_tx", swapTx: null };
      return { availability: "OK", reason: "jupiter_swap_ix", swapTx: body.swapTransaction };
    } catch (e) {
      return { availability: "UNAVAILABLE", reason: String(e), swapTx: null };
    }
  }, attempts);
}

