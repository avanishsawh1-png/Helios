/**
 * Wave 23 — API routes + RBAC for preset staging.
 * Humans with canConfig only. Agents get 403. Section 70 untouched.
 */

import { stagePresetChange, type StageRequest, type StageResult } from "./preset-staging.js";

export type Role = "admin" | "operator" | "viewer" | "agent";

export const ROLE_PERMISSIONS: Record<Role, { canConfig: boolean }> = {
  admin: { canConfig: true },
  operator: { canConfig: true },
  viewer: { canConfig: false },
  agent: { canConfig: false },
};

export interface HttpRequest {
  role: Role;
  correlationId: string;
  body: StageRequest;
}

export interface HttpResponse {
  status: number;
  body: {
    correlationId: string;
    result?: StageResult;
    error?: string;
  };
}

export function handleStagePreset(req: HttpRequest): HttpResponse {
  const perms = ROLE_PERMISSIONS[req.role];
  if (!perms?.canConfig) {
    return { status: 403, body: { correlationId: req.correlationId, error: "forbidden" } };
  }
  if (req.body.actor !== "human") {
    return { status: 403, body: { correlationId: req.correlationId, error: "actor_must_be_human" } };
  }
  const result = stagePresetChange(req.body);
  const status = result.status === "REJECTED" ? 400 : 200;
  return { status, body: { correlationId: req.correlationId, result } };
}
