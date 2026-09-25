export interface AggregatorQuoteResponse {
  outAmount: string | null;
  requestId: string | null;
}

export interface AggregatorClient {
  quote(input: Record<string, unknown>): Promise<AggregatorQuoteResponse | null>;
}
