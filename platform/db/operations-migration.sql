CREATE TABLE IF NOT EXISTS agency_email_outbox (
 id text PRIMARY KEY,
 owner_id text NOT NULL,
 recipient text NOT NULL,
 subject text NOT NULL,
 body text NOT NULL,
 purpose text NOT NULL CHECK (purpose IN ('service','test')),
 relationship_note text NOT NULL,
 status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sending','sent','uncertain')),
 provider_id text,
 created_at timestamptz NOT NULL DEFAULT now(),
 sent_at timestamptz
);
CREATE INDEX IF NOT EXISTS agency_email_outbox_owner_created ON agency_email_outbox(owner_id,created_at DESC);

CREATE INDEX IF NOT EXISTS agency_operations_drafts_owner_created ON agent_runs ((trace->>'ownerId'),created_at DESC) WHERE channel='operations';
