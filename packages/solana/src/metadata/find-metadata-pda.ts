/**
 * Metaplex Token Metadata PDA.
 * Program: metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s
 * seeds = ["metadata", metadata_program, mint]
 */

import { PublicKey } from "@solana/web3.js";

export const TOKEN_METADATA_PROGRAM_ID =
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";

export function findMetadataPda(mint: string): { address: string; bump: number } {
  const programId = new PublicKey(TOKEN_METADATA_PROGRAM_ID);
  const mintKey = new PublicKey(mint);
  const [pda, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), programId.toBuffer(), mintKey.toBuffer()],
    programId,
  );
  return { address: pda.toBase58(), bump };
}
