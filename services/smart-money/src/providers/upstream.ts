export interface WalletTradeSummary {
  wallet: string;
  tradeCount: number;
  lastTxSig: string | null;
}

export interface TradeActivitySource {
  summary(wallet: string): Promise<WalletTradeSummary | null>;
}
