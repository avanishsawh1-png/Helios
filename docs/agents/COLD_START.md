# Wave 28 — Cold-start & untrusted input

- historyN < 5 → `cold_start` cohort, excluded from headline set
- `laterPrice === null` → `dead_no_later_price` (kept in denominator as its own class)
- Token symbols sanitized before any prompt use
- No blending of cold-start into established metrics
