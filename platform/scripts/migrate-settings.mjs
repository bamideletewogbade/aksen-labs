// Creates the workspace_settings table.
//
// Run from the platform directory:  node scripts/migrate-settings.mjs
//
// Idempotent: the statement is CREATE TABLE IF NOT EXISTS, so running it twice
// costs a round trip and changes nothing.
import fs from 'node:fs';
import { neon } from '@neondatabase/serverless';

process.loadEnvFile('.env');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set.');

const q = neon(process.env.DATABASE_URL);
const statements = fs
  .readFileSync('db/settings-migration.sql', 'utf8')
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);

for (const statement of statements) await q.query(statement);

const columns = await q.query(
  `SELECT column_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name='workspace_settings'
    ORDER BY ordinal_position`,
);
console.log(
  'workspace_settings: ' + columns.map((c) => c.column_name).join(', '),
);
console.log('Done. Set your name in the admin under Settings.');
