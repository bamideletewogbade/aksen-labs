// Real SQL and route logic in a uniquely named, empty schema. Never sends mail.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { PgDialect } from 'drizzle-orm/pg-core';
import { loadLocalModule } from '../scripts/prospecting-runtime.mjs';
if (!process.argv.includes('--live') && !process.argv.includes('--scout')) {
  console.log(
    'SKIP: use --live for the isolated provider test, or --scout to also test real search. Both spend AI credits, never send mail.',
  );
  process.exit(0);
}
process.loadEnvFile('.env');
const original = process.env.DATABASE_URL;
const admin = neon(original);
const schema = 'qa_outreach_' + randomUUID().replaceAll('-', '');
if (!/^qa_outreach_[a-f0-9]{32}$/.test(schema))
  throw new Error('Unsafe test schema');
const tables = [
  'prospect_campaigns',
  'prospect_leads',
  'prospect_runs',
  'prospect_run_events',
  'workspace_demo_usage',
  'audit_events',
  'agent_runs',
  'agency_email_outbox',
  'email_suppressions',
  'prospect_outreach',
];
const uri = new URL(original);
uri.searchParams.set('options', `-c search_path=${schema}`);
let db;
try {
  await admin.query(`CREATE SCHEMA "${schema}"`);
  await admin.transaction(
    tables.map((t) =>
      admin.query(
        `CREATE TABLE "${schema}"."${t}" (LIKE public."${t}" INCLUDING ALL)`,
      ),
    ),
  );
  process.env.DATABASE_URL = uri.href;
  // Neon HTTP ignores connection-string search_path options. Set it inside
  // every transaction and never fall back to public.
  db = {
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
    'Refuse test writes unless isolated schema is active',
  );
  const campaign = randomUUID(),
    leadId = randomUUID();
  const source = {
    url: 'https://fictional.example/contact',
    title: 'Fictional workshop',
    content:
      'Our workshop accepts custom furniture enquiries. Email hello@fictional.example for details.',
  };
  const data = {
    company: 'Fictional workshop',
    website: 'https://fictional.example',
    domain: 'fictional.example',
    sources: [source],
    contacts: [
      { kind: 'email', value: 'hello@fictional.example', source: source.url },
    ],
    checkedAt: '2026-10-27',
    description: 'Workshop',
    opportunity: 'Possible enquiry workflow',
  };
  await db.query(
    'INSERT INTO prospect_campaigns(id,owner_id,target) VALUES($1,$2,$3)',
    [campaign, 'qa-owner', 'Fictional integration test'],
  );
  await db.query(
    "INSERT INTO prospect_leads(id,owner_id,campaign_id,company,website,domain,data,status) VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,'shortlisted')",
    [
      leadId,
      'qa-owner',
      campaign,
      data.company,
      data.website,
      data.domain,
      JSON.stringify(data),
    ],
  );
  globalThis.qaOwner = 'qa-owner';
  const dialect = new PgDialect();
  globalThis.qaDb = {
    execute: async (statement) => {
      const q = dialect.sqlToQuery(statement);
      return { rows: await db.query(q.sql, q.params) };
    },
  };
  const overrides = {
    'db/index.ts': 'export function getDb(){return globalThis.qaDb;}',
    'lib/backend-events.ts':
      'export async function logBackendEvent(){return true;}',
    'lib/workspace-access.ts':
      'export async function workspaceUser(){if(!globalThis.qaOwner)throw Error();return {userId:globalThis.qaOwner};}',
    'lib/request-log.ts':
      'export const withRequestLog=(_route,handler)=>handler;',
  };
  const route = await loadLocalModule(
    'app/api/admin/prospects/outreach/route.ts',
    overrides,
  );
  const request = (action, extra = {}) =>
    new Request('http://localhost/api/admin/prospects/outreach', {
      method: 'POST',
      headers: {
        origin: 'http://localhost',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, leadId, ...extra }),
    });
  globalThis.qaOwner = 'someone-else';
  assert.equal((await route.POST(request('prepare'))).status, 404);
  globalThis.qaOwner = 'qa-owner';
  const foreign = request('prepare');
  foreign.headers.set('origin', 'https://evil.example');
  assert.equal((await route.POST(foreign)).status, 403);
  // A live, synthetic writer call. No real recipient is used or sent to.
  const prepared = await route.POST(request('prepare'));
  const payload = await prepared.json();
  assert.equal(prepared.status, 200, JSON.stringify(payload));
  assert.ok(payload.record.brief.observations.length);
  console.log(
    'PASS: live writer produced and persisted a source-validated outreach brief.',
  );
  const brief = payload.record.brief;
  assert.equal(
    (
      await route.POST(
        request('save', {
          subject: brief.subject,
          content: brief.body,
          relationshipNote: 'Synthetic test',
        }),
      )
    ).status,
    400,
  );
  const saves = await Promise.all(
    [1, 2].map(() =>
      route.POST(
        request('save', {
          subject: brief.subject,
          content: brief.body,
          relationshipNote: 'Synthetic test only',
          reviewed: true,
        }),
      ),
    ),
  );
  assert.ok(saves.every((r) => r.status === 200));
  assert.equal(
    (await db.query('SELECT count(*)::int AS n FROM agency_email_outbox'))[0].n,
    1,
  );
  const mail = (await db.query('SELECT * FROM agency_email_outbox'))[0];
  assert.equal(mail.status, 'draft');
  assert.equal(mail.purpose, 'outreach');
  assert.ok(mail.relationship_note.includes(source.url));
  assert.equal(
    (
      await route.POST(
        request('response', {
          status: 'interested',
          note: 'Test',
          nextAction: 'Call',
        }),
      )
    ).status,
    409,
  );
  // Synthetic provider receipt state in the isolated schema; no provider send.
  await db.query("UPDATE agency_email_outbox SET status='sent' WHERE id=$1", [
    mail.id,
  ]);
  assert.equal(
    (
      await route.POST(
        request('response', {
          status: 'interested',
          note: 'Synthetic response',
          nextAction: 'Discovery call',
          followupDate: '2026-10-30',
        }),
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await route.POST(
        request('response', {
          status: 'do_not_contact',
          note: 'Synthetic stop request',
        }),
      )
    ).status,
    200,
  );
  assert.equal(
    (await db.query('SELECT count(*)::int AS n FROM email_suppressions'))[0].n,
    1,
  );
  console.log(
    'PASS: owner/origin guards, review required, concurrent save deduplication, draft-only handoff, response tracking and stop suppression.',
  );
  if (process.argv.includes('--scout')) {
    // Same Scout pipeline used by the app, with its rows confined to this schema.
    const { runProspecting } = await loadLocalModule(
      'lib/prospecting.ts',
      overrides,
    );
    await db.query('UPDATE prospect_campaigns SET target=$1 WHERE id=$2', [
      'Find at most two established hotel or event venue businesses in Ibadan, Nigeria, with an official website and public business email. Research enquiry and booking workflows only; do not infer buying intent.',
      campaign,
    ]);
    const result = await runProspecting('qa-owner', campaign, {
      onProgress: (e) => console.log('Scout:', e.stage, e.status, e.message),
    });
    assert.equal(result.skipped, false);
    assert.ok(
      result.added > 0,
      'A successful full Scout check must save supported records',
    );
    const run = (
      await db.query('SELECT status,found FROM prospect_runs WHERE id=$1', [
        result.runId,
      ])
    )[0];
    assert.equal(run.status, 'completed');
    assert.ok(run.found > 0);
    console.log(
      'PASS: full live Scout search, enrichment, source verification and persisted leads in isolated schema.',
      run,
    );
  }
} finally {
  process.env.DATABASE_URL = original;
  // Only the unique schema created above, never public or business records.
  await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  console.log('Isolated test schema removed. No external email was sent.');
}
