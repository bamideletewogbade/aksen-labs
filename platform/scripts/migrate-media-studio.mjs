// Run from platform: node scripts/migrate-media-studio.mjs
import fs from 'node:fs';
import { neon } from '@neondatabase/serverless';

process.loadEnvFile('.env');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set.');

const q = neon(process.env.DATABASE_URL);
const statements = fs.readFileSync('db/media-studio-migration.sql', 'utf8')
  .split('-- statement-breakpoint').map((statement) => statement.trim()).filter(Boolean);
for (const statement of statements) await q.query(statement);
const rows = await q.query(
  "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('media_episodes','media_render_jobs') ORDER BY table_name",
);
console.log('Media Studio tables: ' + rows.map((row) => row.table_name).join(', '));
