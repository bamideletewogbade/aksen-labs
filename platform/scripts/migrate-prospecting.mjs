import fs from 'node:fs';
import { neon } from '@neondatabase/serverless';
process.loadEnvFile('.env');
const sql = neon(process.env.DATABASE_URL);
await sql.transaction(
  fs
    .readFileSync('db/prospecting-migration.sql', 'utf8')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => sql.query(s)),
);
console.log(
  'Prospecting tables and indexes ready. Existing business records preserved.',
);
