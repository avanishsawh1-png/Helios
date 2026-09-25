const assert = require("node:assert/strict");

class FeatureCapture {
  constructor() {
    this.events = [];
    this.hookErrors = 0;
  }
  observe(name, source, passthrough, producer, at = "2026-09-25T00:00:00.000Z") {
    try {
      const produced = producer();
      this.events.push({
        name,
        value: produced.availability === "OK" ? produced.value : null,
        availability: produced.availability,
        at,
        source,
      });
    } catch (_) {
      this.hookErrors += 1;
      this.events.push({ name, value: null, availability: "UNAVAILABLE", at, source });
    }
    return passthrough;
  }
  snapshot(name) {
    for (let i = this.events.length - 1; i >= 0; i -= 1) {
      if (this.events[i].name === name) return this.events[i];
    }
    return null;
  }
}

const cap = new FeatureCapture();
const score = { total: 0.42 };
const out = cap.observe("score.total", "scoring-engine", score, () => ({
  value: score.total,
  availability: "OK",
}));
assert.equal(out, score);
assert.equal(cap.snapshot("score.total").value, 0.42);

const stale = cap.observe("mark.px", "quote", 99, () => ({ value: null, availability: "STALE" }));
assert.equal(stale, 99);
assert.equal(cap.snapshot("mark.px").value, null);
assert.equal(cap.snapshot("mark.px").availability, "STALE");

const passthrough = { keep: true };
const afterThrow = cap.observe("bad.hook", "probe", passthrough, () => {
  throw new Error("boom");
});
assert.equal(afterThrow, passthrough);
assert.equal(cap.hookErrors, 1);
assert.equal(cap.snapshot("bad.hook").availability, "UNAVAILABLE");
assert.equal(cap.snapshot("missing"), null);

console.log("Wave 10 feature capture unit checks: PASS");
