/** Single in-process control state. Durable via state-store when saved. */
export const controlState = {
  lifecycle: "RUNNING",
  killSwitch: false,
  manualExitPositionIds: [],
  lastCommandId: null,
  commands: [],
};

export function applyCommand(cmd) {
  const id = cmd.id ?? `cmd_${cmd.command}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  if (controlState.lastCommandId === id) {
    return { ok: true, idempotent: true, state: snapshot() };
  }
  switch (cmd.command) {
    case "START":
      if (controlState.killSwitch) return { ok: false, reason: "kill_switch", state: snapshot() };
      controlState.lifecycle = "RUNNING";
      break;
    case "PAUSE":
      controlState.lifecycle = "PAUSED";
      break;
    case "RESUME":
      if (controlState.killSwitch) return { ok: false, reason: "kill_switch", state: snapshot() };
      controlState.lifecycle = "RUNNING";
      break;
    case "STOP":
      controlState.lifecycle = "STOPPED";
      break;
    case "KILL_SWITCH":
      controlState.killSwitch = true;
      controlState.lifecycle = "PAUSED";
      break;
    case "CLEAR_KILL":
      controlState.killSwitch = false;
      break;
    case "MANUAL_EXIT":
      if (cmd.positionId) controlState.manualExitPositionIds.push(cmd.positionId);
      break;
    case "CONFIG_CHANGE":
      break;
    default:
      return { ok: false, reason: "unknown_command", state: snapshot() };
  }
  controlState.lastCommandId = id;
  controlState.commands.push({ id, command: cmd.command, at: new Date().toISOString() });
  return { ok: true, idempotent: false, state: snapshot() };
}

export function snapshot() {
  return {
    lifecycle: controlState.lifecycle,
    killSwitch: controlState.killSwitch,
    manualExitPositionIds: [...controlState.manualExitPositionIds],
    lastCommandId: controlState.lastCommandId,
  };
}

export function isKillSwitchOn() {
  return controlState.killSwitch || process.env.HELIOS_KILL_SWITCH === "1";
}

export function wantsManualExit(positionId) {
  return controlState.manualExitPositionIds.includes(positionId);
}
