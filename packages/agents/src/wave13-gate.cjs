const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");

function promptHash(prompt) {
  return createHash("sha256").update(prompt).digest("hex");
}

class FakeLlmClient {
  async complete() {
    return { text: "OBSERVE_ONLY" };
  }
}

class AgentRuntime {
  constructor(tools, llm, enabled) {
    this.tools = tools;
    this.llm = llm;
    this.enabled = enabled;
  }
  async run(input) {
    const budget = { maxSteps: 8, maxToolCalls: 2 };
    const run = {
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
    for (const call of input.plannedTools) {
      run.steps += 1;
      if (run.steps > budget.maxSteps || run.toolCalls >= budget.maxToolCalls) {
        run.status = "BUDGET_EXHAUSTED";
        return run;
      }
      if (call.name === "shell") {
        run.status = "BOUNDARY";
        return run;
      }
      run.outputs.push(await this.tools.invoke(call));
      run.toolCalls += 1;
    }
    run.narration = (await this.llm.complete()).text;
    return run;
  }
}

async function main() {
  const tools = {
    async invoke(call) {
      return { toolCallId: call.toolCallId, name: call.name, ok: true, availability: "OK", data: { n: 1 }, error: null };
    },
  };

  const off = new AgentRuntime(tools, new FakeLlmClient(), false);
  const disabled = await off.run({
    tier: 1,
    prompt: "v1",
    promptVersion: "wave-13",
    plannedTools: [{ toolCallId: "a", name: "kb.list", args: {} }],
  });
  assert.equal(disabled.status, "DISABLED");
  assert.equal(disabled.narration, null);

  const on = new AgentRuntime(tools, new FakeLlmClient(), true);
  const ok = await on.run({
    tier: 1,
    prompt: "tier1 observe",
    promptVersion: "wave-13",
    plannedTools: [{ toolCallId: "a", name: "kb.list", args: {} }],
  });
  assert.equal(ok.status, "OK");
  assert.equal(ok.narration, "OBSERVE_ONLY");
  assert.equal(ok.promptSha256.length, 64);
  assert.equal(ok.toolCalls, 1);

  const exhausted = await on.run({
    tier: 1,
    prompt: "x",
    promptVersion: "wave-13",
    plannedTools: [
      { toolCallId: "1", name: "kb.list", args: {} },
      { toolCallId: "2", name: "kb.list", args: {} },
      { toolCallId: "3", name: "kb.list", args: {} },
    ],
  });
  assert.equal(exhausted.status, "BUDGET_EXHAUSTED");

  const boundary = await on.run({
    tier: 1,
    prompt: "x",
    promptVersion: "wave-13",
    plannedTools: [{ toolCallId: "s", name: "shell", args: {} }],
  });
  assert.equal(boundary.status, "BOUNDARY");

  console.log("Wave 13 agent runtime unit checks: PASS");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
