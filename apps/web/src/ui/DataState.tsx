import type { ReactNode } from "react";
import type { UiAvailability } from "./types.js";
import { StatusBadge } from "./StatusBadge.js";
import { FreshnessStamp } from "./FreshnessStamp.js";

export interface DataStateProps<T> {
  state: UiAvailability<T>;
  /** Render payload for OK and STALE */
  children: (data: T) => ReactNode;
  loadingLabel?: string;
}

/**
 * The ONLY supported way a panel renders availability.
 * EMPTY and UNAVAILABLE use distinct visuals.
 */
export function DataState<T>({
  state,
  children,
  loadingLabel = "Loading…",
}: DataStateProps<T>) {
  if (state.status === "loading") {
    return (
      <div className="data-state loading" aria-busy="true">
        <StatusBadge kind="loading" /> {loadingLabel}
      </div>
    );
  }
  if (state.status === "EMPTY") {
    return (
      <div className="data-state empty" role="status">
        <StatusBadge kind="empty" /> {state.reason}
        {state.asOf ? <FreshnessStamp asOf={state.asOf} /> : null}
      </div>
    );
  }
  if (state.status === "UNAVAILABLE") {
    return (
      <div className="data-state unavailable" role="status">
        <StatusBadge kind="unavailable" /> {state.reason}
      </div>
    );
  }
  if (state.status === "error") {
    return (
      <div className="data-state error" role="alert">
        <StatusBadge kind="error" /> {state.reason}
      </div>
    );
  }
  if (state.status === "STALE") {
    return (
      <div className="data-state">
        <div className="data-state stale-banner" role="status">
          <StatusBadge kind="stale" /> {state.staleReason}
          {state.asOf ? <FreshnessStamp asOf={state.asOf} stale /> : null}
        </div>
        {children(state.data)}
      </div>
    );
  }
  // OK
  return (
    <div className="data-state">
      {state.asOf ? <FreshnessStamp asOf={state.asOf} /> : null}
      {children(state.data)}
    </div>
  );
}
