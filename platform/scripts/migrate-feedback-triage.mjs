import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';
process.loadEnvFile('.env');
const query = neon(process.env.DATABASE_URL);
// Additive only, and the settings row uses ON CONFLICT DO NOTHING, so running
// this twice will not reset a switch somebody has already turned off.
await query.transaction(
  readFileSync('db/feedback-triage-migration.sql', 'utf8')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => query.query(s)),
);
console.log(
  'Feedback triage migration applied. Triage starts switched on, with a ceiling of 40 a day.',
);
