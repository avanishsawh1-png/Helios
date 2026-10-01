const assert = require("node:assert/strict");

function tierForAlert(alert) {
  if (alert.severity === "danger") return 2;
  if (alert.sourceProbe.startsWith("maint")) return 3;
  return 1;
}

function incidentsFromAlerts(alerts) {
  if (alerts == null) return { availability: "UNAVAILABLE", byTier: { 1: [], 2: [], 3: [] } };
  if (alerts.length === 0) return { availability: "EMPTY", byTier: { 1: [], 2: [], 3: [] } };
  const byTier = { 1: [], 2: [], 3: [] };
  for (const alert of alerts) {
    const tier = tierForAlert(alert);
    byTier[tier].push({
      id: `inc:${alert.id}`,
      tier,
      title: alert.message,
      status: "OPEN",
      availability: "OK",
      alerts: [alert],
    });
  }
  return { availability: "OK", byTier };
}

function humanResolve(_id, actor) {
  if (actor !== "human") throw new Error("incidents are human-resolved only");
  return { ok: true };
}

assert.equal(incidentsFromAlerts(null).availability, "UNAVAILABLE");
assert.equal(incidentsFromAlerts([]).availability, "EMPTY");

const model = incidentsFromAlerts([
  { id: "a1", sourceProbe: "paper-mode", severity: "danger", message: "LIVE", at: "t" },
  { id: "a2", sourceProbe: "null-never-zero", severity: "warn", message: "gap", at: "t" },
  { id: "a3", sourceProbe: "maint.disk", severity: "warn", message: "disk", at: "t" },
]);
assert.equal(model.availability, "OK");
assert.equal(model.byTier[1].length, 1);
assert.equal(model.byTier[2].length, 1);
assert.equal(model.byTier[3].length, 1);
assert.equal(model.byTier[2][0].status, "OPEN");

assert.throws(() => humanResolve("inc:a1", "agent"));
assert.deepEqual(humanResolve("inc:a1", "human"), { ok: true });

console.log("Wave 16 incident panel read model unit checks: PASS");
