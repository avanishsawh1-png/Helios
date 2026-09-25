# Stage 3 §16 — Policy evaluation

Per `policy_version`:

- nTotal vs nPnlOk (UNAVAILABLE/EMPTY excluded from averages)
- winRate, avgPnlPct, falsePositiveRate, maxDrawdownPct
- nPnlOk < 20 → INSUFFICIENT_SAMPLE (not a promotion signal)
- Does not write scoring weights or LIVE flags
