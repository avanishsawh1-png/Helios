/**
 * Wave 4 — on-chain pool existence + decode for MigrationEngine.confirm().
 * Fail closed on RPC outage; never guess a pool address from instruction indices.
 */

import type { SolanaProvider } from "@helios/solana";
import { decodePumpSwapPoolAccount, type DecodedPool } from "./decode-pool.js";
import { findPoolPda } from "./find-pool-pda.js";
import { PUMPSWAP_PROGRAM_ID } from "./constants.js";

export type VerifyPoolResult =
  | { status: "ok"; pool: DecodedPool; address: string }
  | { status: "pool_not_found"; address: string }
  | { status: "unparseable"; address: string }
  | { status: "rpc_unavailable"; error: string; address?: string };

/**
 * Verify a known pool address is owned by PumpSwap and decodes.
 */
export async function verifyPoolByAddress(
  provider: SolanaProvider,
  poolAddress: string,
): Promise<VerifyPoolResult> {
  let accountInfo: unknown;
  try {
    accountInfo = await provider.getAccountInfo(poolAddress, {
      encoding: "base64",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { status: "rpc_unavailable", error: message, address: poolAddress };
  }

  if (
    accountInfo === null ||
    (typeof accountInfo === "object" &&
      accountInfo !== null &&
      "value" in accountInfo &&
      (accountInfo as { value: unknown }).value === null)
  ) {
    return { status: "pool_not_found", address: poolAddress };
  }

  const pool = decodePumpSwapPoolAccount(accountInfo);
  if (!pool) {
    return { status: "unparseable", address: poolAddress };
  }
  return { status: "ok", pool, address: poolAddress };
}

/**
 * Derive PDA then verify. Requires index + creator from a trusted prior
 * source (e.g. create_pool event) — not from instruction account indices.
 */
export async function verifyPoolByDerivation(
  provider: SolanaProvider,
  input: {
    index: number;
    creator: string;
    baseMint: string;
    quoteMint: string;
  },
): Promise<VerifyPoolResult> {
  const { address } = findPoolPda(input);
  return verifyPoolByAddress(provider, address);
}

export { PUMPSWAP_PROGRAM_ID };
