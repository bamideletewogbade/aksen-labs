import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';
process.loadEnvFile('.env');
for (const key of [
  'DATABASE_URL',
  'OPENROUTER_API_KEY',
  'ADMIN_EMAILS',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
])
  console.log(`${key}: ${process.env[key] ? 'configured' : 'missing'}`);
const q = neon(process.env.DATABASE_URL);
await q.transaction(
  readFileSync('db/operations-migration.sql', 'utf8')
    .replace(/^\uFEFF/, '')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => q.query(s)),
);
console.log('Additive operations outbox migration applied.');
