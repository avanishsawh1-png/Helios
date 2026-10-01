/**
 * Wave 4 — PumpSwap (post-2025-03-20 migration destination).
 * Program: pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA
 *
 * IDL seed form for pool PDA (verified against vendor/pump_amm.json):
 *   ["pool", index_u16_le, creator, base_mint, quote_mint]
 *
 * Note: Wave brief mentioned ["pool", mint_a, mint_b]; official IDL includes
 * index + creator as well. We follow the IDL (Rule 1).
 */

export const PUMPSWAP_PROGRAM_ID =
  "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA";

/** Pre-2025-03-20 Raydium AMM v4 — only for historical fixtures. */
export const RAYDIUM_AMM_V4_PROGRAM_ID =
  "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8";

/** Pool account discriminator from IDL (sha256 of account:Pool). */
export const POOL_ACCOUNT_DISCRIMINATOR = Buffer.from([
  241, 154, 109, 4, 17, 177, 109, 188,
]);

/** Wrapped SOL mint (common quote). */
export const WSOL_MINT = "So11111111111111111111111111111111111111112";
