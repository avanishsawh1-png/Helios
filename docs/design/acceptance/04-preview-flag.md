# 04 — Production build excludes preview fixtures

## Mechanism

```ts
// apps/web/src/pages/Dashboard.tsx
const FIXTURE_MODE = import.meta.env.VITE_HELIOS_DESIGN_PREVIEW === "1";
```

- Default: env unset → `FIXTURE_MODE === false` → no fixture banner  
- Preview: `VITE_HELIOS_DESIGN_PREVIEW=1` at **build/dev** time only  

## Automated proof

Unit test (Wave D4):

```
production default excludes fixture mode → process.env.VITE_HELIOS_DESIGN_PREVIEW === "1" is false
```

**Passed** in session.

## Production build command (operator)

```bash
cd apps/web
# ensure VITE_HELIOS_DESIGN_PREVIEW is unset
pnpm build
grep -R "FIXTURE DATA" dist/ && echo FAIL || echo OK_no_fixture_string_or_only_in_dead_code
```

Full `pnpm build` **not executed** in-agent (install limits).
