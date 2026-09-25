# Wave 20 — Preset validation core

Hard limits are code constants. A candidate may only tighten or stay inside them.

- Larger size / exposure / daily loss than hard → REJECTED_EXCEEDS_HARD
- Stop looser than hard min → REJECTED_EXCEEDS_HARD
- `applyPreset` throws; promotion is later and human-gated
