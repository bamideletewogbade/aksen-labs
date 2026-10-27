CREATE TABLE IF NOT EXISTS prospect_outreach (
 id text PRIMARY KEY,
 owner_id text NOT NULL,
 lead_id text NOT NULL REFERENCES prospect_leads(id),
 brief jsonb NOT NULL,
 model text NOT NULL,
 outbox_id text REFERENCES agency_email_outbox(id),
 response_status text NOT NULL DEFAULT 'not_recorded'
   CHECK (response_status IN ('not_recorded','interested','not_now','not_interested','do_not_contact')),
 response_note text NOT NULL DEFAULT '',
 next_action text NOT NULL DEFAULT '',
 followup_date date,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(owner_id,lead_id)
);
CREATE INDEX IF NOT EXISTS prospect_outreach_owner_followup ON prospect_outreach(owner_id,followup_date);
