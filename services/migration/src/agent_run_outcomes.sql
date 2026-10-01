-- Stage 3 §15 — outcomes linked to scoring runs.
-- Apply on the real VPS via operator migrate; this file is the contract.

CREATE TABLE IF NOT EXISTS agent_run_outcomes (
  run_id TEXT PRIMARY KEY,
  policy_version TEXT NOT NULL,
  realized_pnl_pct DOUBLE PRECISION,
  pnl_availability TEXT NOT NULL CHECK (pnl_availability IN ('OK', 'EMPTY', 'UNAVAILABLE', 'INSUFFICIENT_SAMPLE')),
  exit_reason TEXT,
  time_in_position_ms BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS agent_run_outcomes_policy_idx
  ON agent_run_outcomes (policy_version);
