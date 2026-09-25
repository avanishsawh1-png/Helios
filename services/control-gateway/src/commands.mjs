/**
 * Control-gateway command re-validation (PAPER).
 * Does not start LIVE. Does not set Section 70.
 */

export const ALLOWED_COMMANDS = ["START", "PAUSE", "STOP", "CONFIG_CHANGE"];

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
  return { ok: true, status: 200, reason: "accepted_paper", command: input.command };
}
