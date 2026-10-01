const assert = require("node:assert/strict");
const path = require("node:path");

async function main() {
  const { confirmPaperFill, verifyRecovery, reconcileSignature } = await import(
    path.resolve(__dirname, "./confirm-recover.mjs")
  );
  assert.equal(confirmPaperFill({ executed: false }).confirmed, false);
  assert.equal(confirmPaperFill({ executed: true, chainSubmitted: false }).confirmed, true);
  assert.equal(confirmPaperFill({ executed: true, chainSubmitted: false }).signature, null);
  assert.equal(confirmPaperFill({ executed: true, chainSubmitted: true }).confirmed, false);
  assert.equal(confirmPaperFill({ executed: true, signature: "fake" }).confirmed, false);

  assert.equal(verifyRecovery({ cycles: [{ liveAttempt: { submitted: false } }] }).ok, true);
  assert.equal(verifyRecovery({ cycles: [{ liveAttempt: { submitted: true } }] }).ok, false);
  assert.equal(verifyRecovery({ cycles: [{ confirmation: { signature: "x" } }] }).ok, false);

  const rec = await reconcileSignature(null);
  assert.equal(rec.confirmed, false);
  const blocked = await reconcileSignature("sig");
  assert.equal(blocked.confirmed, false);
  assert.match(blocked.reason, /section_70/);

  console.log("S7 confirm/recon unit checks: PASS paper_only no_fake_sig live_row_fails");
}

main();
