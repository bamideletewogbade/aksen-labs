import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';
process.loadEnvFile('.env');
const query = neon(process.env.DATABASE_URL);
// Additive: three nullable columns, one index, one new table, and two CHECK
// constraints widened (never narrowed), so every existing row still passes.
// Comments are stripped before the split for the reason given in
// migrate-outbox.mjs: a semicolon inside a comment breaks a naive split.
const statements = readFileSync('db/email-groups-migration.sql', 'utf8')
  .replace(/--[^\n]*/g, '')
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);

await query.transaction(statements.map((s) => query.query(s)));
console.log(
  [
    'Email groups migration applied.',
    '',
    'The email desk can now send one message to a group, one copy per person,',
    'and keeps a stop list. Nothing leaves until both of these are set:',
    '',
    '  RESEND_API_KEY=re_...',
    '  RESEND_FROM_EMAIL="Aksen Labs <hello@your-verified-domain>"',
  ].join('\n'),
);
