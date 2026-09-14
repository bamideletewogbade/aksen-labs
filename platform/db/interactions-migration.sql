CREATE TABLE IF NOT EXISTS lead_interactions (
  id text PRIMARY KEY,
  opportunity_id text NOT NULL,
  owner_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  occurred_at date NOT NULL DEFAULT CURRENT_DATE,
  channel text NOT NULL DEFAULT 'other',
  direction text NOT NULL DEFAULT 'outbound',
  summary text NOT NULL,
  shared text
)
;
CREATE INDEX IF NOT EXISTS idx_lead_interactions_opportunity
  ON lead_interactions (opportunity_id, occurred_at DESC)
;
CREATE INDEX IF NOT EXISTS idx_lead_interactions_owner
  ON lead_interactions (owner_id, occurred_at DESC)
