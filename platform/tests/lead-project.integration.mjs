import assert from 'node:assert/strict';
import { neon } from '@neondatabase/serverless';
import { PgDialect } from 'drizzle-orm/pg-core';
import { leadProjectQuery } from '../lib/lead-project.ts';
process.loadEnvFile('.env');
const q = neon(process.env.DATABASE_URL);
const dialect = new PgDialect();
const convert = (owner = 'owner') => {
  const query = dialect.sqlToQuery(leadProjectQuery('lead-test', owner));
  return q.query(query.sql, query.params);
};
const result = await q.transaction([
  q.query(
    'CREATE TEMP TABLE opportunities(id text PRIMARY KEY,company text,work text,status text) ON COMMIT DROP',
  ),
  q.query(
    'CREATE TEMP TABLE projects(id text PRIMARY KEY,opportunity_id text,name text,client_name text,objective text,next_gate text,owner_id text) ON COMMIT DROP',
  ),
  q.query(
    'CREATE TEMP TABLE audit_events(id text PRIMARY KEY,actor_id text,actor_type text,action text,entity_type text,entity_id text) ON COMMIT DROP',
  ),
  q`INSERT INTO opportunities VALUES('lead-test','Fictional client','Test implementation','proposal')`,
  convert(),
  q`UPDATE opportunities SET status='won' WHERE id='lead-test'`,
  convert(),
  convert(),
  convert('other'),
  q`SELECT (SELECT count(*)::int FROM projects) AS projects,(SELECT count(*)::int FROM audit_events) AS audits`,
]);
assert.equal(result[4].length, 0);
assert.equal(result[6].length, 1);
assert.equal(result[7].length, 1);
assert.equal(result[8].length, 0);
assert.deepEqual(result[9][0], { projects: 1, audits: 1 });
console.log(
  'PASS: won-only project creation, repeat-click reuse, owner isolation and single audit; temporary tables only.',
);
