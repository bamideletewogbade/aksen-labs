import assert from 'node:assert/strict';
import fs from 'node:fs';
import { neon } from '@neondatabase/serverless';
import { PgDialect } from 'drizzle-orm/pg-core';
import { loadProspecting } from '../scripts/prospecting-runtime.mjs';
process.loadEnvFile('.env');
const q = neon(process.env.DATABASE_URL);
const dialect = new PgDialect();
const { promoteProspectQuery, reviewProspectQuery } = await loadProspecting();
const review = (action, owner = 'owner', id = 'review') => {
  const s = dialect.sqlToQuery(reviewProspectQuery(id, owner, action));
  return q.query(s.sql, s.params);
};
const promote = (owner = 'owner') => {
  const s = dialect.sqlToQuery(promoteProspectQuery('lead', owner));
  return q.query(s.sql, s.params);
};
const statements = fs
  .readFileSync('db/prospecting-migration.sql', 'utf8')
  .split(';')
  .map((s) => s.trim())
  .filter((s) => s.startsWith('CREATE TABLE'))
  .map(
    (s) =>
      s.replace('CREATE TABLE IF NOT EXISTS', 'CREATE TEMP TABLE') +
      ' ON COMMIT DROP',
  );
const result = await q.transaction([
  ...statements.map((s) => q.query(s)),
  q.query(
    'CREATE TEMP TABLE opportunities (LIKE public.opportunities INCLUDING ALL) ON COMMIT DROP',
  ),
  q.query(
    'CREATE TEMP TABLE audit_events (LIKE public.audit_events INCLUDING ALL) ON COMMIT DROP',
  ),
  q`INSERT INTO prospect_campaigns(id,owner_id,target) VALUES('campaign','owner','Fictional target')`,
  q`INSERT INTO prospect_leads(id,owner_id,campaign_id,company,website,domain,data) VALUES('lead','owner','campaign','Fictional Cedar','https://cedar.example','cedar.example','{"opportunity":"Hypothesis only","contacts":[]}'::jsonb)`,
  promote(),
  q`UPDATE prospect_leads SET status='shortlisted' WHERE id='lead'`,
  promote('other'),
  promote(),
  promote(),
  q`SELECT (SELECT count(*)::int FROM opportunities) AS leads,(SELECT consent_status FROM opportunities LIMIT 1) AS consent,(SELECT count(*)::int FROM audit_events) AS audits,(SELECT status FROM prospect_leads) AS status`,
  review('restore', 'owner', 'lead'),
  q`INSERT INTO prospect_leads(id,owner_id,campaign_id,company,website,domain,data) VALUES('review','owner','campaign','Fictional Review','https://review.example','review.example','{}'::jsonb)`,
  review('dismiss', 'other'),
  review('dismiss'),
  review('dismiss'),
  review('restore', 'other'),
  review('restore'),
  review('restore'),
  review('shortlist'),
  q`SELECT (SELECT count(*)::int FROM audit_events WHERE entity_id='review') AS audits,(SELECT status FROM prospect_leads WHERE id='review') AS status`,
]);
const offset = statements.length - 3;
const at = (index) => result[index + offset];
assert.equal(at(7).length, 0);
assert.equal(at(9).length, 0);
assert.equal(at(10).length, 1);
assert.equal(at(11).length, 0);
assert.deepEqual(at(12)[0], {
  leads: 1,
  consent: 'unknown',
  audits: 1,
  status: 'promoted',
});
for (const index of [13, 15, 17, 18, 20]) assert.equal(at(index).length, 0);
for (const index of [16, 19, 21]) assert.equal(at(index).length, 1);
assert.deepEqual(at(22)[0], { audits: 3, status: 'shortlisted' });
console.log(
  'PASS: review actions enforce owner isolation, valid transitions, safe restoration and exactly one audit event per change.',
);
console.log(
  'PASS: transaction-local tables confirm shortlist-only promotion, owner isolation, repeated promotion safety and atomic audit with consent unknown.',
);
