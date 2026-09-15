CREATE TABLE IF NOT EXISTS feedback_triage_settings (
 id text PRIMARY KEY,
 enabled boolean NOT NULL DEFAULT true,
 max_per_day integer NOT NULL DEFAULT 40,
 last_run_at timestamptz,
 last_note text,
 running_until timestamptz,
 updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO feedback_triage_settings (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;
CREATE INDEX IF NOT EXISTS idx_feedback_ideas_untriaged ON feedback_ideas(triaged_at, created_at) WHERE triaged_at IS NULL
