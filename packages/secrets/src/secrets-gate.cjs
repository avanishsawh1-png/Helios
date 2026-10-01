const assert = require("node:assert/strict");
const path = require("node:path");

async function main() {
  const { encryptSecrets, decryptSecrets, PUBLIC_ONLY_PLACEHOLDERS } = await import(
    path.resolve(__dirname, "./envelope.mjs")
  );
  const pass = "test-passphrase-ok";
  const env = encryptSecrets(
    {
      PAPER_WALLET_PUBKEY: PUBLIC_ONLY_PLACEHOLDERS.PAPER_WALLET_PUBKEY,
      HELIUS_API_KEY: "test-only",
      WALLET_PRIVATE_KEY_B58: "not-a-real-key",
    },
    pass,
  );
  const back = decryptSecrets(env, pass);
  assert.equal(back.PAPER_WALLET_PUBKEY, "9VwsQdfnsb7YmsY2egUs3bMVjCj8PxqRNjHkd27nchFN");
  assert.equal(back.HELIUS_API_KEY, "test-only");
  assert.throws(() => decryptSecrets(env, "wrong-passphrase-xx"));
  const example = require("node:fs").readFileSync(
    path.resolve(__dirname, "../../../.env.trading-runtime.example"),
    "utf8",
  );
  assert.match(example, /9VwsQdfnsb7YmsY2egUs3bMVjCj8PxqRNjHkd27nchFN/);
  assert.match(example, /CeTo1A7B4cE7mRbhG9QMCVSepFj6NfSeT3eLkGbnhtsS/);
  assert.match(example, /REPLACE_HELIUS_API_KEY/);
  assert.doesNotMatch(example, /WALLET_PRIVATE_KEY=/);
  assert.doesNotMatch(example, /api-key=[0-9a-f-]{36}/);
  console.log("Secrets envelope unit checks: PASS public_only_in_examples encrypted_roundtrip");
}

main();
