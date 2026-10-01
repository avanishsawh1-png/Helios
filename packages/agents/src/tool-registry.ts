/**
 * Wave 12 — Read-only data plane + tool registry.
 * Tools compute; models do not write SQL or touch PROTECTED_TARGETS.
 */

import { AgentOsBoundaryError, isProtectedTarget } from "./charter.js";

export type ToolName =
  | "kb.list"
  | "kb.get"
  | "features.snapshot"
  | "probes.run"
  | "read.sql_select";

export interface ToolCall {
  toolCallId: string;
  name: ToolName;
  args: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  name: ToolName;
  ok: boolean;
  availability: "OK" | "EMPTY" | "UNAVAILABLE" | "STALE";
  data: unknown;
  error: string | null;
}

const ALLOWED: readonly ToolName[] = [
  "kb.list",
  "kb.get",
  "features.snapshot",
  "probes.run",
  "read.sql_select",
];

const SELECT_ONLY = /^\s*select\b/i;
const WRITE_SQL = /\b(insert|update|delete|drop|alter|grant|revoke|truncate|copy|create)\b/i;

export function assertSelectOnly(sql: string): void {
  if (!SELECT_ONLY.test(sql) || WRITE_SQL.test(sql)) {
    throw new AgentOsBoundaryError("sql not on SELECT allowlist");
  }
}

export type ToolHandler = (call: ToolCall) => Promise<ToolResult> | ToolResult;

export class ToolRegistry {
  private readonly handlers = new Map<ToolName, ToolHandler>();

  register(name: ToolName, handler: ToolHandler): void {
    if (!ALLOWED.includes(name)) {
      throw new AgentOsBoundaryError(`unknown tool ${name}`);
    }
    this.handlers.set(name, handler);
  }

  async invoke(call: ToolCall): Promise<ToolResult> {
    if (!ALLOWED.includes(call.name)) {
      throw new AgentOsBoundaryError(`tool not registered: ${call.name}`);
    }
    if (typeof call.args.target === "string" && isProtectedTarget(call.args.target)) {
      throw new AgentOsBoundaryError(`protected target: ${call.args.target}`);
    }
    if (call.name === "read.sql_select") {
      assertSelectOnly(String(call.args.sql ?? ""));
    }
    const handler = this.handlers.get(call.name);
    if (!handler) {
      return {
        toolCallId: call.toolCallId,
        name: call.name,
        ok: false,
        availability: "UNAVAILABLE",
        data: null,
        error: "handler_missing",
      };
    }
    return handler(call);
  }
}
