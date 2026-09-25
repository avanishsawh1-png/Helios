const assert = require("node:assert/strict");

class ProcessLifecycle {
  phase = "running";
  crashCount = 0;
  lastSignal = null;
  shuttingDown = false;
  constructor(hooks, options = { drainTimeoutMs: 50, maxCrashes: 3 }) {
    this.hooks = hooks;
    this.options = options;
  }
  get accepting() {
    return this.phase === "running";
  }
  recordCrash(reason) {
    this.crashCount += 1;
    this.hooks.log && this.hooks.log("crash_recorded", { reason, crashCount: this.crashCount });
    return this.crashCount;
  }
  shouldHaltForCrashLoop() {
    return this.crashCount >= this.options.maxCrashes;
  }
  async handleSignal(signal) {
    this.lastSignal = signal;
    if (this.shuttingDown) return;
    this.shuttingDown = true;
    this.phase = "draining";
    await this.hooks.stopAccepting();
    const drain = Promise.resolve(this.hooks.drainInFlight());
    const timeout = new Promise((resolve) => setTimeout(() => resolve("timeout"), this.options.drainTimeoutMs));
    await Promise.race([drain.then(() => "drained"), timeout]);
    this.phase = "stopped";
    if (this.hooks.exit) this.hooks.exit(0);
  }
}

const logs = [];
let closed = false;
let inFlight = 2;
let exitCode = null;

const life = new ProcessLifecycle({
  stopAccepting() {
    closed = true;
  },
  async drainInFlight() {
    while (inFlight > 0) {
      inFlight -= 1;
      await new Promise((r) => setTimeout(r, 1));
    }
  },
  log(msg, extra) {
    logs.push({ msg, extra });
  },
  exit(code) {
    exitCode = code;
  },
});

async function main() {
assert.equal(life.accepting, true);
await life.handleSignal("SIGTERM");
assert.equal(closed, true);
assert.equal(inFlight, 0);
assert.equal(life.phase, "stopped");
assert.equal(life.accepting, false);
assert.equal(exitCode, 0);
assert.equal(life.lastSignal, "SIGTERM");

life.recordCrash("boom1");
life.recordCrash("boom2");
assert.equal(life.shouldHaltForCrashLoop(), false);
life.recordCrash("boom3");
assert.equal(life.shouldHaltForCrashLoop(), true);

const slow = new ProcessLifecycle(
  {
    stopAccepting() {},
    drainInFlight() {
      return new Promise(() => {});
    },
    exit() {},
  },
  { drainTimeoutMs: 20, maxCrashes: 5 },
);
const started = Date.now();
await slow.handleSignal("SIGINT");
assert.ok(Date.now() - started < 200);
assert.equal(slow.phase, "stopped");

console.log("O1 process lifecycle unit checks: PASS");
}
main();
