# Wave 25 — Replay harness

- Sort by event time
- Train = strictly before cutoff; validate = on/after
- Null values stay null
- `kFoldSplit` / `randomSplit` throw (G17)
- Replay does not write orders or activate presets
