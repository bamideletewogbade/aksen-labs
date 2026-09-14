CREATE TABLE IF NOT EXISTS admin_sessions (
 token_hash text PRIMARY KEY, owner_id text NOT NULL, email text NOT NULL,
 config_version text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expiry ON admin_sessions(expires_at);
