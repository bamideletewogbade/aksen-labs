import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';
process.loadEnvFile('.env');
const query = neon(process.env.DATABASE_URL);
// Additive only: a new table, a nullable column and three indexes, every one of
// them IF NOT EXISTS. Running it twice changes nothing and loses nothing.
//
// Comments are stripped before the split rather than after. The sibling scripts
// split the raw file on semicolons, which works right up until a comment
// explaining the migration contains one, and then the next fragment starts
// mid-sentence and Postgres reports a syntax error near an English word. No
// string literal in this file contains a double dash, so stripping is safe here.
const statements = readFileSync('db/outbox-migration.sql', 'utf8')
  .replace(/--[^\n]*/g, '')
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);

await query.transaction(statements.map((s) => query.query(s)));
console.log(
  [
    'Outbox migration applied.',
    '',
    'Messages now queue instead of sending inside the request, and the',
    'heartbeat delivers them with backoff. Nothing will actually leave until',
    'both of these are set:',
    '',
    '  RESEND_API_KEY=...',
    '  RESEND_FROM_EMAIL=hello@yourdomain',
    '',
    'Until then every message queues and waits, which is recoverable. Set them',
    'and the queue drains on the next tick with nothing lost.',
  ].join('\n'),
);
