const assert = require("node:assert/strict");

const TREND_MIN_N = 3;
function computeTrend(events, name) {
  const rows = events.filter((e) => e.name === name && e.availability === "OK" && typeof e.value === "number");
  if (events.length === 0) return { name, n: 0, first: null, last: null, delta: null, availability: "UNAVAILABLE" };
  if (rows.length === 0) return { name, n: 0, first: null, last: null, delta: null, availability: "EMPTY" };
  if (rows.length < TREND_MIN_N) {
    return { name, n: rows.length, first: rows[0].value, last: rows[rows.length - 1].value, delta: null, availability: "INSUFFICIENT_SAMPLE" };
  }
  const first = rows[0].value;
  const last = rows[rows.length - 1].value;
  return { name, n: rows.length, first, last, delta: last - first, availability: "OK" };
}
function narrateTrend(stats) {
  if (stats.availability !== "OK" || stats.delta === null) {
    return `trend ${stats.name}: ${stats.availability} (n=${stats.n})`;
  }
  const dir = stats.delta > 0 ? "up" : stats.delta < 0 ? "down" : "flat";
  return `trend ${stats.name}: ${dir} delta=${stats.delta} n=${stats.n}`;
}

assert.equal(computeTrend([], "score").availability, "UNAVAILABLE");
assert.equal(computeTrend([{ name: "score", value: null, availability: "STALE" }], "score").availability, "EMPTY");
const short = computeTrend(
  [
    { name: "score", value: 1, availability: "OK" },
    { name: "score", value: 2, availability: "OK" },
  ],
  "score",
);
assert.equal(short.availability, "INSUFFICIENT_SAMPLE");
assert.equal(short.delta, null);

const ok = computeTrend(
  [
    { name: "score", value: 1, availability: "OK" },
    { name: "score", value: 2, availability: "OK" },
    { name: "score", value: 4, availability: "OK" },
  ],
  "score",
);
assert.equal(ok.delta, 3);
assert.match(narrateTrend(ok), /up delta=3/);
assert.match(narrateTrend(short), /INSUFFICIENT_SAMPLE/);

console.log("Wave 17 trend analyst unit checks: PASS");
