import { neon } from '@neondatabase/serverless';
process.loadEnvFile('.env');
const query = neon(process.env.DATABASE_URL);

/**
 * Is the enquiry loop actually working? One command, read-only.
 *
 * The exit test for Phase 0 is that a stranger can write in and get a reply.
 * This answers the half of that a person cannot see from the outside: did the
 * lead land with an owner, did the two messages queue, and is anything stuck.
 */

const [{ configured }] = await query`SELECT 1 AS configured`;
void configured;

const leads = await query`
  SELECT source, count(*)::int AS n, max(created_at) AS latest
    FROM opportunities GROUP BY source ORDER BY n DESC`;

const orphans = await query`
  SELECT count(*)::int AS n FROM opportunities WHERE owner_id IS NULL`;

const outbox = await query`
  SELECT status, count(*)::int AS n, min(created_at) AS oldest, max(last_error) AS example
    FROM message_outbox GROUP BY status ORDER BY n DESC`;

const stuck = await query`
  SELECT count(*)::int AS n FROM message_outbox
   WHERE status <> 'sent' AND created_at < now() - interval '1 hour'`;

console.log('\nLeads by source');
if (leads.length === 0) console.log('  none yet');
for (const row of leads)
  console.log(
    `  ${String(row.source).padEnd(18)} ${String(row.n).padStart(4)}   latest ${row.latest}`,
  );

console.log(
  `\nLeads with no owner: ${orphans[0].n}   (these are invisible in the pipeline)`,
);

console.log('\nOutbox');
if (outbox.length === 0) console.log('  empty');
for (const row of outbox)
  console.log(
    `  ${String(row.status).padEnd(10)} ${String(row.n).padStart(4)}   oldest ${row.oldest}${
      row.example ? `\n    last error: ${row.example}` : ''
    }`,
  );

console.log(`\nUndelivered for over an hour: ${stuck[0].n}`);

const hasKey = !!process.env.RESEND_API_KEY;
const hasFrom = !!process.env.RESEND_FROM_EMAIL;
console.log(
  `\nDelivery: ${
    hasKey && hasFrom
      ? 'configured'
      : `NOT configured (missing ${[
          !hasKey && 'RESEND_API_KEY',
          !hasFrom && 'RESEND_FROM_EMAIL',
        ]
          .filter(Boolean)
          .join(' and ')}). Everything queues and waits.`
  }\n`,
);
