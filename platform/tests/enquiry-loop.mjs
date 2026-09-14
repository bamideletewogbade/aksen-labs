import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const uri = (text) =>
  'data:text/javascript;base64,' + Buffer.from(text).toString('base64');
const compile = (text) =>
  ts.transpileModule(text, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;

globalThis.eq = {
  counts: new Map(),
  inserted: [],
  audits: [],
  sends: [],
  configured: true,
  failFounder: false,
  failAck: false,
  failAudit: false,
};
const modules = {
  'drizzle-orm': uri(
    'export const sql=(strings,...values)=>({text:strings.join("?"),values})',
  ),
  '@/db': uri(`export const getDb=()=>({
    execute:async q=>{const [bucket,limit]=q.values;const used=eq.counts.get(bucket)||0;if(used>=limit)return {rows:[]};eq.counts.set(bucket,used+1);return {rows:[{requests:used+1}]}},
    insert:table=>({values:async row=>{if(table==='audit_events'){if(eq.failAudit)throw Error('SECRET AUDIT');eq.audits.push(row)}else eq.inserted.push(row)}})
  })`),
  '@/db/schema': uri(
    "export const auditEvents='audit_events';export const opportunities='opportunities';",
  ),
  '@/lib/request-log': uri('export const withRequestLog=(route,fn)=>fn;'),
  // Real, not stubbed to a constant: the point of the assertion below is that
  // the route asks for the workspace owner and stores what it gets.
  '@/app/chatgpt-auth': uri(
    "export const workspaceOwnerId=()=>process.env.ADMIN_OWNER_ID?.trim()||'';",
  ),
  '@/lib/pricing': uri(
    "export const resolvePricingSelection=v=>v==='Care'?{name:'Care',price:'GHS 900'}:null;",
  ),
  '@/lib/workflow-suggestion': uri(
    "export const workflowSuggestion=()=>'Fallback suggestion';",
  ),
  'next/server': uri(
    'export const NextResponse={json:(body,init)=>Response.json(body,init)};',
  ),
  '@/lib/resend': uri(`
    export const EMAIL_REPLY_TO='founder@example.test';
    export const emailConfig=()=>({configured:eq.configured,from:eq.from||'no-reply@example.test',replyTo:'founder@example.test'});
    export const validEmail=v=>/^[^\\s@<>]+@[^\\s@<>]+\\.[^\\s@<>]+$/.test(v);
    export async function sendResendEmail(input){
      const founder=input.id.startsWith('lead-ack')===false;
      if(founder&&eq.failFounder)throw Error('SECRET FOUNDER');
      if(!founder&&eq.failAck)throw Error('SECRET ACK');
      eq.sends.push(input);return 'provider-'+input.id;
    }`),
};
const rewrite = (file) =>
  compile(fs.readFileSync(file, 'utf8')).replace(
    /from\s+['"]([^'"]+)['"]/g,
    (_, name) => `from '${modules[name] || name}'`,
  );
modules['@/lib/rate-limit'] = uri(rewrite('lib/rate-limit.ts'));
modules['@/lib/bounded-json'] = uri(rewrite('lib/bounded-json.ts'));
modules['@/lib/lead-notification'] = uri(rewrite('lib/lead-notification.ts'));
// Set before the route is imported, since the stub reads it at call time and
// the assertion below compares the stored owner against it.
process.env.ADMIN_OWNER_ID = 'test_workspace_owner';
const { POST, enquiryVisitorLimit, enquiryHourlyCeiling } = await import(
  uri(rewrite('app/api/opportunities/route.ts'))
);

const valid = {
  name: 'Ama Owusu',
  email: 'Ama@Example.test',
  company: 'Cedar Home',
  answers: ['Grow online orders', 'Accra retail', 'WhatsApp and a spreadsheet'],
  answerFormat: 'goal-market-setup',
};
const post = (body = valid, headers = {}) =>
  POST(
    new Request('https://aksen.test/api/opportunities', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );
const from = (address) => ({ 'cf-connecting-ip': address });

// Validation still rejects incomplete enquiries before anything is stored.
for (const body of [
  { ...valid, name: '' },
  { ...valid, email: 'not-an-email' },
  { ...valid, answers: ['only', 'two'] },
])
  assert.equal((await post(body, from('198.51.100.1'))).status, 400);
assert.equal((await post('{', from('198.51.100.1'))).status, 400);
assert.equal(eq.inserted.length, 0);
assert.equal(eq.counts.size, 0);

// The body is bounded, so an oversized payload is refused rather than parsed.
const huge = await post(
  { ...valid, company: 'x'.repeat(9000) },
  from('198.51.100.1'),
);
assert.equal(huge.status, 413);
assert.equal(eq.inserted.length, 0);

// A genuine enquiry is stored, announced and acknowledged.
const created = await post(valid, from('198.51.100.2'));
assert.equal(created.status, 201);
const body = await created.json();
assert.equal(body.status, 'new');
assert.equal(body.acknowledged, true);
assert.equal(eq.inserted.length, 1);
assert.equal(eq.inserted[0].email, 'ama@example.test');
assert.equal(
  eq.inserted[0].nextAction,
  'Founder review and personal follow-up',
);
// Every admin view of this table filters on owner_id. A row stored without one
// was captured, emailed, and then invisible in the pipeline, the stage counts
// and the overdue follow-ups, with the notification its only trace. The bug
// was silent because the table was empty, and it would have surfaced as a lost
// customer rather than as an error.
assert.equal(
  eq.inserted[0].ownerId,
  process.env.ADMIN_OWNER_ID,
  'the enquiry must be stamped with the workspace owner or it never reaches the pipeline',
);
const [founderMail, ackMail] = eq.sends;
assert.equal(founderMail.recipient, 'founder@example.test');
assert.match(founderMail.body, /Cedar Home/);
assert.match(founderMail.body, /ama@example\.test/);
// The acknowledgement goes to the stored, normalised address, not raw input.
assert.equal(ackMail.recipient, 'ama@example.test');
assert.ok(!/founder@example\.test/.test(ackMail.body));
assert.ok(eq.audits.some((row) => row.action === 'lead.created'));
assert.ok(eq.audits.some((row) => row.action === 'lead.notified'));

// A failed announcement is recorded against the enquiry, never lost silently,
// and never turns a captured lead into an error for the visitor.
eq.failFounder = true;
const quiet = await post(
  { ...valid, company: 'Quiet Co' },
  from('198.51.100.3'),
);
assert.equal(quiet.status, 201);
assert.equal(eq.inserted.length, 2);
assert.ok(eq.audits.some((row) => row.action === 'lead.notification_failed'));
assert.ok(!(await quiet.clone().text()).includes('SECRET'));
eq.failFounder = false;

// With no email provider configured the enquiry is still captured.
eq.configured = false;
const offline = await post(
  { ...valid, company: 'Offline Co' },
  from('198.51.100.4'),
);
assert.equal(offline.status, 201);
assert.equal((await offline.json()).acknowledged, false);
assert.equal(eq.inserted.length, 3);
eq.configured = true;

// A failing audit write cannot discard an enquiry that is already stored.
eq.failAudit = true;
const noisy = await post(
  { ...valid, company: 'Audit Co' },
  from('198.51.100.5'),
);
assert.equal(noisy.status, 201);
assert.equal(eq.inserted.length, 4);
assert.ok(!(await noisy.text()).includes('SECRET'));
eq.failAudit = false;

// Resend's sandbox sender accepts a send to anyone and delivers only to the
// account owner, so the site must not tell a visitor a confirmation is coming.
// The enquiry is still stored and still announced to the founder.
eq.from = 'onboarding@resend.dev';
eq.sends.length = 0;
const sandbox = await post(
  { ...valid, company: 'Sandbox Co' },
  from('198.51.100.6'),
);
assert.equal(sandbox.status, 201);
assert.equal((await sandbox.json()).acknowledged, false);
assert.equal(eq.sends.length, 1);
assert.equal(eq.sends[0].recipient, 'founder@example.test');
assert.ok(eq.inserted.some((row) => row.company === 'Sandbox Co'));
eq.from = undefined;

// One visitor is limited; another is unaffected.
eq.counts.clear();
const repeat = from('203.0.113.9');
for (let i = 0; i < enquiryVisitorLimit; i++)
  assert.equal((await post(valid, repeat)).status, 201);
const blocked = await post(valid, repeat);
assert.equal(blocked.status, 429);
assert.match((await blocked.json()).error, /recent enquiries/);
assert.equal((await post(valid, from('203.0.113.10'))).status, 201);
// Addresses are hashed into the allowance keys, never stored in them.
assert.ok(![...eq.counts.keys()].some((key) => key.includes('203.0.113')));
// The shared ceiling stops a visitor who still has their own allowance.
const ceiling = [...eq.counts.keys()].find((key) =>
  key.startsWith('enquiry-2'),
);
eq.counts.set(ceiling, enquiryHourlyCeiling);
const full = await post(valid, from('203.0.113.11'));
assert.equal(full.status, 429);
assert.match((await full.json()).error, /cannot accept enquiries/);

console.log(
  'PASS: bounded body, validation before storage, per-visitor and shared enquiry allowances with hashed addresses, founder notification, sender acknowledgement, recorded delivery outcome, and a captured lead surviving audit, provider and configuration failure. Database and email provider mocked; no message sent.',
);
