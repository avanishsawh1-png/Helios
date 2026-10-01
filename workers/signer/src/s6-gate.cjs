const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

async function main() {
  const { IsolatedSigner } = await import(path.resolve(__dirname, "./isolated-signer.mjs"));
  const s = new IsolatedSigner({ pubkey: "9VwsQdfnsb7YmsY2egUs3bMVjCj8PxqRNjHkd27nchFN" });
  const r = await s.sign({ description: "x" });
  assert.equal(r.refused, true);
  assert.equal(s.publicView().hasSignFn, false);

  const api = fs.readFileSync(path.resolve(__dirname, "../../../apps/api/src/server.mjs"), "utf8");
  assert.doesNotMatch(api, /WALLET_PRIVATE_KEY/);
  assert.match(api, /isolated_refusing/);

  const run = spawnSync(process.execPath, [path.resolve(__dirname, "./main.mjs")], {
    encoding: "utf8",
    env: { ...process.env, HELIOS_SIGNER_ENABLE: "0" },
  });
  assert.equal(run.status, 0);
  const json = JSON.parse(run.stdout);
  assert.equal(json.refused, true);

  console.log("S6 isolated signer unit checks: PASS refuse_default pubkey_only_in_api");
}

main();
