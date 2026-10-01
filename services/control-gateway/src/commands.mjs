import { applyCommand } from "./control-state.mjs";

export const ALLOWED_COMMANDS = [
  "START",
  "PAUSE",
  "RESUME",
  "STOP",
  "CONFIG_CHANGE",
  "KILL_SWITCH",
  "CLEAR_KILL",
  "MANUAL_EXIT",
];

export function validateGatewayCommand(input) {
  const mode = String(input.mode ?? process.env.TRADING_MODE ?? "PAPER").toUpperCase();
  if (mode === "LIVE") {
    return { ok: false, status: 403, reason: "LIVE_REFUSED" };
  }
  if (input.apiKey !== process.env.CONTROL_GATEWAY_API_KEY) {
    return { ok: false, status: 401, reason: "bad_api_key" };
  }
  if (!ALLOWED_COMMANDS.includes(input.command)) {
    return { ok: false, status: 400, reason: "unknown_command" };
  }
  if (input.command === "CONFIG_CHANGE" && input.target && /manualAdminApproval|TRADING_MODE|section70/i.test(String(input.target))) {
    return { ok: false, status: 403, reason: "protected_target" };
  }
  return { ok: true, status: 200, reason: "valid", command: input.command };
}

export function dispatchGatewayCommand(input) {
  const v = validateGatewayCommand(input);
  if (!v.ok) return v;
  const applied = applyCommand(input);
  if (!applied.ok) return { ok: false, status: 409, reason: applied.reason, state: applied.state };
  return {
    ok: true,
    status: 200,
    reason: applied.idempotent ? "idempotent" : "applied",
    command: input.command,
    state: applied.state,
  };
}
