const assert = require("node:assert/strict");
const path = require("node:path");

async function main() {
  const { priceFromQuote, unrealizedPnlPct } = await import(
    path.resolve(__dirname, "../../workers/pipeline/src/pnl.mjs")
  );
  assert.equal(priceFromQuote({ outAmount: "20", inAmount: "10" }, 10), 2);
  assert.equal(unrealizedPnlPct(100, 110), 10);

  process.env.CONTROL_GATEWAY_API_KEY = "k1";
  const { dispatchGatewayCommand } = await import(
    path.resolve(__dirname, "../../services/control-gateway/src/commands.mjs")
  );
  const { isKillSwitchOn, applyCommand, controlState } = await import(
    path.resolve(__dirname, "../../services/control-gateway/src/control-state.mjs")
  );
  controlState.killSwitch = false;
  const pause = dispatchGatewayCommand({ command: "PAUSE", mode: "PAPER", apiKey: "k1" });
  assert.equal(pause.ok, true);
  assert.equal(pause.state.lifecycle, "PAUSED");
  dispatchGatewayCommand({ command: "KILL_SWITCH", mode: "PAPER", apiKey: "k1" });
  assert.equal(isKillSwitchOn(), true);
  applyCommand({ command: "CLEAR_KILL" });

  const { authorizeRisk } = await import(path.resolve(__dirname, "../../workers/pipeline/src/paper-system.mjs"));
  assert.equal(authorizeRisk(25, 250, { killSwitch: true }).allowed, false);

  console.log("W-audit P0 unit checks: PASS dispatch_pnl_kill");
}

main();
