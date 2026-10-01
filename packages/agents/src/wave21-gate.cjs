const assert = require("node:assert/strict");

const HARD = { maxPositionUsd: 250, maxExposurePct: 25, maxDailyLossUsd: 100, minStopLossPct: 5 };
function validatePreset(c) {
  if (c.maxPositionUsd > HARD.maxPositionUsd) return { status: "REJECTED_EXCEEDS_HARD" };
  if (c.stopLossPct < HARD.minStopLossPct) return { status: "REJECTED_EXCEEDS_HARD" };
  if (!(c.maxPositionUsd > 0)) return { status: "REJECTED_INVALID" };
  return { status: "ACCEPTED_CANDIDATE" };
}

class CandidateStore {
  constructor() {
    this.rows = new Map();
  }
  put(candidate, at = "2026-09-25T00:00:00.000Z") {
    const validation = validatePreset(candidate);
    if (validation.status !== "ACCEPTED_CANDIDATE") throw new Error(`refuse persist: ${validation.status}`);
    const row = { candidate, validation, storedAt: at, active: false };
    this.rows.set(candidate.id, row);
    return row;
  }
  get(id) {
    return this.rows.get(id) ?? null;
  }
  list() {
    return [...this.rows.values()];
  }
  activate() {
    throw new Error("activation is human-gated");
  }
}

class CandidateProvider {
  constructor(store) {
    this.store = store;
  }
  currentActive() {
    return this.store.list().find((r) => r.active) ?? null;
  }
}

const store = new CandidateStore();
const ok = store.put({ id: "p1", maxPositionUsd: 100, maxExposurePct: 10, maxDailyLossUsd: 40, stopLossPct: 8 });
assert.equal(ok.active, false);
assert.equal(store.get("p1").candidate.id, "p1");
assert.throws(() =>
  store.put({ id: "p2", maxPositionUsd: 999, maxExposurePct: 10, maxDailyLossUsd: 40, stopLossPct: 8 }),
);
assert.throws(() => store.activate("p1"));
const provider = new CandidateProvider(store);
assert.equal(provider.currentActive(), null);

console.log("Wave 21 candidate store unit checks: PASS");
