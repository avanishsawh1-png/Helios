const assert = require("node:assert/strict");
const path = require("node:path");

async function main() {
  const { fetchSmartMoney } = await import(path.resolve(__dirname, "./feature-adapters.mjs"));

  const none = await fetchSmartMoney("So11111111111111111111111111111111111111112", { apiKey: "" });
  assert.equal(none.value, null);
  assert.equal(none.reason, "no_helius_key");

  const empty = await fetchSmartMoney("mint", {
    apiKey: "k",
    url: "http://127.0.0.1/helius",
    fetchImpl: async () => ({ ok: true, status: 200, json: async () => [] }),
  });
  assert.equal(empty.value, 0);
  assert.equal(empty.reason, "helius_empty");

  const txs = await fetchSmartMoney("mint", {
    apiKey: "k",
    url: "http://127.0.0.1/helius",
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      json: async () => [{ feePayer: "A" }, { feePayer: "B" }, { feePayer: "A" }],
    }),
  });
  assert.equal(txs.value, 2 / 20);
  assert.notEqual(txs.value, 0.5);

  const down = await fetchSmartMoney("mint", {
    apiKey: "k",
    url: "http://127.0.0.1/helius",
    fetchImpl: async () => ({ ok: false, status: 429, json: async () => ({}) }),
  });
  assert.equal(down.value, null);

  console.log("S2 feature feeds unit checks: PASS helius_empty=0 no_key=null no_metadata_bonus");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
