/**
 * Wave 8 — PAPER mode gate.
 *
 * The pipeline worker must never start when TRADING_MODE is LIVE.
 * Section 70 / live execution is out of scope for this worker entirely.
 */

export type TradingModeValue = "LIVE" | "PAPER" | "DRY_RUN" | "TESTNET" | string;

export class LiveModeRefusedError extends Error {
  readonly code = "LIVE_MODE_REFUSED" as const;

  constructor(mode: string) {
    super(
      `Pipeline worker refuses to start when TRADING_MODE=${mode}. ` +
        `Only PAPER (or DRY_RUN/TESTNET) is allowed. LIVE requires Section 70 human gate — not this worker.`,
    );
    this.name = "LiveModeRefusedError";
  }
}

/**
 * Assert the process is not in LIVE mode. Call before PipelineWorker.start().
 */
export function assertPaperMode(
  mode: TradingModeValue | undefined | null = process.env.TRADING_MODE,
): void {
  const normalized = (mode ?? "PAPER").toString().trim().toUpperCase();
  if (normalized === "LIVE") {
    throw new LiveModeRefusedError(normalized);
  }
}

export function isPaperSafeMode(
  mode: TradingModeValue | undefined | null = process.env.TRADING_MODE,
): boolean {
  const normalized = (mode ?? "PAPER").toString().trim().toUpperCase();
  return normalized !== "LIVE";
}
