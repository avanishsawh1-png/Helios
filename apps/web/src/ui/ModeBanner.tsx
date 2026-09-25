import { normalizeMode, type TradingModeUi } from "./types.js";
import { KillSwitchIndicator } from "./KillSwitchIndicator.js";
import { FreshnessStamp } from "./FreshnessStamp.js";

export function ModeBanner({
  mode,
  killSwitch,
  asOf,
  gatewayLabel,
}: {
  mode: string | null | undefined;
  killSwitch?: string | null;
  asOf?: string | null;
  gatewayLabel?: string;
}) {
  const m: TradingModeUi = normalizeMode(mode);
  const className =
    m === "LIVE"
      ? "live"
      : m === "PAPER"
        ? "paper"
        : m === "DRY_RUN"
          ? "dry"
          : m === "TESTNET"
            ? "testnet"
            : "stopped";

  return (
    <div className="mode-banner" role="status" aria-live="polite">
      <span className={`mode-badge ${className}`} aria-label={`Trading mode ${m}`}>
        {m === "DRY_RUN" ? "DRY RUN" : m}
      </span>
      {killSwitch != null ? <KillSwitchIndicator value={killSwitch} /> : null}
      {gatewayLabel ? (
        <span className="muted" style={{ fontSize: "0.8rem" }}>
          {gatewayLabel}
        </span>
      ) : null}
      {asOf ? <FreshnessStamp asOf={asOf} /> : null}
    </div>
  );
}
