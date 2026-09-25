import { describe, expect, it, vi } from "vitest";
import {
  HeliusTransactionsProvider,
  HeliusUnavailableError,
} from "./helius-transactions-provider.js";
import { HeliusTradeActivitySource } from "./helius-trade-activity-source.js";

function jsonRpc(result: unknown, status = 200): Response {
  return new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("Wave 6 HeliusTransactionsProvider", () => {
  it("maps non-empty data to status ok with preserved null blockTime", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonRpc({
        data: [
          {
            signature: "sig1",
            blockTime: null,
            slot: 100,
            transaction: { signatures: ["sig1"], message: {} },
            err: null,
          },
          {
            signature: "sig2",
            blockTime: 1_700_000_000,
            slot: 101,
            transaction: { signatures: ["sig2"], message: {} },
            err: null,
          },
        ],
      }),
    );

    const provider = new HeliusTransactionsProvider({
      rpcUrl: "https://mainnet.helius-rpc.com/?api-key=test",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const result = await provider.getTransactionsForAddress("Wallet111");
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.transactions).toHaveLength(2);
      expect(result.transactions[0]!.blockTime).toBeNull();
      expect(result.transactions[1]!.blockTime).toBe(1_700_000_000);
    }
  });

  it("empty array → status empty, not ok", async () => {
    const provider = new HeliusTransactionsProvider({
      rpcUrl: "https://example.test",
      fetchImpl: (async () => jsonRpc({ data: [] })) as unknown as typeof fetch,
    });
    const result = await provider.getTransactionsForAddress("Wallet111");
    expect(result.status).toBe("empty");
  });

  it("429 → HeliusUnavailableError", async () => {
    const provider = new HeliusTransactionsProvider({
      rpcUrl: "https://example.test",
      fetchImpl: (async () =>
        new Response("{}", { status: 429 })) as unknown as typeof fetch,
    });
    await expect(provider.getTransactionsForAddress("W")).rejects.toBeInstanceOf(
      HeliusUnavailableError,
    );
  });

  it("5xx → HeliusUnavailableError", async () => {
    const provider = new HeliusTransactionsProvider({
      rpcUrl: "https://example.test",
      fetchImpl: (async () =>
        new Response("{}", { status: 503 })) as unknown as typeof fetch,
    });
    await expect(provider.getTransactionsForAddress("W")).rejects.toMatchObject({
      httpStatus: 503,
    });
  });

  it("network error → HeliusUnavailableError", async () => {
    const provider = new HeliusTransactionsProvider({
      rpcUrl: "https://example.test",
      fetchImpl: (async () => {
        throw new Error("ECONNRESET");
      }) as unknown as typeof fetch,
    });
    await expect(provider.getTransactionsForAddress("W")).rejects.toBeInstanceOf(
      HeliusUnavailableError,
    );
  });
});

describe("Wave 6 HeliusTradeActivitySource", () => {
  it("empty → null summary (verified no activity)", async () => {
    const provider = new HeliusTransactionsProvider({
      rpcUrl: "https://example.test",
      fetchImpl: (async () => jsonRpc({ data: [] })) as unknown as typeof fetch,
    });
    const source = new HeliusTradeActivitySource({ provider });
    expect(await source.getWalletTradeSummary("w", "mint")).toBeNull();
  });

  it("ok txs → summary with lastTradeAt from non-null blockTime only", async () => {
    const provider = new HeliusTransactionsProvider({
      rpcUrl: "https://example.test",
      fetchImpl: (async () =>
        jsonRpc({
          data: [
            {
              blockTime: null,
              transaction: { signatures: ["a"] },
            },
            {
              blockTime: 1_700_000_100,
              transaction: { signatures: ["b"] },
            },
          ],
        })) as unknown as typeof fetch,
    });
    const source = new HeliusTradeActivitySource({ provider });
    const summary = await source.getWalletTradeSummary("w", "mint");
    expect(summary).not.toBeNull();
    expect(summary!.lastTradeAt).toBe(
      new Date(1_700_000_100 * 1000).toISOString(),
    );
    // USD not classified yet — honest zeros
    expect(summary!.buyUsd).toBe(0);
    expect(summary!.sellUsd).toBe(0);
  });
});
