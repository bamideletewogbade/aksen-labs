-- Group sends, templates and a stop list for the email desk.
--
-- Additive. A group is several ordinary outbox rows that share a batch_id, one
-- row per person, so every recipient gets their own copy and nobody sees who
-- else was written to. Rows written before this migration have no batch_id and
-- are treated as a group of one.

ALTER TABLE agency_email_outbox ADD COLUMN IF NOT EXISTS batch_id text;
ALTER TABLE agency_email_outbox ADD COLUMN IF NOT EXISTS template_key text;
ALTER TABLE agency_email_outbox ADD COLUMN IF NOT EXISTS recipient_name text;
CREATE INDEX IF NOT EXISTS agency_email_outbox_owner_batch ON agency_email_outbox(owner_id,batch_id);

-- outreach: people we have met or researched but who have not asked us for
-- anything. It always carries the stop line, and the stop list is checked for it.
ALTER TABLE agency_email_outbox DROP CONSTRAINT IF EXISTS agency_email_outbox_purpose_check;
ALTER TABLE agency_email_outbox ADD CONSTRAINT agency_email_outbox_purpose_check CHECK (purpose IN ('service','test','outreach'));

-- suppressed: the address joined the stop list between saving and sending.
-- discarded: a draft the owner threw away. Kept, never deleted, like every row here.
ALTER TABLE agency_email_outbox DROP CONSTRAINT IF EXISTS agency_email_outbox_status_check;
ALTER TABLE agency_email_outbox ADD CONSTRAINT agency_email_outbox_status_check CHECK (status IN ('draft','sending','sent','uncertain','suppressed','discarded'));

-- Anyone who replies "stop". Shared across owners on purpose: a person who asked
-- one of us to stop has asked the business to stop.
CREATE TABLE IF NOT EXISTS email_suppressions (
 email text PRIMARY KEY,
 reason text NOT NULL DEFAULT 'asked_to_stop',
 added_by text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
