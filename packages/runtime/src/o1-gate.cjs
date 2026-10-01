const assert = require("node:assert/strict");
const path = require("node:path");

async function main() {
  const { ProcessLifecycle } = await import(path.resolve(__dirname, "./graceful-shutdown.mjs"));
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
  }, { drainTimeoutMs: 50, maxCrashes: 3 });

  assert.equal(life.accepting, true);
  await life.handleSignal("SIGTERM");
  assert.equal(closed, true);
  assert.equal(inFlight, 0);
  assert.equal(life.phase, "stopped");
  assert.equal(exitCode, 0);

  life.recordCrash("boom1");
  life.recordCrash("boom2");
  assert.equal(life.shouldHaltForCrashLoop(), false);
  life.recordCrash("boom3");
  assert.equal(life.shouldHaltForCrashLoop(), true);

  const slow = new ProcessLifecycle(
    { stopAccepting() {}, drainInFlight() { return new Promise(() => {}); }, exit() {} },
    { drainTimeoutMs: 20, maxCrashes: 5 },
  );
  await slow.handleSignal("SIGINT");
  assert.equal(slow.phase, "stopped");
  console.log("O1 process lifecycle unit checks: PASS imported_graceful-shutdown.mjs");
}

main();
