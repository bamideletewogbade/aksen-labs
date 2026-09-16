-- A durable outbox for everything this business sends, and an intake key that
-- makes capturing a lead safe to retry.
--
-- Before this, a notification was a fetch inside the request that captured the
-- lead. If Resend was slow the visitor waited for it; if Resend was down the
-- notice was lost and the only trace was an audit row nobody reads. One
-- provider outage meant one silently unanswered customer, which is the exact
-- failure the enquiry loop exists to prevent.
--
-- Additive only. Safe to run twice.

CREATE TABLE IF NOT EXISTS message_outbox (
  id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- email today. whatsapp and sms become rows with a different channel rather
  -- than a second delivery path with its own retry rules to get wrong.
  channel text NOT NULL DEFAULT 'email',
  -- What makes a retry safe. Caller-supplied and stable, so the same event
  -- enqueued twice is one message.
  dedupe_key text NOT NULL UNIQUE,
  recipient text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  -- queued -> sending -> sent, or back to queued until attempts run out and it
  -- becomes abandoned. Nothing is ever deleted; a message that was never
  -- delivered is a business fact worth keeping.
  status text NOT NULL DEFAULT 'queued',
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  last_error text,
  provider_receipt text,
  entity_type text,
  entity_id text,
  owner_id text,
  sent_at timestamptz
);

-- The drain query reads exactly this: what is due, oldest first.
CREATE INDEX IF NOT EXISTS idx_outbox_due
  ON message_outbox (status, next_attempt_at);

-- "What did we ever send this person about this enquiry" has to be one lookup,
-- or nobody will check it before replying.
CREATE INDEX IF NOT EXISTS idx_outbox_entity
  ON message_outbox (entity_type, entity_id);

-- Retry safety for the capture itself. A visitor whose connection drops after
-- the insert but before the response will press the button again; without this
-- that is a second lead, a second notification and a founder who cannot tell
-- which is real.
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS intake_key text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_opportunities_intake_key
  ON opportunities (intake_key)
  WHERE intake_key IS NOT NULL;

-- Which mechanism produced this lead. The column already existed and defaults
-- to the mapper; the index is what makes "how many leads did the free tools
-- produce this month" answerable, which is the question the revenue ledger asks.
CREATE INDEX IF NOT EXISTS idx_opportunities_source_created
  ON opportunities (source, created_at);
