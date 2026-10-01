const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

async function main() {
  const { loadState, saveState, persistState, reconcile } = await import(
    path.resolve(__dirname, "./state-store.mjs")
  );
  const file = path.join(os.tmpdir(), `helios-s3-${Date.now()}.json`);
  const state = {
    cycles: [{ cycleId: "c1", paperExecuted: false, liveAttempt: { submitted: false } }],
    positions: [],
    lastSlot: 1,
  };
  saveState(state, file);
  assert.equal(loadState(file).cycles[0].cycleId, "c1");
  assert.equal(reconcile(state).ok, true);
  const prev = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  const p = await persistState(state, file);
  assert.equal(p.backend, "file");
  if (prev !== undefined) process.env.DATABASE_URL = prev;
  const sql = fs.readFileSync(
    path.resolve(__dirname, "../../../services/migration/src/0009_pipeline_state.sql"),
    "utf8",
  );
  assert.match(sql, /pipeline_cycles/);
  assert.match(sql, /live_submitted BOOLEAN NOT NULL DEFAULT FALSE/);
  fs.unlinkSync(file);
  console.log("S3 postgres state unit checks: PASS file_fallback schema_present");
}

main();
