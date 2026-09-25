export interface SolanaProvider {
  getAccount(address: string): Promise<{ data: Uint8Array } | null>;
}

export * from "./bounded-caller.js";
export * from "./outbound-budget.js";
export * from "./rpc-backoff.js";
export * from "./rpc-errors.js";
