CREATE TABLE IF NOT EXISTS scoring_policy_versions (
  policy_version TEXT PRIMARY KEY,
  weights_json TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS scoring_policy_one_active
  ON scoring_policy_versions (active)
  WHERE active = TRUE;
