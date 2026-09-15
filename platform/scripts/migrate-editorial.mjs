// Adds the editorial research inbox and its schedule.
// Run from the platform directory: node scripts/migrate-editorial.mjs
import fs from 'node:fs';
import { neon } from '@neondatabase/serverless';

process.loadEnvFile('.env');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set.');

const query = neon(process.env.DATABASE_URL);
const statements = fs
  .readFileSync('db/editorial-automation-migration.sql', 'utf8')
  .split('\n')
  .filter((line) => !line.trim().startsWith('--'))
  .join('\n')
  .split(';')
  .map((statement) => statement.trim())
  .filter(Boolean);

for (const statement of statements) await query.query(statement);

const tables = await query.query(
  `SELECT table_name FROM information_schema.tables
    WHERE table_schema='public' AND table_name LIKE 'editorial_%'
    ORDER BY table_name`,
);
console.log('Editorial tables: ' + tables.map((row) => row.table_name).join(', '));
