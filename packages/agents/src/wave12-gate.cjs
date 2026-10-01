const assert = require("node:assert/strict");

const PROTECTED = ["wallet", "manualAdminApproval", "secrets", "TRADING_MODE"];
function isProtectedTarget(name) {
  return PROTECTED.some((t) => name === t || name.startsWith(t + ".") || name.startsWith(t + "/"));
}
const SELECT_ONLY = /^\s*select\b/i;
const WRITE_SQL = /\b(insert|update|delete|drop|alter|grant|revoke|truncate|copy|create)\b/i;
function assertSelectOnly(sql) {
  if (!SELECT_ONLY.test(sql) || WRITE_SQL.test(sql)) throw new Error("sql");
}

class ToolRegistry {
  constructor() {
    this.handlers = new Map();
  }
  register(name, handler) {
    this.handlers.set(name, handler);
  }
  async invoke(call) {
    if (typeof call.args.target === "string" && isProtectedTarget(call.args.target)) {
      throw new Error("protected");
    }
    if (call.name === "read.sql_select") assertSelectOnly(String(call.args.sql ?? ""));
    const handler = this.handlers.get(call.name);
    if (!handler) {
      return { toolCallId: call.toolCallId, name: call.name, ok: false, availability: "UNAVAILABLE", data: null, error: "handler_missing" };
    }
    return handler(call);
  }
}

const reg = new ToolRegistry();
reg.register("kb.list", (call) => ({
  toolCallId: call.toolCallId,
  name: call.name,
  ok: true,
  availability: "EMPTY",
  data: [],
  error: null,
}));

async function main() {
  const listed = await reg.invoke({ toolCallId: "t1", name: "kb.list", args: {} });
  assert.equal(listed.toolCallId, "t1");
  assert.equal(listed.availability, "EMPTY");

  const missing = await reg.invoke({ toolCallId: "t2", name: "features.snapshot", args: {} });
  assert.equal(missing.availability, "UNAVAILABLE");

  await assert.rejects(() =>
    reg.invoke({ toolCallId: "t3", name: "read.sql_select", args: { sql: "DELETE FROM positions" } }),
  );
  await assert.rejects(() =>
    reg.invoke({ toolCallId: "t4", name: "kb.get", args: { target: "wallet" } }),
  );

  assertSelectOnly("SELECT 1");
  console.log("Wave 12 read-only tools unit checks: PASS");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
