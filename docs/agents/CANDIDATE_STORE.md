# Wave 21 — Candidate persistence & provider

- Only ACCEPTED_CANDIDATE rows persist
- Stored rows start `active: false`
- Provider `currentActive()` is null until a later human gate
- `activate()` throws in this wave
