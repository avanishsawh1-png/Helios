export const PUMPFUN_PROGRAM_ID = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function isPubkey(value) {
  return typeof value === "string" && BASE58.test(value);
}

export function parsePumpFunCreate(ix) {
  if (!ix || ix.programId !== PUMPFUN_PROGRAM_ID) return null;
  if (!Array.isArray(ix.accounts) || ix.accounts.length < 1) return null;
  const mint = ix.accounts[0];
  if (!isPubkey(mint)) return null;
  return {
    mint,
    bondingCurve: isPubkey(ix.accounts[2]) ? ix.accounts[2] : null,
    creator: isPubkey(ix.accounts[7]) ? ix.accounts[7] : null,
  };
}

export function parsePumpFunCreatesFromTx(tx) {
  const out = [];
  for (const ix of tx.instructions ?? []) {
    const parsed = parsePumpFunCreate(ix);
    if (parsed) out.push(parsed);
  }
  return out;
}
