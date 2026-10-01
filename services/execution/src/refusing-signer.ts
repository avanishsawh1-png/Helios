/**
 * Transaction signer ports.
 * Default implementation refuses every signature. No keys loaded.
 */

export interface UnsignedTx {
  description: string;
  bytes?: Uint8Array | null;
}

export interface SignatureResult {
  signature: string | null;
  refused: boolean;
  reason: string;
}

export interface TransactionSigner {
  sign(tx: UnsignedTx): Promise<SignatureResult>;
}

export class RefusingTransactionSigner implements TransactionSigner {
  async sign(_tx: UnsignedTx): Promise<SignatureResult> {
    return {
      signature: null,
      refused: true,
      reason: "RefusingTransactionSigner — no keys in Helios process",
    };
  }
}
