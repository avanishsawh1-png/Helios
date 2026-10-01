# Live engine (gate closed)

`services/execution` is wired:

- `evaluateLiveGate` requires all six Section 70 preconditions + `liveModeEnabled`
- Default state is **closed** (`loadSection70FromEnv` ignores env LIVE)
- `LiveExecutionEngine.execute` returns `submitted: false` when the gate is closed
- `RefusingTransactionSigner` loads no keys
- Even a hypothetically open gate does not broadcast in this handoff

This is wiring, not activation.
