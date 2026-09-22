CREATE TABLE IF NOT EXISTS media_jev_evaluations (
  id text PRIMARY KEY,
  owner_id text NOT NULL,
  reference_url text NOT NULL,
  state jsonb NOT NULL,
  status text NOT NULL,
  provider text NOT NULL DEFAULT 'none',
  model text,
  prompt_version text NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  suggestion text,
  selected_angle text,
  input_tokens integer,
  output_tokens integer,
  latency_ms integer,
  cost_micros integer,
  outcome jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_media_jev_owner_created ON media_jev_evaluations (owner_id, created_at);
-- statement-breakpoint
ALTER TABLE media_jev_evaluations ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'none';
-- statement-breakpoint
ALTER TABLE media_episodes ADD COLUMN IF NOT EXISTS origin_evaluation_id text;
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_media_episodes_origin_evaluation ON media_episodes (origin_evaluation_id) WHERE origin_evaluation_id IS NOT NULL;
