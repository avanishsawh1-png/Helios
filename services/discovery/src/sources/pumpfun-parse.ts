/**
 * Pump.fun create-instruction parser.
 * Program: 6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P
 *
 * Does not invent mints. Returns null when the ix is not a recognizable create.
 */

export const PUMPFUN_PROGRAM_ID = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function isPubkey(value: string | null | undefined): value is string {
  return typeof value === "string" && BASE58.test(value);
}

export interface PumpFunInstruction {
  programId: string;
  accounts: string[];
  data?: string | null;
}

export interface PumpFunCreate {
  mint: string;
  bondingCurve: string | null;
  creator: string | null;
}

function accountAt(accounts: string[], index: number): string | null {
  const v = accounts[index];
  return isPubkey(v) ? v : null;
}

/**
 * Pump.fun `create` account order (classic):
 * 0 mint, 1 mint_authority, 2 bonding_curve, 3 associated_bonding_curve,
 * 4 global, 5 mpl_token_metadata, 6 metadata, 7 user
 */
export function parsePumpFunCreate(ix: PumpFunInstruction | null | undefined): PumpFunCreate | null {
  if (!ix || ix.programId !== PUMPFUN_PROGRAM_ID) return null;
  if (!Array.isArray(ix.accounts) || ix.accounts.length < 1) return null;
  const mint = accountAt(ix.accounts, 0);
  if (!mint) return null;
  return {
    mint,
    bondingCurve: accountAt(ix.accounts, 2),
    creator: accountAt(ix.accounts, 7) ?? accountAt(ix.accounts, ix.accounts.length - 1),
  };
}

export function parsePumpFunCreatesFromTx(tx: {
  instructions?: PumpFunInstruction[];
  logs?: string[] | null;
}): PumpFunCreate[] {
  const out: PumpFunCreate[] = [];
  for (const ix of tx.instructions ?? []) {
    const parsed = parsePumpFunCreate(ix);
    if (parsed) out.push(parsed);
  }
  return out;
}
