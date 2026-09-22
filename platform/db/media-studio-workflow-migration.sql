ALTER TABLE media_episodes ADD COLUMN IF NOT EXISTS channel_posts jsonb NOT NULL DEFAULT '{}'::jsonb;
-- statement-breakpoint
ALTER TABLE media_episodes ADD COLUMN IF NOT EXISTS proof_checks jsonb NOT NULL DEFAULT '[]'::jsonb;
