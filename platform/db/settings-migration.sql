-- Workspace settings: the things an operator should be able to change without
-- a deploy. One row per workspace owner.
--
-- Deliberately not here: DATABASE_URL, OPENROUTER_API_KEY, ADMIN_PASSWORD_HASH
-- and the rest. Those are deployment secrets held by Cloudflare, and a form
-- that appeared to edit them would be both a lie and a way to lock yourself
-- out of your own admin from inside your own admin.
CREATE TABLE IF NOT EXISTS workspace_settings (
  owner_id text PRIMARY KEY,
  display_name text,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
