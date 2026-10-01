/**
 * Derive PumpSwap pool PDA from IDL seeds:
 *   seeds = ["pool", index (u16 LE), creator, base_mint, quote_mint]
 */

import { PublicKey } from "@solana/web3.js";
import { PUMPSWAP_PROGRAM_ID } from "./constants.js";

export interface FindPoolPdaInput {
  index: number;
  creator: string;
  baseMint: string;
  quoteMint: string;
}

export function findPoolPda(input: FindPoolPdaInput): {
  address: string;
  bump: number;
} {
  if (!Number.isInteger(input.index) || input.index < 0 || input.index > 0xffff) {
    throw new Error(`pool index out of u16 range: ${input.index}`);
  }
  const programId = new PublicKey(PUMPSWAP_PROGRAM_ID);
  const indexBuf = Buffer.alloc(2);
  indexBuf.writeUInt16LE(input.index, 0);

  const [pda, bump] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("pool"),
      indexBuf,
      new PublicKey(input.creator).toBuffer(),
      new PublicKey(input.baseMint).toBuffer(),
      new PublicKey(input.quoteMint).toBuffer(),
    ],
    programId,
  );
  return { address: pda.toBase58(), bump };
}
