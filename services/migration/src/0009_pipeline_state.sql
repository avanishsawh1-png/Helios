-- S3 pipeline execution state. No LIVE flags stored as true.
CREATE TABLE IF NOT EXISTS pipeline_cycles (
  cycle_id TEXT PRIMARY KEY,
  paper_executed BOOLEAN NOT NULL DEFAULT FALSE,
  live_submitted BOOLEAN NOT NULL DEFAULT FALSE,
  last_slot BIGINT,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pipeline_positions (
  run_id TEXT PRIMARY KEY,
  mint TEXT,
  mark_status TEXT,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
