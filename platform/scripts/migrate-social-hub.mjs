// Adds the two additive Social Hub settings objects.
// Run from the platform directory: node scripts/migrate-social-hub.mjs
import fs from 'node:fs';
import { neon } from '@neondatabase/serverless';

process.loadEnvFile('.env');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set.');

const q = neon(process.env.DATABASE_URL);
// Split only at explicit boundaries. The DO blocks contain semicolons of their
// own, so generic semicolon splitting would corrupt the migration.
const statements = fs
  .readFileSync('db/social-hub-migration.sql', 'utf8')
  .split('-- statement-breakpoint')
  .map((statement) => statement.trim())
  .filter(Boolean);
for (const statement of statements) await q.query(statement);

const columns = await q.query(
  `SELECT column_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name='workspace_settings'
      AND column_name IN ('social_profiles','social_context')
    ORDER BY column_name`,
);
console.log('Social Hub columns: ' + columns.map((c) => c.column_name).join(', '));
