export type StatusKind = "ok" | "empty" | "unavailable" | "stale" | "error" | "loading";

const LABELS: Record<StatusKind, string> = {
  ok: "OK",
  empty: "EMPTY",
  unavailable: "UNAVAILABLE",
  stale: "STALE",
  error: "ERROR",
  loading: "LOADING",
};

export function StatusBadge({ kind }: { kind: StatusKind }) {
  return <span className={`status-badge ${kind}`}>{LABELS[kind]}</span>;
}
