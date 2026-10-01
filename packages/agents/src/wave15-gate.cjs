const assert = require("node:assert/strict");

function alertsFromProbes(results, at = "2026-09-25T00:00:00.000Z") {
  const out = [];
  for (const r of results) {
    if (r.status === "PASS") continue;
    out.push({
      id: `alert:${r.id}:${r.status}`,
      sourceProbe: r.id,
      severity: r.status === "FAIL" ? "danger" : "warn",
      message: r.detail,
      at,
    });
  }
  return out;
}

class InvariantMonitor {
  constructor() {
    this.alerts = [];
  }
  ingest(results, at) {
    const next = alertsFromProbes(results, at);
    this.alerts.push(...next);
    return next;
  }
  openDanger() {
    return this.alerts.filter((a) => a.severity === "danger");
  }
}

const mon = new InvariantMonitor();
const emitted = mon.ingest([
  { id: "null-never-zero", status: "PASS", detail: "ok" },
  { id: "paper-mode", status: "FAIL", detail: "LIVE" },
  { id: "protected-untouched", status: "INCONCLUSIVE", detail: "no sample" },
]);
assert.equal(emitted.length, 2);
assert.equal(emitted[0].severity, "danger");
assert.equal(emitted[1].severity, "warn");
assert.equal(mon.openDanger().length, 1);
assert.equal(mon.openDanger()[0].sourceProbe, "paper-mode");

const quiet = alertsFromProbes([{ id: "x", status: "PASS", detail: "ok" }]);
assert.equal(quiet.length, 0);

console.log("Wave 15 detectors + alerting unit checks: PASS");
