// A recorded reply reaches Sales: real route and SQL in a uniquely named,
// empty schema. No AI call and no mail. Run: node tests/outreach-response.integration.mjs --db
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { PgDialect } from 'drizzle-orm/pg-core';
import { loadLocalModule } from '../scripts/prospecting-runtime.mjs';
if (!process.argv.includes('--db')) {
  console.log(
    'SKIP: use --db to run against an isolated schema it creates and drops. No AI credits, no mail.',
  );
  process.exit(0);
}
process.loadEnvFile('.env');
const admin = neon(process.env.DATABASE_URL);
const schema = 'qa_reply_' + randomUUID().replaceAll('-', '');
if (!/^qa_reply_[a-f0-9]{32}$/.test(schema))
  throw new Error('Unsafe test schema');
const tables = [
  'prospect_campaigns',
  'prospect_leads',
  'audit_events',
  'agency_email_outbox',
  'email_suppressions',
  'prospect_outreach',
  'opportunities',
];
try {
  await admin.query(`CREATE SCHEMA "${schema}"`);
  await admin.transaction(
    tables.map((t) =>
      admin.query(
        `CREATE TABLE "${schema}"."${t}" (LIKE public."${t}" INCLUDING ALL)`,
      ),
    ),
  );
  // Neon HTTP ignores search_path in the connection string, so it is set inside
  // every transaction and the test never falls back to public.
  const db = {
    query: async (query, params = []) =>
      (
        await admin.transaction([
          admin.query(`SET LOCAL search_path TO "${schema}"`),
          admin.query(query, params),
        ])
      )[1],
  };
  assert.equal(
    (await db.query('SELECT current_schema() AS schema'))[0].schema,
    schema,
    'Refuse test writes unless the isolated schema is active',
  );

  const owner = 'qa-owner';
  const campaign = randomUUID(),
    leadId = randomUUID(),
    outboxId = randomUUID();
  const url = 'https://fictional.example/contact';
  const data = {
    company: 'Fictional workshop',
    website: 'https://fictional.example',
    sources: [
      { url, title: 'Contact', content: 'Email hello@fictional.example' },
    ],
    contacts: [
      { kind: 'email', value: 'hello@fictional.example', source: url },
    ],
    opportunity: 'Possible enquiry workflow',
  };
  const brief = {
    recipient: 'hello@fictional.example',
    company: data.company,
    observations: [{ quote: 'Email hello@fictional.example', source: url }],
    hypothesis: 'Enquiries may arrive by email only; to confirm.',
    question: 'How are enquiries recorded?',
    subject: 'Custom furniture enquiries',
    body: 'Hello. Aksen Labs',
    checkedAt: '2026-10-27',
  };
  await db.query(
    'INSERT INTO prospect_campaigns(id,owner_id,target) VALUES($1,$2,$3)',
    [campaign, owner, 'Fictional reply test'],
  );
  await db.query(
    "INSERT INTO prospect_leads(id,owner_id,campaign_id,company,website,domain,data,status) VALUES($1,$2,$3,$4,$5,'fictional.example',$6::jsonb,'shortlisted')",
    [leadId, owner, campaign, data.company, data.website, JSON.stringify(data)],
  );
  // A send attempt already happened: the reply path is only open after one.
  await db.query(
    "INSERT INTO agency_email_outbox(id,owner_id,recipient,subject,body,purpose,relationship_note,status,batch_id) VALUES($1,$2,$3,$4,$5,'outreach','Synthetic','sent',$1)",
    [outboxId, owner, brief.recipient, brief.subject, brief.body],
  );
  await db.query(
    'INSERT INTO prospect_outreach(id,owner_id,lead_id,brief,model,outbox_id) VALUES($1,$2,$3,$4::jsonb,$5,$6)',
    [randomUUID(), owner, leadId, JSON.stringify(brief), 'synthetic', outboxId],
  );

  globalThis.qaOwner = owner;
  const dialect = new PgDialect();
  globalThis.qaDb = {
    execute: async (statement) => {
      const q = dialect.sqlToQuery(statement);
      return { rows: await db.query(q.sql, q.params) };
    },
  };
  const route = await loadLocalModule(
    'app/api/admin/prospects/outreach/route.ts',
    {
      'db/index.ts': 'export function getDb(){return globalThis.qaDb;}',
      'lib/backend-events.ts':
        'export async function logBackendEvent(){return true;}',
      'lib/workspace-access.ts':
        'export async function workspaceUser(){if(!globalThis.qaOwner)throw Error();return {userId:globalThis.qaOwner};}',
      'lib/request-log.ts':
        'export const withRequestLog=(_route,handler)=>handler;',
    },
  );
  const reply = (extra) =>
    route.POST(
      new Request('http://localhost/api/admin/prospects/outreach', {
        method: 'POST',
        headers: {
          origin: 'http://localhost',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'response', leadId, ...extra }),
      }),
    );
  const leadRow = async () =>
    (await db.query('SELECT status,opportunity_id FROM prospect_leads'))[0];
  const opportunities = () =>
    db.query(
      "SELECT id,next_action,to_char(follow_up_at,'YYYY-MM-DD') AS follow_up FROM opportunities",
    );

  // Another workspace cannot record a reply on this prospect.
  globalThis.qaOwner = 'someone-else';
  assert.equal(
    (await reply({ status: 'interested', note: 'x', nextAction: 'y' })).status,
    404,
  );
  globalThis.qaOwner = owner;

  // Not now: recorded, but it is not an enquiry yet.
  let response = await reply({
    status: 'not_now',
    note: 'Busy until next month',
    nextAction: 'Check back in November',
    followupDate: '2026-11-15',
  });
  assert.equal(response.status, 200);
  assert.equal((await leadRow()).status, 'shortlisted');
  assert.equal((await opportunities()).length, 0);

  // Interested: becomes an enquiry carrying the next action and date.
  response = await reply({
    status: 'interested',
    note: 'Asked for a call',
    nextAction: 'Discovery call',
    followupDate: '2026-10-30',
  });
  const payload = await response.json();
  assert.equal(response.status, 200, JSON.stringify(payload));
  const promoted = await leadRow();
  assert.equal(promoted.status, 'promoted');
  assert.equal(payload.opportunityId, promoted.opportunity_id);
  let [opportunity] = await opportunities();
  assert.equal(opportunity.next_action, 'Discovery call');
  assert.equal(opportunity.follow_up, '2026-10-30');
  assert.equal(
    (
      await db.query(
        "SELECT count(*)::int AS n FROM audit_events WHERE action='prospect.promoted'",
      )
    )[0].n,
    1,
  );

  // Recording again updates the same enquiry; it never makes a second one.
  await reply({
    status: 'interested',
    note: 'Call moved',
    nextAction: 'Discovery call, moved',
    followupDate: '2026-11-02',
  });
  const all = await opportunities();
  assert.equal(all.length, 1);
  assert.equal(all[0].follow_up, '2026-11-02');

  // A stop request reaches the enquiry too, and clears its follow-up.
  await reply({ status: 'do_not_contact', note: 'Asked us to stop' });
  [opportunity] = await opportunities();
  assert.equal(opportunity.next_action, 'Do not contact');
  assert.equal(opportunity.follow_up, null);
  assert.equal(
    (await db.query('SELECT count(*)::int AS n FROM email_suppressions'))[0].n,
    1,
  );
  console.log(
    'PASS: replies reach Sales. Not now stays a prospect, interested becomes one enquiry with its next action and date, repeats update it, a stop request clears it and suppresses the address, other owners are refused.',
  );
} finally {
  // Only the unique schema created above, never public or business records.
  await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  console.log('Isolated test schema removed. No AI call, no mail.');
}
