/**
 * UI-side permission hints mirroring packages/types rbac map.
 * Source of truth remains the API (403); this only hides/disables controls.
 */
import type { ApiUser } from "../api/client.js";

export type UiPermission =
  | "*:read"
  | "trading:approved_actions"
  | "position:manual_exit"
  | "config:write"
  | "risk:write";

const ROLE_PERMS: Record<ApiUser["role"], UiPermission[]> = {
  ADMIN: ["*:read", "trading:approved_actions", "position:manual_exit", "config:write", "risk:write"],
  TRADER: ["*:read", "trading:approved_actions", "position:manual_exit"],
  VIEWER: ["*:read"],
};

export function can(role: ApiUser["role"] | undefined, permission: UiPermission): boolean {
  if (!role) return false;
  const granted = ROLE_PERMS[role];
  if (!granted) return false;
  return granted.includes(permission);
}

export function canStartPaper(role: ApiUser["role"] | undefined): boolean {
  return can(role, "trading:approved_actions");
}

export function canStartLive(role: ApiUser["role"] | undefined): boolean {
  return can(role, "risk:write");
}

export function canConfig(role: ApiUser["role"] | undefined): boolean {
  return can(role, "config:write");
}

export function canManualExit(role: ApiUser["role"] | undefined): boolean {
  return can(role, "position:manual_exit");
}
