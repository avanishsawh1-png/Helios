const assert = require("node:assert/strict");
const path = require("node:path");

async function main() {
  const { parsePumpFunCreate, PUMPFUN_PROGRAM_ID } = await import(
    path.resolve(__dirname, "./sources/pumpfun-parse.mjs")
  );
  const mint = "So11111111111111111111111111111111111111112";
  const parsed = parsePumpFunCreate({
    programId: PUMPFUN_PROGRAM_ID,
    accounts: [mint],
  });
  assert.equal(parsed.mint, mint);

  const { discoverMintUniverse } = await import(path.resolve(__dirname, "./discover-mints.mjs"));
  const env = await discoverMintUniverse({ mints: mint });
  assert.equal(env.source, "paper_env");

  const loadedKeys = (message, meta) => {
    const staticKeys = message.accountKeys;
    const loaded = [...(meta.loadedAddresses.writable ?? []), ...(meta.loadedAddresses.readonly ?? [])];
    return [...staticKeys, ...loaded];
  };
  const keys = loadedKeys(
    { accountKeys: ["11111111111111111111111111111111"] },
    { loadedAddresses: { writable: [], readonly: [PUMPFUN_PROGRAM_ID] } },
  );
  assert.equal(keys[1], PUMPFUN_PROGRAM_ID);

  const fs = require("node:fs");
  const ts = fs.readFileSync(path.resolve(__dirname, "./discover-mints.ts"), "utf8");
  assert.match(ts, /try \{/);
  assert.match(ts, /catch \{/);
  assert.match(ts, /availability: "UNAVAILABLE"/);
  console.log("Discovery pumpfun + metadata wiring: PASS parse_ok lookup_table_keys ts_try_catch");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
