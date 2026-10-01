export function FreshnessStamp({
  asOf,
  stale = false,
}: {
  asOf: string;
  stale?: boolean;
}) {
  return (
    <span className="freshness" title={asOf}>
      {stale ? "stale · " : "asOf "}
      {asOf}
    </span>
  );
}
