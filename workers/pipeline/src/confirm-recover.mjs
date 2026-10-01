export function confirmPaperFill(paper) {
  if (!paper?.executed) return { confirmed: false, reason: "no_fill", signature: null };
  if (paper.chainSubmitted) return { confirmed: false, reason: "chain_submit_not_allowed", signature: null };
  if (paper.signature) return { confirmed: false, reason: "unexpected_chain_signature", signature: null };
  return { confirmed: true, reason: "paper_ledger_only", signature: null };
}

export function verifyRecovery(state) {
  const live = (state.cycles ?? []).filter((c) => c.liveAttempt?.submitted);
  if (live.length) return { ok: false, reason: "live_rows_present" };
  const badSig = (state.cycles ?? []).some((c) => c.confirmation?.signature);
  if (badSig) return { ok: false, reason: "fabricated_signature_in_state" };
  return { ok: true, reason: "paper_state_clean", n: state.cycles?.length ?? 0 };
}

/** Never confirm a chain sig that was not submitted. */
export async function reconcileSignature(signature, rpcCall) {
  if (!signature) {
    return { availability: "EMPTY", confirmed: false, reason: "no_signature" };
  }
  return {
    availability: "UNAVAILABLE",
    confirmed: false,
    reason: "chain_reconcile_blocked_while_section_70_closed",
  };
}
