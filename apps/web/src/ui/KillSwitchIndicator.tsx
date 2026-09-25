export function KillSwitchIndicator({ value }: { value: string }) {
  const u = value.toUpperCase();
  let cls = "kill-chip";
  if (u.includes("EMERGENCY")) cls += " emergency";
  else if (u.includes("HARD")) cls += " hard";
  else if (u.includes("SOFT")) cls += " soft";
  return (
    <span className={cls} aria-label={`Kill switch ${value}`}>
      KS: {value}
    </span>
  );
}
