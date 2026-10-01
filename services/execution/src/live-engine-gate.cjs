const assert = require("node:assert/strict");
const path = require("node:path");

async function main() {
  const { LiveExecutionEngine } = await import(path.resolve(__dirname, "./live-engine.mjs"));
  const { LiveChainAdapter } = await import(path.resolve(__dirname, "./live-adapter.mjs"));
  const { evaluateLiveGate, loadSection70FromEnv } = await import(
    path.resolve(__dirname, "./live-trading-gate.mjs")
  );

  const closed = evaluateLiveGate(loadSection70FromEnv());
  assert.equal(closed.allowed, false);

  const engine = new LiveExecutionEngine();
  const idle = await engine.execute({ mint: "So11111111111111111111111111111111111111112" });
  assert.equal(idle.submitted, false);
  assert.equal(idle.signature, null);

  const adapter = new LiveChainAdapter({
    userPublicKey: null,
    broadcast: async () => {
      throw new Error("should not broadcast");
    },
  });
  const sent = await adapter.send("x");
  assert.equal(sent.submitted, false);

  console.log("Live engine gate-closed unit checks: PASS submitted=false imported_live-engine.mjs");
}

main();
