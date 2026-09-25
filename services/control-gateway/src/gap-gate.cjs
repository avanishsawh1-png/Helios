const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const path = require("node:path");

const root = path.resolve(__dirname, "../../..");

async function main() {
  const { validateGatewayCommand } = await import(
    path.join(root, "services/control-gateway/src/commands.mjs")
  );
  process.env.CONTROL_GATEWAY_API_KEY = "k1";
  assert.equal(validateGatewayCommand({ command: "START", mode: "LIVE", apiKey: "k1" }).reason, "LIVE_REFUSED");
  assert.equal(validateGatewayCommand({ command: "START", mode: "PAPER", apiKey: "bad" }).status, 401);
  assert.equal(validateGatewayCommand({ command: "START", mode: "PAPER", apiKey: "k1" }).ok, true);
  assert.equal(
    validateGatewayCommand({ command: "CONFIG_CHANGE", mode: "PAPER", apiKey: "k1", target: "manualAdminApproval" }).status,
    403,
  );

  const { runPaperCycle } = await import(path.join(root, "workers/pipeline/src/paper-system.mjs"));
  const empty = await runPaperCycle({ mode: "PAPER" });
  assert.equal(empty.stages.find((s) => s.stage === "analyze").kind, "EMPTY");
  const listed = await runPaperCycle({ mode: "PAPER", mints: "So11111111111111111111111111111111111111112" });
  assert.equal(listed.stages.find((s) => s.stage === "analyze").kind, "CONTINUE");

  const gw = spawn(process.execPath, [path.join(root, "services/control-gateway/src/server.mjs")], {
    env: { ...process.env, PORT: "34568", TRADING_MODE: "PAPER", CONTROL_GATEWAY_API_KEY: "k1" },
    stdio: "ignore",
  });
  await new Promise((r) => setTimeout(r, 300));
  const denied = await fetch("http://127.0.0.1:34568/v1/command", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": "k1" },
    body: JSON.stringify({ command: "CONFIG_CHANGE", target: "TRADING_MODE" }),
  }).then((r) => r.json());
  assert.equal(denied.ok, false);
  const ok = await fetch("http://127.0.0.1:34568/v1/command", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": "k1" },
    body: JSON.stringify({ command: "PAUSE" }),
  }).then((r) => r.json());
  assert.equal(ok.ok, true);
  gw.kill();
  console.log("Gap-fill gateway + analyze unit checks: PASS");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
