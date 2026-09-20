CREATE TABLE IF NOT EXISTS media_episodes (
  id text PRIMARY KEY,
  owner_id text NOT NULL,
  title text NOT NULL,
  topic text NOT NULL DEFAULT '',
  script text NOT NULL DEFAULT '',
  scenes jsonb NOT NULL DEFAULT '[]'::jsonb,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  aspect_ratio text NOT NULL DEFAULT '9:16',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT media_episodes_scenes_array CHECK (jsonb_typeof(scenes) = 'array'),
  CONSTRAINT media_episodes_sources_array CHECK (jsonb_typeof(sources) = 'array')
);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_media_episodes_owner_updated
  ON media_episodes(owner_id, updated_at);

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS media_render_jobs (
  id text PRIMARY KEY,
  owner_id text NOT NULL,
  provider_job_id text NOT NULL,
  model text NOT NULL,
  prompt text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  polling_url text NOT NULL,
  output_url text,
  error text,
  cost_micros integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_media_render_jobs_owner_created
  ON media_render_jobs(owner_id, created_at);
-- statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS idx_media_render_jobs_owner_provider
  ON media_render_jobs(owner_id, provider_job_id);
