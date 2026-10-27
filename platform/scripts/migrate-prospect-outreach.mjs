import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';
process.loadEnvFile('.env');
const db = neon(process.env.DATABASE_URL);
const statements = readFileSync('db/prospect-outreach-migration.sql', 'utf8').split(';').map(s=>s.trim()).filter(Boolean);
await db.transaction(statements.map(s=>db.query(s)));
console.log('Prospect outreach table and indexes are ready. Existing records are unchanged.');
