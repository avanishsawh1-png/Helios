const assert = require("node:assert/strict");

function probeNullNeverZero(events) {
  if (!events.length) return { id: "null-never-zero", status: "INCONCLUSIVE", detail: "no events" };
  const bad = events.find((e) => e.availability !== "OK" && e.value === 0);
  if (bad) return { id: "null-never-zero", status: "FAIL", detail: "zeroed" };
  return { id: "null-never-zero", status: "PASS", detail: "ok" };
}

function probePaperMode(mode) {
  if (mode == null || mode === "") return { id: "paper-mode", status: "INCONCLUSIVE" };
  if (String(mode).toUpperCase() === "LIVE") return { id: "paper-mode", status: "FAIL" };
  return { id: "paper-mode", status: "PASS" };
}

function probeProtectedUntouched(writes, protectedNames) {
  const hit = writes.find((w) => protectedNames.some((p) => w === p || w.startsWith(p + ".")));
  if (hit) return { id: "protected-untouched", status: "FAIL" };
  return { id: "protected-untouched", status: "PASS" };
}

function suiteGreen(results) {
  if (results.some((r) => r.status === "FAIL" || r.status === "INCONCLUSIVE")) return false;
  return results.every((r) => r.status === "PASS");
}

assert.equal(probeNullNeverZero([]).status, "INCONCLUSIVE");
assert.equal(probeNullNeverZero([{ availability: "STALE", value: 0 }]).status, "FAIL");
assert.equal(probeNullNeverZero([{ availability: "STALE", value: null }]).status, "PASS");
assert.equal(probePaperMode(null).status, "INCONCLUSIVE");
assert.equal(probePaperMode("LIVE").status, "FAIL");
assert.equal(probePaperMode("PAPER").status, "PASS");
assert.equal(probeProtectedUntouched(["manualAdminApproval"], ["manualAdminApproval"]).status, "FAIL");
assert.equal(probeProtectedUntouched(["pipeline_funnel"], ["manualAdminApproval"]).status, "PASS");

const green = [
  probeNullNeverZero([{ availability: "OK", value: 1 }]),
  probePaperMode("PAPER"),
  probeProtectedUntouched([], ["wallet"]),
];
assert.equal(suiteGreen(green), true);
assert.equal(suiteGreen([probePaperMode(null)]), false);

console.log("Wave 11 deterministic probes unit checks: PASS");
