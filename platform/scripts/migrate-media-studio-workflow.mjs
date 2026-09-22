// Run from platform after the base Media Studio migration.
import fs from 'node:fs';
import { neon } from '@neondatabase/serverless';

process.loadEnvFile('.env');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set.');
const q = neon(process.env.DATABASE_URL);
const statements = fs.readFileSync('db/media-studio-workflow-migration.sql', 'utf8')
  .split('-- statement-breakpoint').map((statement) => statement.trim()).filter(Boolean);
for (const statement of statements) await q.query(statement);
console.log('Media Studio workflow columns applied.');
