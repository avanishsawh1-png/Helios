/**
 * Wave O3 — Single-instance lock + supervisor crash-loop limits.
 * Process uptime is not LIVE authorization.
 */

export class InstanceLockError extends Error {
  readonly code = "INSTANCE_LOCK_HELD" as const;
  constructor(message = "Another instance already holds the lock") {
    super(message);
    this.name = "InstanceLockError";
  }
}

export interface LockStore {
  tryAcquire(key: string, owner: string): boolean;
  release(key: string, owner: string): void;
  holder(key: string): string | null;
}

export class MemoryLockStore implements LockStore {
  private readonly map = new Map<string, string>();
  tryAcquire(key: string, owner: string): boolean {
    const current = this.map.get(key);
    if (current && current !== owner) return false;
    this.map.set(key, owner);
    return true;
  }
  release(key: string, owner: string): void {
    if (this.map.get(key) === owner) this.map.delete(key);
  }
  holder(key: string): string | null {
    return this.map.get(key) ?? null;
  }
}

export class SingleInstanceGuard {
  constructor(
    private readonly store: LockStore,
    private readonly key: string,
    private readonly owner: string,
  ) {}

  acquire(): void {
    if (!this.store.tryAcquire(this.key, this.owner)) {
      throw new InstanceLockError(`lock ${this.key} held by ${this.store.holder(this.key)}`);
    }
  }

  release(): void {
    this.store.release(this.key, this.owner);
  }
}

export interface SupervisorConfig {
  maxRestarts: number;
  windowMs: number;
  minStableMs: number;
}

export const DEFAULT_O3_SUPERVISOR: SupervisorConfig = {
  maxRestarts: 5,
  windowMs: 60_000,
  minStableMs: 30_000,
};

export type ChildExit = { code: number | null; signal: string | null; ranMs: number };

export class Supervisor {
  readonly restarts: number[] = [];
  halted = false;
  haltReason: string | null = null;

  constructor(
    private readonly cfg: SupervisorConfig = DEFAULT_O3_SUPERVISOR,
    private readonly now: () => number = Date.now,
  ) {}

  recordExit(exit: ChildExit): "restart" | "halt" {
    const t = this.now();
    const stable = exit.ranMs >= this.cfg.minStableMs;
    if (stable) this.restarts.length = 0;
    this.restarts.push(t);
    const windowStart = t - this.cfg.windowMs;
    const recent = this.restarts.filter((ts) => ts >= windowStart);
    this.restarts.splice(0, this.restarts.length, ...recent);
    if (recent.length > this.cfg.maxRestarts) {
      this.halted = true;
      this.haltReason = `crash_loop:${recent.length}>${this.cfg.maxRestarts} in ${this.cfg.windowMs}ms`;
      return "halt";
    }
    return "restart";
  }
}
