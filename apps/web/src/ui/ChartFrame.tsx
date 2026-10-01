/**
 * Lightweight chart wrapper — no third-party chart library.
 *
 * Why: control-plane currently has no time-series DTOs on apps/api; adding
 * recharts/chart.js would imply data we cannot back. This SVG frame renders
 * numeric series with **null as gaps** (never coerced to 0).
 */

export function ChartFrame({
  values,
  height = 120,
  label = "Series",
}: {
  /** null/undefined = gap (not zero) */
  values: Array<number | null | undefined>;
  height?: number;
  label?: string;
}) {
  const width = 320;
  const nums = values
    .map((v, i) => ({ i, v: v === null || v === undefined || !Number.isFinite(v) ? null : v }))
    .filter((p) => p.v !== null) as Array<{ i: number; v: number }>;

  if (nums.length < 2) {
    return (
      <div className="data-state empty" role="img" aria-label={label}>
        Not enough points to chart
      </div>
    );
  }

  const min = Math.min(...nums.map((p) => p.v));
  const max = Math.max(...nums.map((p) => p.v));
  const span = max - min || 1;
  const n = values.length;

  const path: string[] = [];
  let drawing = false;
  values.forEach((raw, i) => {
    if (raw === null || raw === undefined || !Number.isFinite(raw)) {
      drawing = false;
      return;
    }
    const x = (i / Math.max(1, n - 1)) * (width - 8) + 4;
    const y = height - 4 - ((raw - min) / span) * (height - 8);
    if (!drawing) {
      path.push(`M ${x} ${y}`);
      drawing = true;
    } else {
      path.push(`L ${x} ${y}`);
    }
  });

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label}
      style={{ display: "block", maxWidth: width }}
    >
      <path d={path.join(" ")} fill="none" stroke="var(--accent)" strokeWidth="2" />
    </svg>
  );
}
