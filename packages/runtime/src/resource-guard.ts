/**
 * Wave O4 — Resource bounds, leak guards, WS reconnect hygiene.
 * Reconnect uses jitter + rate limit. Not 24/7 evidence (O5). Not LIVE.
 */

export interface ResourceBounds {
  maxWsSockets: number;
  maxReconnectsPerWindow: number;
  reconnectWindowMs: number;
  reconnectBaseMs: number;
  reconnectCapMs: number;
  jitterRatio: number;
  idleWatchdogMs: number;
}

export const DEFAULT_O4_BOUNDS: ResourceBounds = {
  maxWsSockets: 4,
  maxReconnectsPerWindow: 10,
  reconnectWindowMs: 60_000,
  reconnectBaseMs: 500,
  reconnectCapMs: 15_000,
  jitterRatio: 0.25,
  idleWatchdogMs: 30_000,
};

export class ResourceGuard {
  sockets = 0;
  reconnectAt: number[] = [];
  lastMessageAt: number | null = null;
  closed = false;

  constructor(
    private readonly bounds: ResourceBounds = DEFAULT_O4_BOUNDS,
    private readonly now: () => number = Date.now,
    private readonly random: () => number = Math.random,
  ) {}

  openSocket(): boolean {
    if (this.closed) return false;
    if (this.sockets >= this.bounds.maxWsSockets) return false;
    this.sockets += 1;
    this.lastMessageAt = this.now();
    return true;
  }

  closeSocket(): void {
    this.sockets = Math.max(0, this.sockets - 1);
  }

  noteMessage(): void {
    this.lastMessageAt = this.now();
  }

  idleStalled(): boolean {
    if (this.lastMessageAt === null) return false;
    return this.now() - this.lastMessageAt >= this.bounds.idleWatchdogMs;
  }

  canReconnect(): boolean {
    if (this.closed) return false;
    const t = this.now();
    const start = t - this.bounds.reconnectWindowMs;
    this.reconnectAt = this.reconnectAt.filter((ts) => ts >= start);
    return this.reconnectAt.length < this.bounds.maxReconnectsPerWindow;
  }

  nextReconnectDelayMs(attempt: number): number | null {
    if (!this.canReconnect()) return null;
    this.reconnectAt.push(this.now());
    const exp = Math.min(
      this.bounds.reconnectCapMs,
      this.bounds.reconnectBaseMs * 2 ** Math.max(0, attempt - 1),
    );
    const jitter = exp * this.bounds.jitterRatio * (this.random() * 2 - 1);
    return Math.max(0, Math.round(exp + jitter));
  }

  shutdown(): void {
    this.closed = true;
    this.sockets = 0;
  }
}
