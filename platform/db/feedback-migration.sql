CREATE TABLE IF NOT EXISTS feedback_ideas (
 id text PRIMARY KEY,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 title text NOT NULL, body text, author_email text,
 status text NOT NULL DEFAULT 'open', status_note text,
 vote_count integer NOT NULL DEFAULT 0,
 published boolean NOT NULL DEFAULT false,
 submitter_key text NOT NULL,
 merged_into text REFERENCES feedback_ideas(id),
 triage_summary text, triage_size text, triaged_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_feedback_ideas_board ON feedback_ideas(published, status, vote_count);
CREATE INDEX IF NOT EXISTS idx_feedback_ideas_triage ON feedback_ideas(triaged_at, created_at);

CREATE TABLE IF NOT EXISTS feedback_votes (
 idea_id text NOT NULL REFERENCES feedback_ideas(id),
 voter_key text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT feedback_votes_idea_voter UNIQUE (idea_id, voter_key)
);
CREATE INDEX IF NOT EXISTS idx_feedback_votes_idea ON feedback_votes(idea_id);

CREATE TABLE IF NOT EXISTS changelog_entries (
 id text PRIMARY KEY,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 slug text NOT NULL UNIQUE,
 title text NOT NULL, body text NOT NULL,
 released_on date NOT NULL,
 kind text NOT NULL DEFAULT 'improvement',
 published boolean NOT NULL DEFAULT false,
 idea_id text REFERENCES feedback_ideas(id)
);
CREATE INDEX IF NOT EXISTS idx_changelog_published ON changelog_entries(published, released_on)
