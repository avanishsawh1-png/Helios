/**
 * Wave 13 — Agent runtime + tier contracts.
 * FakeLlmClient by default. AGENTS_ENABLED=false. Budgets enforced.
 * No trading writes. Prompt is a versioned string; hash recorded.
 */

import { createHash } from "node:crypto";
import { AgentOsBoundaryError, type AgentTier } from "./charter.js";
import type { ToolCall, ToolRegistry, ToolResult } from "./tool-registry.js";

export interface LlmMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
}

export interface LlmClient {
  complete(messages: LlmMessage[]): Promise<{ text: string }>;
}

export class FakeLlmClient implements LlmClient {
  constructor(private readonly replies: string[] = ["OBSERVE_ONLY"]) {}
  async complete(): Promise<{ text: string }> {
    return { text: this.replies[0] ?? "OBSERVE_ONLY" };
  }
}

export interface AgentBudget {
  maxSteps: number;
  maxToolCalls: number;
  maxTokens: number;
  maxUsdPerDay: number;
}

export const DEFAULT_TIER_BUDGETS: Record<AgentTier, AgentBudget> = {
  1: { maxSteps: 8, maxToolCalls: 6, maxTokens: 4_000, maxUsdPerDay: 0 },
  2: { maxSteps: 12, maxToolCalls: 10, maxTokens: 8_000, maxUsdPerDay: 0 },
  3: { maxSteps: 16, maxToolCalls: 12, maxTokens: 8_000, maxUsdPerDay: 0 },
};

export function promptHash(prompt: string): string {
  return createHash("sha256").update(prompt).digest("hex");
}

export interface AgentRun {
  tier: AgentTier;
  enabled: boolean;
  promptVersion: string;
  promptSha256: string;
  steps: number;
  toolCalls: number;
  status: "OK" | "DISABLED" | "BUDGET_EXHAUSTED" | "BOUNDARY";
  outputs: ToolResult[];
  narration: string | null;
}

export class AgentRuntime {
  constructor(
    private readonly tools: ToolRegistry,
    private readonly llm: LlmClient = new FakeLlmClient(),
    private readonly enabled = process.env.AGENTS_ENABLED === "true",
  ) {}

  async run(input: {
    tier: AgentTier;
    prompt: string;
    promptVersion: string;
    plannedTools: ToolCall[];
  }): Promise<AgentRun> {
    const budget = DEFAULT_TIER_BUDGETS[input.tier];
    const run: AgentRun = {
      tier: input.tier,
      enabled: this.enabled,
      promptVersion: input.promptVersion,
      promptSha256: promptHash(input.prompt),
      steps: 0,
      toolCalls: 0,
      status: "OK",
      outputs: [],
      narration: null,
    };

    if (!this.enabled) {
      run.status = "DISABLED";
      return run;
    }

    try {
      for (const call of input.plannedTools) {
        run.steps += 1;
        if (run.steps > budget.maxSteps || run.toolCalls >= budget.maxToolCalls) {
          run.status = "BUDGET_EXHAUSTED";
          return run;
        }
        const result = await this.tools.invoke(call);
        run.toolCalls += 1;
        run.outputs.push(result);
      }
      const narr = await this.llm.complete([{ role: "system", content: input.prompt }]);
      run.narration = narr.text;
      return run;
    } catch (err) {
      if (err instanceof AgentOsBoundaryError) {
        run.status = "BOUNDARY";
        return run;
      }
      throw err;
    }
  }
}
