-- Reviewing what an automation found, and deciding when it runs.
--
-- Two gaps this closes.
--
-- A found lead recorded only its campaign, so once searching runs on its own
-- there was no way to ask what last night produced. Reviewing a queue you did
-- not watch being filled is the whole job, and "which run was this" is the
-- first question of it.
--
-- And the cadence was a hardcoded interval in application code: on finishing,
-- a run set next_run_at to the next midnight. Nothing read it, nothing could
-- change it, and the interface admitted as much by saying recurring execution
-- required a scheduler that did not exist.

ALTER TABLE prospect_leads
  ADD COLUMN IF NOT EXISTS run_id text;

-- Leads found before this change keep a null run, which is honest: they were
-- found, but which run found them was never recorded and cannot be recovered.
CREATE INDEX IF NOT EXISTS idx_prospect_leads_run
  ON prospect_leads(run_id, created_at DESC);

ALTER TABLE prospect_campaigns
  -- manual: only when someone presses the button. The default, because an
  -- automation nobody asked for that spends model credits is a worse surprise
  -- than one that never starts.
  ADD COLUMN IF NOT EXISTS cadence text NOT NULL DEFAULT 'manual',
  -- Hour of day in UTC. Accra is UTC, so for the founder this is local time;
  -- Lagos is one hour ahead. Stored as UTC so a timezone change never silently
  -- moves an existing schedule.
  ADD COLUMN IF NOT EXISTS run_hour smallint NOT NULL DEFAULT 9,
  -- A ceiling on automated runs per day, separate from the daily research
  -- allowance. The allowance stops runaway spend; this stops a schedule that
  -- is more eager than intended.
  ADD COLUMN IF NOT EXISTS max_per_day smallint NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_scheduled_at timestamptz;

ALTER TABLE prospect_campaigns
  DROP CONSTRAINT IF EXISTS prospect_campaigns_cadence_check;

ALTER TABLE prospect_campaigns
  ADD CONSTRAINT prospect_campaigns_cadence_check
  CHECK (cadence IN ('manual', 'daily', 'weekdays', 'weekly'));

ALTER TABLE prospect_campaigns
  DROP CONSTRAINT IF EXISTS prospect_campaigns_run_hour_check;

ALTER TABLE prospect_campaigns
  ADD CONSTRAINT prospect_campaigns_run_hour_check
  CHECK (run_hour BETWEEN 0 AND 23);

ALTER TABLE prospect_campaigns
  DROP CONSTRAINT IF EXISTS prospect_campaigns_max_per_day_check;

ALTER TABLE prospect_campaigns
  ADD CONSTRAINT prospect_campaigns_max_per_day_check
  CHECK (max_per_day BETWEEN 1 AND 6);
