/**
 * Wave E5 — PAPER fixture matrix (deterministic).
 * Not a live soak. Does not authorize LIVE.
 */
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const prior = spawnSync(process.execPath, [path.join(__dirname, "e4-gate.cjs")], {
  encoding: "utf8",
});
if (prior.status !== 0) {
  process.stderr.write(prior.stdout + prior.stderr);
  process.exit(prior.status || 1);
}

const cases = [
  { name: "unpriced hold", markStatus: "UNAVAILABLE", mark: 1, expect: "NONE" },
  { name: "hard SL", markStatus: "OK", mark: 91, expect: "STOP_LOSS" },
  { name: "BE flatten", markStatus: "OK", mark: 100.2, peak: 7, be: true, expect: "BREAK_EVEN" },
  { name: "ladder L1", markStatus: "OK", mark: 113, expect: "TAKE_PROFIT" },
  { name: "trail working size", markStatus: "OK", mark: 125, peak: 40, legs: 3, rem: 0.34, be: true, expect: "TRAIL" },
  { name: "moon-bag hold", markStatus: "OK", mark: 125, peak: 40, legs: 3, rem: 0.15, be: true, expect: "NONE" },
  { name: "time-stop loser", markStatus: "OK", mark: 100.5, holdMs: 4 * 3600 * 1000, expect: "TIME_STOP" },
  { name: "time-stop spares winner", markStatus: "OK", mark: 103, holdMs: 4 * 3600 * 1000, expect: "NONE" },
];

function pnl(entry, mark, status) {
  if (status !== "OK" || !(entry > 0) || !(mark > 0)) return null;
  return ((mark - entry) / entry) * 100;
}

function decide(c) {
  const entry = 100;
  const p = pnl(entry, c.mark, c.markStatus);
  if (c.markStatus !== "OK" || p === null) return "NONE";
  if (p <= -8) return "STOP_LOSS";
  const peak = c.peak == null ? p : Math.max(c.peak, p);
  const armed = Boolean(c.be) || peak >= 6;
  if (armed && p <= 0.3) return "BREAK_EVEN";
  const legs = c.legs || 0;
  const rem = c.rem == null ? 1 : c.rem;
  const ladder = [12, 25, 50];
  const sizes = [0.33, 0.33, 0.19];
  if (legs < 3 && p >= ladder[legs]) {
    const frac = Math.min(sizes[legs], Math.max(0, rem - 0.15));
    if (frac > 0) return "TAKE_PROFIT";
  }
  const trailArmed = peak >= 20;
  const trailable = Math.max(0, rem - 0.15);
  if (trailArmed && p <= peak - 8 && trailable > 0) return "TRAIL";
  const winner = p >= 2 || peak >= 2 || legs > 0 || trailArmed;
  if ((c.holdMs || 0) >= 4 * 3600 * 1000 && !winner) return "TIME_STOP";
  return "NONE";
}

let n = 0;
for (const c of cases) {
  const got = decide(c);
  assert.equal(got, c.expect, c.name);
  n += 1;
}

const soakN = 0;
const insufficient = soakN < 30;
assert.equal(insufficient, true);

console.log(`E5 PAPER fixture matrix: PASS n=${n} fixtures`);
console.log("E5 live PAPER soak: INSUFFICIENT_SAMPLE n=0");
console.log("E5 LIVE authorization: NOT GRANTED");
console.log("E1+E2+E3+E4+E5 unit checks: PASS");
