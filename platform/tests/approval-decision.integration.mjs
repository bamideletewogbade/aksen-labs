// Runs only against transaction-local temporary tables; never edits business records.
import assert from 'node:assert/strict';
import { neon } from '@neondatabase/serverless';
import { PgDialect } from 'drizzle-orm/pg-core';
import { approvalDecisionQuery } from '../lib/approval-decision.ts';

process.loadEnvFile('.env');
const client = neon(process.env.DATABASE_URL);
const dialect = new PgDialect();
const query = (decision) => {
  const compiled = dialect.sqlToQuery(
    approvalDecisionQuery('review-test', decision, 'test-reviewer'),
  );
  return client.query(compiled.sql, compiled.params);
};
const setup = (withPost = true, failAudit = false) => [
  client.query(
    'CREATE TEMP TABLE approvals (id text PRIMARY KEY, entity_type text, entity_id text, status text, decided_by text, decided_at timestamptz) ON COMMIT DROP',
  ),
  client.query(
    'CREATE TEMP TABLE blog_posts (id text PRIMARY KEY, status text, published_at timestamptz, updated_at timestamptz) ON COMMIT DROP',
  ),
  client.query(
    `CREATE TEMP TABLE audit_events (id text PRIMARY KEY, actor_id text, actor_type text, action text ${failAudit ? "CHECK (action <> 'post.published')" : ''}, entity_type text, entity_id text, details jsonb) ON COMMIT DROP`,
  ),
  client.query(
    "INSERT INTO approvals (id, entity_type, entity_id, status) VALUES ('review-test','blog_post','draft-test','pending')",
  ),
  ...(withPost
    ? [
        client.query(
          "INSERT INTO blog_posts (id, status) VALUES ('draft-test','draft')",
        ),
      ]
    : []),
];
const state = () =>
  client.query(
    'SELECT (SELECT status FROM approvals) AS approval, (SELECT status FROM blog_posts) AS post, (SELECT count(*)::int FROM audit_events) AS audits',
  );

const approved = await client.transaction([
  ...setup(),
  query('approved'),
  query('approved'),
  state(),
]);
assert.equal(approved.at(-3)[0].carriedOut, 'published');
assert.equal(
  approved.at(-2).length,
  0,
  'a repeated decision must not execute twice',
);
assert.deepEqual(approved.at(-1)[0], {
  approval: 'approved',
  post: 'published',
  audits: 2,
});

const rejected = await client.transaction([
  ...setup(),
  query('rejected'),
  state(),
]);
assert.deepEqual(rejected.at(-1)[0], {
  approval: 'rejected',
  post: 'draft',
  audits: 1,
});

const missing = await client.transaction([
  ...setup(false),
  query('approved'),
  state(),
]);
assert.equal(missing.at(-2).length, 0);
assert.deepEqual(missing.at(-1)[0], {
  approval: 'pending',
  post: null,
  audits: 0,
});

await assert.rejects(
  client.transaction([...setup(true, true), query('approved')]),
  /check constraint/i,
);
console.log(
  'PASS: atomic publication, duplicate decision, rejection, missing draft and audit failure; only temporary tables used.',
);
