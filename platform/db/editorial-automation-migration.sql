CREATE TABLE IF NOT EXISTS editorial_settings (
  owner_id text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  cadence text NOT NULL DEFAULT 'manual',
  run_hour smallint NOT NULL DEFAULT 8,
  auto_draft boolean NOT NULL DEFAULT false,
  last_scheduled_at timestamptz,
  running_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT editorial_settings_cadence CHECK (cadence IN ('manual','daily','weekdays','weekly')),
  CONSTRAINT editorial_settings_hour CHECK (run_hour BETWEEN 0 AND 23)
);

CREATE TABLE IF NOT EXISTS editorial_runs (
  id text PRIMARY KEY,
  owner_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running',
  scheduled boolean NOT NULL DEFAULT false,
  found integer NOT NULL DEFAULT 0,
  model text,
  cost_micros integer,
  note text,
  CONSTRAINT editorial_runs_status CHECK (status IN ('running','completed','failed'))
);

CREATE INDEX IF NOT EXISTS idx_editorial_runs_owner_created
  ON editorial_runs(owner_id, created_at DESC);

CREATE TABLE IF NOT EXISTS editorial_ideas (
  id text PRIMARY KEY,
  owner_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  fingerprint text NOT NULL,
  title text NOT NULL,
  angle text NOT NULL,
  why_now text NOT NULL,
  category text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'inbox',
  post_id text,
  CONSTRAINT editorial_ideas_status CHECK (status IN ('inbox','drafted','dismissed')),
  CONSTRAINT editorial_ideas_score CHECK (score BETWEEN 0 AND 100),
  CONSTRAINT editorial_ideas_owner_fingerprint UNIQUE (owner_id, fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_editorial_ideas_owner_status_score
  ON editorial_ideas(owner_id, status, score DESC, created_at DESC);
