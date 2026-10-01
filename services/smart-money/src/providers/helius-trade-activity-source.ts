/**
 * Wave 6 — TradeActivitySource backed by Helius raw transactions.
 *
 * Returns WalletTradeSummary | null. Empty result → null (verified no activity),
 * never a fabricated flow. Throws HeliusUnavailableError on 429/5xx/network so
 * WalletActivityBackedProvider maps to available:false.
 *
 * Classification of multi-wallet signals remains in SmartMoneyEngine.
 */

import type { TradeActivitySource, WalletTradeSummary } from "./upstream.js";
import {
  HeliusTransactionsProvider,
  type HeliusRawTransaction,
} from "./helius-transactions-provider.js";

export interface HeliusTradeActivitySourceOptions {
  provider: HeliusTransactionsProvider;
  /**
   * Optional mint filter — when set, only count txs that mention the mint
   * in account keys (best-effort; full instruction decode is out of scope).
   */
  filterByMintMention?: boolean;
}

export class HeliusTradeActivitySource implements TradeActivitySource {
  constructor(private readonly opts: HeliusTradeActivitySourceOptions) {}

  async getWalletTradeSummary(
    wallet: string,
    mint: string,
  ): Promise<WalletTradeSummary | null> {
    const result = await this.opts.provider.getTransactionsForAddress(wallet);

    if (result.status === "unavailable") {
      // Should not happen — provider throws; keep defensive
      throw new Error(result.reason);
    }

    if (result.status === "empty") {
      return null;
    }

    const relevant = this.opts.filterByMintMention
      ? result.transactions.filter((tx) => mentionsMint(tx, mint))
      : result.transactions;

    if (relevant.length === 0) {
      return null;
    }

    // Wave 6: return presence-level summary without inventing USD flows.
    // buyUsd/sellUsd stay 0 until a verified classifier exists; net flow 0
    // with lastTradeAt set means "activity observed, USD not yet classified."
    const last = latestBlockTime(relevant);

    return {
      wallet,
      buyUsd: 0,
      sellUsd: 0,
      lastTradeAt:
        last === null ? null : new Date(last * 1000).toISOString(),
    };
  }
}

function mentionsMint(tx: HeliusRawTransaction, mint: string): boolean {
  const raw = JSON.stringify(tx.raw);
  return raw.includes(mint);
}

function latestBlockTime(txs: HeliusRawTransaction[]): number | null {
  let max: number | null = null;
  for (const tx of txs) {
    if (tx.blockTime === null) continue; // never treat as 0
    if (max === null || tx.blockTime > max) max = tx.blockTime;
  }
  return max;
}
