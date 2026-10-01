/**
 * Wave O2 — process-wide outbound RPC budget (token bucket).
 * Retries must call take() again — they do not bypass the budget.
 */

export interface BudgetConfig {
  rps: number;
  burst: number;
  maxInFlight: number;
}

export const DEFAULT_O2_BUDGET: BudgetConfig = {
  rps: 10,
  burst: 20,
  maxInFlight: 8,
};

export class OutboundRpcBudget {
  private tokens: number;
  private lastRefill: number;
  private inFlight = 0;
  readonly waits = { budget: 0, inFlight: 0 };

  constructor(
    private readonly cfg: BudgetConfig = DEFAULT_O2_BUDGET,
    private readonly now: () => number = Date.now,
  ) {
    this.tokens = cfg.burst;
    this.lastRefill = now();
  }

  get inFlightCount(): number {
    return this.inFlight;
  }

  private refill(): void {
    const t = this.now();
    const elapsedSec = Math.max(0, (t - this.lastRefill) / 1000);
    this.tokens = Math.min(this.cfg.burst, this.tokens + elapsedSec * this.cfg.rps);
    this.lastRefill = t;
  }

  tryTake(): boolean {
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

  release(): void {
    this.inFlight = Math.max(0, this.inFlight - 1);
  }
}
