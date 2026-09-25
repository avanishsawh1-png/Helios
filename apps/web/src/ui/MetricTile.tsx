import { formatUnknown } from "./types.js";

export function MetricTile({
  label,
  value,
}: {
  label: string;
  value: number | string | null | undefined;
}) {
  return (
    <div className="metric-tile">
      <div className="label">{label}</div>
      <div className="value">{formatUnknown(value)}</div>
    </div>
  );
}
