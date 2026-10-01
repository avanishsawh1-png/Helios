const assert = require("node:assert/strict");

class InstanceLockError extends Error {
  constructor(message) {
    super(message);
    this.name = "InstanceLockError";
    this.code = "INSTANCE_LOCK_HELD";
  }
}

class MemoryLockStore {
  constructor() {
    this.map = new Map();
  }
  tryAcquire(key, owner) {
    const current = this.map.get(key);
    if (current && current !== owner) return false;
    this.map.set(key, owner);
    return true;
  }
  release(key, owner) {
    if (this.map.get(key) === owner) this.map.delete(key);
  }
  holder(key) {
    return this.map.get(key) ?? null;
  }
}

class SingleInstanceGuard {
  constructor(store, key, owner) {
    this.store = store;
    this.key = key;
    this.owner = owner;
  }
  acquire() {
    if (!this.store.tryAcquire(this.key, this.owner)) {
      throw new InstanceLockError(`lock ${this.key} held by ${this.store.holder(this.key)}`);
    }
  }
  release() {
    this.store.release(this.key, this.owner);
  }
}

class Supervisor {
  constructor(cfg, now) {
    this.cfg = cfg;
    this.now = now;
    this.restarts = [];
    this.halted = false;
    this.haltReason = null;
  }
  recordExit(exit) {
    const t = this.now();
    if (exit.ranMs >= this.cfg.minStableMs) this.restarts.length = 0;
    this.restarts.push(t);
    const windowStart = t - this.cfg.windowMs;
    const recent = this.restarts.filter((ts) => ts >= windowStart);
    this.restarts.splice(0, this.restarts.length, ...recent);
    if (recent.length > this.cfg.maxRestarts) {
      this.halted = true;
      this.haltReason = `crash_loop:${recent.length}>${this.cfg.maxRestarts}`;
      return "halt";
    }
    return "restart";
  }
}

const store = new MemoryLockStore();
const a = new SingleInstanceGuard(store, "pipeline", "pid-1");
const b = new SingleInstanceGuard(store, "pipeline", "pid-2");
a.acquire();
let locked = false;
try {
  b.acquire();
} catch (e) {
  locked = e.code === "INSTANCE_LOCK_HELD";
}
assert.equal(locked, true);
a.release();
b.acquire();
assert.equal(store.holder("pipeline"), "pid-2");
b.release();
assert.equal(store.holder("pipeline"), null);

let clock = 0;
const sup = new Supervisor({ maxRestarts: 3, windowMs: 1000, minStableMs: 500 }, () => clock);
assert.equal(sup.recordExit({ code: 1, signal: null, ranMs: 10 }), "restart");
clock += 10;
assert.equal(sup.recordExit({ code: 1, signal: null, ranMs: 10 }), "restart");
clock += 10;
assert.equal(sup.recordExit({ code: 1, signal: null, ranMs: 10 }), "restart");
clock += 10;
assert.equal(sup.recordExit({ code: 1, signal: null, ranMs: 10 }), "halt");
assert.equal(sup.halted, true);

clock = 10_000;
const stable = new Supervisor({ maxRestarts: 2, windowMs: 1000, minStableMs: 500 }, () => clock);
assert.equal(stable.recordExit({ code: 0, signal: null, ranMs: 800 }), "restart");
clock += 10;
assert.equal(stable.recordExit({ code: 1, signal: null, ranMs: 10 }), "restart");
assert.equal(stable.halted, false);

console.log("O3 supervisor + single-instance unit checks: PASS");
