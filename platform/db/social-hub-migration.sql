-- Social Hub data belongs to the signed-in workspace owner. The JSON objects
-- are small, read as a whole, and changed together, so keeping them on the
-- existing one-row-per-owner settings record avoids another join and another
-- permissions surface.
ALTER TABLE workspace_settings
  ADD COLUMN IF NOT EXISTS social_profiles jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS social_context jsonb NOT NULL DEFAULT '{}'::jsonb;

-- statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'workspace_settings_social_profiles_object'
      AND conrelid = 'workspace_settings'::regclass
  ) THEN
    ALTER TABLE workspace_settings
      ADD CONSTRAINT workspace_settings_social_profiles_object
      CHECK (jsonb_typeof(social_profiles) = 'object');
  END IF;
END $$;

-- statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'workspace_settings_social_context_object'
      AND conrelid = 'workspace_settings'::regclass
  ) THEN
    ALTER TABLE workspace_settings
      ADD CONSTRAINT workspace_settings_social_context_object
      CHECK (jsonb_typeof(social_context) = 'object');
  END IF;
END $$;
