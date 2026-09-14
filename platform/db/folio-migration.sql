CREATE TABLE IF NOT EXISTS folio_users (
 id text PRIMARY KEY, email text NOT NULL UNIQUE,
 created_at timestamptz NOT NULL DEFAULT now(), last_seen_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS folio_login_tokens (
 token_hash text PRIMARY KEY, email text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL, used_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_folio_login_tokens_email ON folio_login_tokens(email, created_at);
CREATE INDEX IF NOT EXISTS idx_folio_login_tokens_expiry ON folio_login_tokens(expires_at);
CREATE TABLE IF NOT EXISTS folio_sessions (
 token_hash text PRIMARY KEY, user_id text NOT NULL REFERENCES folio_users(id),
 created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_folio_sessions_expiry ON folio_sessions(expires_at);
CREATE TABLE IF NOT EXISTS folio_cvs (
 id text PRIMARY KEY, user_id text NOT NULL REFERENCES folio_users(id),
 label text NOT NULL, data jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_folio_cvs_user ON folio_cvs(user_id, updated_at);
