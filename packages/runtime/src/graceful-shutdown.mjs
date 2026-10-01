export const DEFAULT_O1_OPTIONS = {
  drainTimeoutMs: 10_000,
  maxCrashes: 5,
};

export class ProcessLifecycle {
  constructor(hooks, options = DEFAULT_O1_OPTIONS) {
    this.hooks = hooks;
    this.options = options;
    this.phase = "running";
    this.crashCount = 0;
    this.lastSignal = null;
    this.shuttingDown = false;
  }

  get accepting() {
    return this.phase === "running";
  }

  recordCrash(reason) {
    this.crashCount += 1;
    this.hooks.log?.("crash_recorded", { reason, crashCount: this.crashCount });
    if (this.crashCount >= this.options.maxCrashes) {
      this.hooks.log?.("crash_loop_limit", { crashCount: this.crashCount });
    }
    return this.crashCount;
  }

  shouldHaltForCrashLoop() {
    return this.crashCount >= this.options.maxCrashes;
  }

  async handleSignal(signal) {
    this.lastSignal = signal;
    if (this.shuttingDown) {
      this.hooks.log?.("duplicate_signal_ignored", { signal });
      return;
    }
    this.shuttingDown = true;
    this.phase = "draining";
    this.hooks.log?.("graceful_drain_start", { signal });
    await this.hooks.stopAccepting();
    const started = (this.hooks.now ?? Date.now)();
    const drain = Promise.resolve(this.hooks.drainInFlight());
    const timeout = new Promise((resolve) => {
      const t = setTimeout(() => resolve("timeout"), this.options.drainTimeoutMs);
      if (typeof t.unref === "function") t.unref();
    });
    const winner = await Promise.race([drain.then(() => "drained"), timeout]);
    if (winner === "timeout") {
      this.hooks.log?.("drain_timeout", { drainTimeoutMs: this.options.drainTimeoutMs });
    }
    this.phase = "stopped";
    this.hooks.log?.("graceful_drain_complete", {
      signal,
      elapsedMs: (this.hooks.now ?? Date.now)() - started,
      winner,
    });
    this.hooks.exit?.(0);
  }
}
