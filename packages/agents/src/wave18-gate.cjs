const assert = require("node:assert/strict");

function diagnoseIncident(input) {
  if (!input.evidence.length) {
    return { incidentId: input.incident.id, status: "REJECTED_UNVERIFIED", summary: "no EvidenceRef", evidence: [] };
  }
  if (!input.baseline || input.baseline.availability !== "OK") {
    return {
      incidentId: input.incident.id,
      status: "INCONCLUSIVE",
      summary: `baseline ${input.baseline?.availability ?? "missing"}`,
      evidence: input.evidence,
    };
  }
  return {
    incidentId: input.incident.id,
    status: "DIAGNOSED",
    summary: `${input.incident.title} vs baseline delta=${input.baseline.delta} n=${input.baseline.n}`,
    evidence: input.evidence,
  };
}

const incident = { id: "inc:1", tier: 2, title: "LIVE seen", status: "OPEN", availability: "OK", alerts: [] };

assert.equal(
  diagnoseIncident({ incident, baseline: { availability: "OK", delta: 1, n: 5 }, evidence: [] }).status,
  "REJECTED_UNVERIFIED",
);
assert.equal(
  diagnoseIncident({
    incident,
    baseline: { availability: "INSUFFICIENT_SAMPLE", delta: null, n: 1 },
    evidence: [{ toolCallId: "t1", source: "features.snapshot" }],
  }).status,
  "INCONCLUSIVE",
);

const ok = diagnoseIncident({
  incident,
  baseline: { availability: "OK", delta: -2, n: 8 },
  evidence: [{ toolCallId: "t1", source: "features.snapshot" }],
});
assert.equal(ok.status, "DIAGNOSED");
assert.match(ok.summary, /delta=-2/);
assert.equal(ok.evidence[0].toolCallId, "t1");

console.log("Wave 18 diagnostician unit checks: PASS");
