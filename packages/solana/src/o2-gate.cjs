const assert = require("node:assert/strict");

function parseRetryAfterMs(header, nowMs = Date.now()) {
  if (!header) return null;
  const trimmed = String(header).trim();
  if (/^\d+$/.test(trimmed)) return Number(trimmed) * 1000;
  const when = Date.parse(trimmed);
  if (Number.isNaN(when)) return null;
  return Math.max(0, when - nowMs);
}

function isRateLimitError(httpStatus, rpcCode) {
  return httpStatus === 429 || httpStatus === 503 || rpcCode === -32005;
}

function isNonRetryableRpcCode(rpcCode) {
  return rpcCode === -32600 || rpcCode === -32601 || rpcCode === -32602;
}

function computeBackoffMs(attempt, retryAfterMs, cfg = { initialMs: 1000, capMs: 30000, jitterRatio: 0.25 }, random = Math.random) {
  if (retryAfterMs !== null && retryAfterMs >= 0) return retryAfterMs;
  const exp = Math.min(cfg.capMs, cfg.initialMs * 2 ** Math.max(0, attempt - 1));
  const jitter = exp * cfg.jitterRatio * (random() * 2 - 1);
  return Math.max(0, Math.round(exp + jitter));
}

class OutboundRpcBudget {
  constructor(cfg = { rps: 10, burst: 2, maxInFlight: 1 }, now = Date.now) {
    this.cfg = cfg;
    this.now = now;
    this.tokens = cfg.burst;
    this.lastRefill = now();
    this.inFlight = 0;
    this.waits = { budget: 0, inFlight: 0 };
  }
  refill() {
    const t = this.now();
    this.tokens = Math.min(this.cfg.burst, this.tokens + ((t - this.lastRefill) / 1000) * this.cfg.rps);
    this.lastRefill = t;
  }
  tryTake() {
    this.refill();
    if (this.inFlight >= this.cfg.maxInFlight) {
      this.waits.inFlight += 1;
      return false;
    }
    if (this.tokens < 1) {
      this.waits.budget += 1;
      return false;
    }
    this.tokens -= 1;
    this.inFlight += 1;
    return true;
  }
  release() {
    this.inFlight = Math.max(0, this.inFlight - 1);
  }
}

assert.equal(parseRetryAfterMs("2"), 2000);
assert.equal(isRateLimitError(429, null), true);
assert.equal(isRateLimitError(200, -32005), true);
assert.equal(isNonRetryableRpcCode(-32602), true);
assert.equal(computeBackoffMs(1, 4000, undefined, () => 0.5), 4000);
const b1 = computeBackoffMs(1, null, undefined, () => 0.5);
assert.ok(b1 >= 750 && b1 <= 1250);
const b4 = computeBackoffMs(6, null, undefined, () => 0.5);
assert.ok(b4 <= 30000 * 1.25);

const budget = new OutboundRpcBudget({ rps: 0, burst: 1, maxInFlight: 1 });
assert.equal(budget.tryTake(), true);
assert.equal(budget.tryTake(), false);
budget.release();
assert.equal(budget.tryTake(), false);
assert.ok(budget.waits.budget >= 1);

async function runCaller() {
  const sleeps = [];
  const primary = {
    name: "primary",
    n: 0,
    async call() {
      this.n += 1;
      return { ok: false, httpStatus: 429, rpcCode: -32005, retryAfterHeader: "0" };
    },
  };
  const backup = {
    name: "backup",
    async call() {
      return { ok: true, httpStatus: 200, rpcCode: null, body: { slot: 1 } };
    },
  };

  async function callAcross(endpoints, budget, sleep) {
    for (const ep of endpoints) {
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        if (!budget.tryTake()) throw new Error("budget");
        try {
          const res = await ep.call();
          if (res.ok) return res.body;
          if (isRateLimitError(res.httpStatus, res.rpcCode)) {
            if (attempt >= 2) break;
            await sleep(computeBackoffMs(attempt, parseRetryAfterMs(res.retryAfterHeader)));
            continue;
          }
          break;
        } finally {
          budget.release();
        }
      }
    }
    throw new Error("ALL_ENDPOINTS_UNAVAILABLE");
  }

  const body = await callAcross([primary, backup], new OutboundRpcBudget({ rps: 100, burst: 10, maxInFlight: 4 }), async (ms) => {
    sleeps.push(ms);
  });
  assert.deepEqual(body, { slot: 1 });
  assert.equal(primary.n, 2);

  let failed = false;
  try {
    await callAcross(
      [
        { name: "a", async call() { return { ok: false, httpStatus: 429, rpcCode: -32005, retryAfterHeader: "0" }; } },
        { name: "b", async call() { return { ok: false, httpStatus: 429, rpcCode: -32005, retryAfterHeader: "0" }; } },
      ],
      new OutboundRpcBudget({ rps: 100, burst: 20, maxInFlight: 4 }),
      async () => {},
    );
  } catch (e) {
    failed = e.message === "ALL_ENDPOINTS_UNAVAILABLE";
  }
  assert.equal(failed, true);
}

runCaller().then(() => {
  console.log("O2 outbound RPC 429 policy unit checks: PASS");
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
