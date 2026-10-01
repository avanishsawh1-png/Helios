# Wave D5 — Dashboard acceptance package

**Date:** 2026-09-24  
**Rule:** Evidence only. No new application code in this wave.  
**Human sign-off required** before treating the control-plane UI as accepted.

## Contents

| File | Purpose |
|------|---------|
| `01-default-config.md` | Expected DEFAULT (no data source) behavior |
| `02-panel-states.md` | State matrix evidence (unit + design intent) |
| `03-a11y.md` | Keyboard / a11y targets and scan status |
| `04-preview-flag.md` | Proof production excludes design-preview fixtures |
| `05-deviations.md` | Spec vs implementation gaps |
| `06-gate-commands.md` | Commands to run + session results |

## Overall recommendation

```
UI acceptance: NOT SIGNED OFF (agent session)
productionReady: false
Section 70: closed
```

Screenshots against a live `apps/api` + browser were **not** captured in this
agent environment. Operators should attach real screenshots to this folder
before human sign-off.
