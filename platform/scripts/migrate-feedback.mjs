import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';
process.loadEnvFile('.env');
const query = neon(process.env.DATABASE_URL);
// CREATE TABLE IF NOT EXISTS throughout, so this is safe to run twice and does
// not touch anything already in the database.
await query.transaction(
  readFileSync('db/feedback-migration.sql', 'utf8')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => query.query(s)),
);
console.log(
  'Feedback board migration applied. Existing tables and records preserved.',
);
