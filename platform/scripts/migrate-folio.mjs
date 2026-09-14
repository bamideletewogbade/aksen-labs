import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';
process.loadEnvFile('.env');
const query = neon(process.env.DATABASE_URL);
await query.transaction(
  readFileSync('db/folio-migration.sql', 'utf8')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => query.query(s)),
);
console.log(
  'Folio account migration applied. Existing tables and records preserved.',
);
