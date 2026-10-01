/**
 * Wave O1 — Process lifecycle: crash hygiene + graceful drain.
 * Does not claim 24/7 readiness (O5). Does not authorize LIVE.
 */

export type ShutdownPhase = "running" | "draining" | "stopped";

export interface ShutdownHooks {
  /** Stop accepting new work (HTTP server.close, worker pause). */
  stopAccepting: () => Promise<void> | void;
  /** Wait for in-flight requests/cycles to finish. */
  drainInFlight: () => Promise<void> | void;
  now?: () => number;
  exit?: (code: number) => void;
  log?: (msg: string, extra?: Record<string, unknown>) => void;
}

export interface LifecycleOptions {
  drainTimeoutMs: number;
  maxCrashes: number;
}

export const DEFAULT_O1_OPTIONS: LifecycleOptions = {
  drainTimeoutMs: 10_000,
  maxCrashes: 5,
};

export class ProcessLifecycle {
  phase: ShutdownPhase = "running";
  crashCount = 0;
  lastSignal: string | null = null;
  private shuttingDown = false;

  constructor(
    private readonly hooks: ShutdownHooks,
    private readonly options: LifecycleOptions = DEFAULT_O1_OPTIONS,
  ) {}

  get accepting(): boolean {
    return this.phase === "running";
  }

  recordCrash(reason: string): number {
    this.crashCount += 1;
    this.hooks.log?.("crash_recorded", { reason, crashCount: this.crashCount });
    if (this.crashCount >= this.options.maxCrashes) {
      this.hooks.log?.("crash_loop_limit", { crashCount: this.crashCount });
    }
    return this.crashCount;
  }

  shouldHaltForCrashLoop(): boolean {
    return this.crashCount >= this.options.maxCrashes;
  }

  async handleSignal(signal: string): Promise<void> {
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
    const timeout = new Promise<"timeout">((resolve) => {
      const t = setTimeout(() => resolve("timeout"), this.options.drainTimeoutMs);
      if (typeof t.unref === "function") t.unref();
    });
    const winner = await Promise.race([drain.then(() => "drained" as const), timeout]);
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

export function installProcessHandlers(
  life: ProcessLifecycle,
  proc: {
    on: (ev: string, fn: (...args: unknown[]) => void) => void;
  } = process,
): void {
  const onSig = (sig: string) => {
    void life.handleSignal(sig);
  };
  proc.on("SIGTERM", () => onSig("SIGTERM"));
  proc.on("SIGINT", () => onSig("SIGINT"));
  proc.on("uncaughtException", (err) => {
    life.recordCrash(err instanceof Error ? err.message : String(err));
    void life.handleSignal("uncaughtException");
  });
  proc.on("unhandledRejection", (reason) => {
    life.recordCrash(reason instanceof Error ? reason.message : String(reason));
    void life.handleSignal("unhandledRejection");
  });
}
