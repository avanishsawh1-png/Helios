const assert = require("node:assert/strict");

function planFromAlerts(alerts, runbooks) {
  return alerts.map((a, i) => {
    const rb = runbooks.find((d) => d.kind === "runbook" && d.body.includes(a.sourceProbe)) ?? null;
    return { id: `task:${a.id}:${i}`, title: a.message, runbookId: rb?.id ?? null, status: "OPEN" };
  });
}
function markDone(_id, actor) {
  if (actor !== "human") throw new Error("maintenance tasks are human-closed");
  return { ok: true };
}
function executeRunbookStep() {
  throw new Error("agents cannot execute runbook steps");
}
function dailyDigest(tasks) {
  const open = tasks.filter((t) => t.status === "OPEN").length;
  return `maintenance digest: open=${open} total=${tasks.length}`;
}

const tasks = planFromAlerts(
  [{ id: "a1", sourceProbe: "disk", severity: "warn", message: "disk high", at: "t" }],
  [{ id: "rb-disk", kind: "runbook", body: "<untrusted>disk</untrusted>", title: "disk", source: "docs", createdAt: "t" }],
);
assert.equal(tasks[0].runbookId, "rb-disk");
assert.equal(tasks[0].status, "OPEN");
assert.throws(() => markDone(tasks[0].id, "agent"));
assert.deepEqual(markDone(tasks[0].id, "human"), { ok: true });
assert.throws(() => executeRunbookStep());
assert.match(dailyDigest(tasks), /open=1/);

console.log("Wave 29 maintenance planner unit checks: PASS");
