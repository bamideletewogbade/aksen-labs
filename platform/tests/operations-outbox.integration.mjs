import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';
process.loadEnvFile('.env');
const q = neon(process.env.DATABASE_URL);
const table =
  readFileSync('db/operations-migration.sql', 'utf8')
    .replace(/^\uFEFF/, '')
    .split(';')[0]
    .replace('CREATE TABLE IF NOT EXISTS', 'CREATE TEMP TABLE') +
  ' ON COMMIT DROP';
const result = await q.transaction([
  q.query(table),
  q`INSERT INTO agency_email_outbox(id,owner_id,recipient,subject,body,purpose,relationship_note) VALUES('test','owner','test@example.com','Test','Body','test','Temporary test')`,
  q`UPDATE agency_email_outbox SET status='sending' WHERE id='test' AND owner_id='other' AND status='draft' RETURNING id`,
  q`UPDATE agency_email_outbox SET status='sending' WHERE id='test' AND owner_id='owner' AND status='draft' RETURNING id`,
  q`UPDATE agency_email_outbox SET status='sending' WHERE id='test' AND owner_id='owner' AND status='draft' RETURNING id`,
  q`UPDATE agency_email_outbox SET status='uncertain' WHERE id='test'`,
  q`UPDATE agency_email_outbox SET status='sending' WHERE id='test' AND owner_id='owner' AND status='draft' RETURNING id`,
]);
assert.equal(result[2].length, 0);
assert.equal(result[3].length, 1);
assert.equal(result[4].length, 0);
assert.equal(result[6].length, 0);
console.log(
  'PASS: temporary outbox owner isolation, one-time claim and no retry after an uncertain send. No real messages or records created.',
);
