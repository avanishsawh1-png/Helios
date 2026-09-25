# Wave C4 — Debug / logging hygiene

- `console.*` / `debugger` forbidden in production modules
- Allowed in `*-gate.cjs` and `*.test.*` (raw gate output)
- No change to trading behavior
- Do not strip ⚠ VERIFY or honest-gap comments
