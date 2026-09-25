export interface RpcSimulateResponse {
  rpcSuccess: boolean;
  err: unknown;
  computeUnitsConsumed: number;
}

export interface RpcSimulateClient {
  simulate(txBase64: string): Promise<RpcSimulateResponse>;
}
