CREATE TABLE IF NOT EXISTS prospect_campaigns (
 id text PRIMARY KEY, owner_id text NOT NULL UNIQUE, target text NOT NULL,
 enabled boolean NOT NULL DEFAULT true, next_run_at timestamptz NOT NULL DEFAULT now(),
 running_until timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS prospect_runs (
 id text PRIMARY KEY, campaign_id text NOT NULL REFERENCES prospect_campaigns(id), owner_id text NOT NULL,
 status text NOT NULL CHECK(status IN ('running','completed','failed')), found integer NOT NULL DEFAULT 0,
 note text, created_at timestamptz NOT NULL DEFAULT now(), finished_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_prospect_runs_owner_date ON prospect_runs(owner_id,created_at DESC);
CREATE TABLE IF NOT EXISTS prospect_run_events (
 id text PRIMARY KEY, run_id text NOT NULL REFERENCES prospect_runs(id) ON DELETE CASCADE,
 owner_id text NOT NULL, stage text NOT NULL, status text NOT NULL,
 message text NOT NULL, details jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT prospect_run_events_stage_check CHECK (stage IN ('scout','enrich','verify','save')),
 CONSTRAINT prospect_run_events_status_check CHECK (status IN ('active','completed','failed','skipped'))
);
CREATE INDEX IF NOT EXISTS idx_prospect_run_events_run_date ON prospect_run_events(run_id,created_at);
CREATE INDEX IF NOT EXISTS idx_prospect_run_events_owner_date ON prospect_run_events(owner_id,created_at DESC);
CREATE TABLE IF NOT EXISTS prospect_leads (
 id text PRIMARY KEY, owner_id text NOT NULL, campaign_id text NOT NULL REFERENCES prospect_campaigns(id),
 company text NOT NULL, website text NOT NULL, domain text NOT NULL,
 data jsonb NOT NULL, status text NOT NULL DEFAULT 'new' CHECK(status IN ('new','shortlisted','dismissed','promoted')),
 opportunity_id text UNIQUE, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(owner_id,domain)
);
CREATE INDEX IF NOT EXISTS idx_prospect_leads_owner_status ON prospect_leads(owner_id,status,updated_at DESC);
