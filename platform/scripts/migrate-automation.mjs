// Adds run grouping to found leads and a schedule to the campaign.
//
// Run from the platform directory:  node scripts/migrate-automation.mjs
//
// Idempotent. Every statement is guarded, so running it twice changes nothing.
import fs from 'node:fs';
import { neon } from '@neondatabase/serverless';

process.loadEnvFile('.env');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set.');

const q = neon(process.env.DATABASE_URL);
// Comments come out before the split, not after. A semicolon inside a comment
// is ordinary English punctuation, and splitting first cut one ALTER TABLE into
// three fragments that each failed as "syntax error at end of input".
const statements = fs
  .readFileSync('db/automation-migration.sql', 'utf8')
  .split('\n')
  .filter((line) => !line.trim().startsWith('--'))
  .join('\n')
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);

for (const statement of statements) await q.query(statement);

const campaign = await q.query(
  `SELECT column_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name='prospect_campaigns'
    ORDER BY ordinal_position`,
);
const leads = await q.query(
  `SELECT column_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name='prospect_leads'
    ORDER BY ordinal_position`,
);
console.log(
  'prospect_campaigns: ' + campaign.map((c) => c.column_name).join(', '),
);
console.log(
  'prospect_leads    : ' + leads.map((c) => c.column_name).join(', '),
);

const [counts] = await q.query(
  `SELECT count(*)::int total, count(run_id)::int with_run FROM prospect_leads`,
);
console.log(
  `\n${counts.total} leads, ${counts.with_run} carrying a run. Existing leads keep a null run: which run found them was never recorded and cannot be recovered.`,
);
