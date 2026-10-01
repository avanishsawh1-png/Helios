# Wave 13 — Agent runtime + tier contracts

- `AGENTS_ENABLED` default false → run status `DISABLED`
- `FakeLlmClient` default; live model only if an operator injects one
- Per-tier budgets (steps / tool calls / tokens / USD/day)
- Prompt version + SHA-256 recorded on every run
- Shell / wallet / signer tools are out of contract (`BOUNDARY`)
- Narration cannot apply config or place orders
