const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

async function main() {
  const { lamportsToSol, fetchSolBalance, fetchPaperAndLiveBalances } = await import(
    path.resolve(__dirname, "./sol-balance.mjs")
  );
  assert.equal(lamportsToSol(1_000_000_000), 1);
  const empty = await fetchSolBalance(null);
  assert.equal(empty.availability, "EMPTY");

  const rpcCall = async () => ({ availability: "OK", value: 2_500_000_000 });
  const one = await fetchSolBalance("9VwsQdfnsb7YmsY2egUs3bMVjCj8PxqRNjHkd27nchFN", ["http://x"], rpcCall);
  assert.equal(one.sol, 2.5);

  const both = await fetchPaperAndLiveBalances({
    paperPubkey: "Paper111111111111111111111111111111111111111",
    livePubkey: "Live1111111111111111111111111111111111111111",
    rpcCall,
  });
  assert.equal(both.liveTradingEnabled, false);
  assert.equal(both.paper.sol, 2.5);
  assert.equal(both.live.sol, 2.5);

  const dash = fs.readFileSync(path.resolve(__dirname, "../../../apps/web/src/pages/Dashboard.tsx"), "utf8");
  assert.match(dash, /Paper SOL/);
  assert.match(dash, /Live SOL/);
  const api = fs.readFileSync(path.resolve(__dirname, "../../../apps/api/src/server.mjs"), "utf8");
  assert.match(api, /\/v1\/balances/);
  console.log("SOL balance wiring unit checks: PASS paper+live_read_only no_live_flag");
}

main();
