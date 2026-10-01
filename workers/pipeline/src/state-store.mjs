import fs from "node:fs";
import path from "node:path";

const defaultPath = process.env.HELIOS_STATE_PATH ?? path.resolve("/tmp/helios-state.json");

export function loadState(file = defaultPath) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return { cycles: [], positions: [], outcomes: [], lastSlot: null };
  }
}

export function saveState(state, file = defaultPath) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state));
  fs.renameSync(tmp, file);
  return file;
}

export function reconcile(state) {
  const liveSubmitted = (state.cycles ?? []).some((c) => c.liveAttempt?.submitted);
  if (liveSubmitted) {
    return { ok: false, reason: "live_submit_recorded_while_gate_should_be_closed" };
  }
  return { ok: true, reason: "no_live_broadcast_in_state" };
}

export async function persistState(state, file = defaultPath) {
  saveState(state, file);
  const url = process.env.DATABASE_URL;
  if (!url) return { backend: "file", reason: "no_database_url" };
  try {
    const pg = await import("pg");
    const client = new pg.default.Client({ connectionString: url });
    await client.connect();
    try {
      const last = (state.cycles ?? []).at(-1);
      if (last?.cycleId) {
        await client.query(
          `INSERT INTO pipeline_cycles (cycle_id, paper_executed, live_submitted, last_slot, payload)
           VALUES ($1,$2,$3,$4,$5::jsonb)
           ON CONFLICT (cycle_id) DO UPDATE SET payload = EXCLUDED.payload`,
          [
            last.cycleId,
            Boolean(last.paperExecuted),
            Boolean(last.liveAttempt?.submitted),
            state.lastSlot,
            JSON.stringify(last),
          ],
        );
      }
      for (const pos of state.positions ?? []) {
        if (!pos.runId) continue;
        await client.query(
          `INSERT INTO pipeline_positions (run_id, mint, mark_status, payload)
           VALUES ($1,$2,$3,$4::jsonb)
           ON CONFLICT (run_id) DO UPDATE SET payload = EXCLUDED.payload, mark_status = EXCLUDED.mark_status, mint = EXCLUDED.mint`,
          [pos.runId, pos.mint ?? null, pos.markStatus ?? null, JSON.stringify(pos)],
        );
      }
    } finally {
      await client.end();
    }
    return { backend: "postgres", reason: "ok" };
  } catch (err) {
    return { backend: "file", reason: String(err?.message ?? err) };
  }
}
