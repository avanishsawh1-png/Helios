/**
 * Wave D2 — availability states aligned with control-plane DataAvailability.
 * EMPTY ≠ UNAVAILABLE. null numerics render as "—", never 0.
 */

export type UiAvailabilityStatus =
  | "loading"
  | "OK"
  | "EMPTY"
  | "UNAVAILABLE"
  | "STALE"
  | "error";

export type UiAvailability<T> =
  | { status: "loading" }
  | { status: "OK"; data: T; asOf?: string }
  | { status: "EMPTY"; reason: string; asOf?: string }
  | { status: "UNAVAILABLE"; reason: string }
  | { status: "STALE"; data: T; asOf?: string; staleReason: string }
  | { status: "error"; reason: string };

export type TradingModeUi = "LIVE" | "PAPER" | "DRY_RUN" | "TESTNET" | "STOPPED";

export function formatUnknown(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number" && !Number.isFinite(value)) return "—";
  return String(value);
}

export function normalizeMode(raw: string | null | undefined): TradingModeUi {
  if (!raw) return "STOPPED";
  const u = raw.toUpperCase().replace(/\s+/g, "_");
  if (u === "LIVE") return "LIVE";
  if (u === "PAPER") return "PAPER";
  if (u === "DRY_RUN" || u === "DRYRUN") return "DRY_RUN";
  if (u === "TESTNET") return "TESTNET";
  return "STOPPED";
}
