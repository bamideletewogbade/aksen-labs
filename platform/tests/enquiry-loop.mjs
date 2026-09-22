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
  // Intake key to lead id, standing in for the partial unique index.
  keys: new Map(),
  configured: true,
  failFounder: false,
  failAck: false,
  failAudit: false,
};
const modules = {
  'drizzle-orm': uri(
    'export const sql=(strings,...values)=>({text:strings.join("?"),values})',
  ),
  // Four statements reach execute now that capture lives in lead-intake: the
  // two allowance reservations, the lead insert, and the lookup that follows a
  // suppressed duplicate. They share one connection, so the mock tells them
  // apart by their text rather than by the order they arrive in.
  '@/db': uri(`
    // The insert names its columns, so the row is rebuilt from the statement
    // itself. A hand-written column list here would quietly mismap the values
    // the first time the real one is reordered.
    const columns = text =>
      text.split('(')[1].split(')')[0].split(',').map(name =>
        name.trim().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()));
    export const getDb=()=>({
    execute:async q=>{
      if(q.text.includes('INSERT INTO opportunities')){
        const row=Object.fromEntries(columns(q.text).map((name,i)=>[name,q.values[i]]));
        // ON CONFLICT (intake_key) DO NOTHING, modelled rather than stubbed.
        // The retry path in lead-intake only runs because the real index
        // suppresses a row, so a mock that always inserts never reaches it.
        if(row.intakeKey&&eq.keys.has(row.intakeKey))return {rows:[]};
        if(row.intakeKey)eq.keys.set(row.intakeKey,row.id);
        eq.inserted.push(row);
        return {rows:[{id:row.id}]};
      }
      if(q.text.includes('SELECT id FROM opportunities'))
        return {rows:[{id:eq.keys.get(q.values[0])}]};
      const [bucket,limit]=q.values;const used=eq.counts.get(bucket)||0;if(used>=limit)return {rows:[]};eq.counts.set(bucket,used+1);return {rows:[{requests:used+1}]}},
    insert:table=>({values:async row=>{if(table==='audit_events'){if(eq.failAudit)throw Error('SECRET AUDIT');eq.audits.push(row)}else eq.inserted.push(row)}})
  })`),
  // Never throws, matching the real one: a queue that is not migrated yet
  // returns 'unconfigured' and the lead is still captured. eq.failFounder and
  // eq.failAck model exactly that, in place of the provider throwing, because
  // nothing on this path calls a provider during the request any more.
  '@/lib/outbox': uri(`export async function enqueue(message){
    const founder=!message.dedupeKey.startsWith('lead-ack');
    if(founder?eq.failFounder:eq.failAck)return {id:message.dedupeKey,status:'unconfigured'};
    eq.sends.push(message);
    return {id:message.dedupeKey,status:'queued'};
  }`),
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
  // No send function: nothing on this path reaches a provider during the
  // request now. What is left is the configuration the two predicates in
  // lead-notification read, which is what the sandbox and offline cases turn.
  '@/lib/resend': uri(`
    export const EMAIL_REPLY_TO='founder@example.test';
    export const emailConfig=()=>({configured:eq.configured,from:eq.from||'no-reply@example.test',replyTo:'founder@example.test'});
    export const validEmail=v=>/^[^\\s@<>]+@[^\\s@<>]+\\.[^\\s@<>]+$/.test(v);`),
};
const rewrite = (file) =>
  compile(fs.readFileSync(file, 'utf8')).replace(
    /from\s+['"]([^'"]+)['"]/g,
    (_, name) => `from '${modules[name] || name}'`,
  );
// The real formatter, so the figure written into a lead is the one the pricing
// page would have shown for the same package. Registered here rather than in
// the literal above, because rewrite is not defined until this point.
modules['@/lib/currency'] = uri(rewrite('lib/currency.ts'));
modules['@/lib/rate-limit'] = uri(rewrite('lib/rate-limit.ts'));
modules['@/lib/bounded-json'] = uri(rewrite('lib/bounded-json.ts'));
modules['@/lib/lead-notification'] = uri(rewrite('lib/lead-notification.ts'));
// Real, and the point of the file. Capture, audit and the two queued messages
// moved out of the route into lead-intake, so a stub here would test the route
// against an idea of capture rather than the one every lead now goes through.
// Registered after lead-notification, which its own rewrite resolves against.
modules['@/lib/mapper-questions'] = uri(rewrite('lib/mapper-questions.ts'));
modules['@/lib/lead-intake'] = uri(rewrite('lib/lead-intake.ts'));
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
// Each scenario below is a different person. The intake key is built from the
// address, the answers and the hour, and the company name reaches none of the
// three, so cases that differed only by company would be one lead and every
// case after the first would be asserting against a suppressed duplicate.
const enquiry = (company) => ({
  ...valid,
  company,
  email: `${company.split(' ')[0].toLowerCase()}@example.test`,
});

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
assert.ok(eq.audits.some((row) => row.action === 'lead.queued'));

// A queue that cannot take the announcement is recorded against the enquiry,
// never lost silently, and never turns a captured lead into an error for the
// visitor.
eq.failFounder = true;
const quiet = await post(enquiry('Quiet Co'), from('198.51.100.3'));
assert.equal(quiet.status, 201);
assert.equal(eq.inserted.length, 2);
assert.ok(eq.audits.some((row) => row.action === 'lead.queue_failed'));
assert.ok(!(await quiet.clone().text()).includes('SECRET'));
eq.failFounder = false;

// With no email provider configured the enquiry is still captured.
eq.configured = false;
const offline = await post(enquiry('Offline Co'), from('198.51.100.4'));
assert.equal(offline.status, 201);
assert.equal((await offline.json()).acknowledged, false);
assert.equal(eq.inserted.length, 3);
eq.configured = true;

// A failing audit write cannot discard an enquiry that is already stored.
eq.failAudit = true;
const noisy = await post(enquiry('Audit Co'), from('198.51.100.5'));
assert.equal(noisy.status, 201);
assert.equal(eq.inserted.length, 4);
assert.ok(!(await noisy.text()).includes('SECRET'));
eq.failAudit = false;

// Resend's sandbox sender accepts a send to anyone and delivers only to the
// account owner, so the site must not tell a visitor a confirmation is coming.
// The enquiry is still stored and still announced to the founder.
eq.from = 'onboarding@resend.dev';
eq.sends.length = 0;
const sandbox = await post(enquiry('Sandbox Co'), from('198.51.100.6'));
assert.equal(sandbox.status, 201);
assert.equal((await sandbox.json()).acknowledged, false);
assert.equal(eq.sends.length, 1);
assert.equal(eq.sends[0].recipient, 'founder@example.test');
assert.ok(eq.inserted.some((row) => row.company === 'Sandbox Co'));
eq.from = undefined;

// The same submission arriving twice is one lead. A visitor whose connection
// drops after the insert presses the button again, and the founder must not
// have to work out which of two identical rows is the real enquiry. The second
// attempt is told the same thing as the first, so the retry is invisible to
// them, and it queues nothing: a duplicate that re-announced itself would be a
// second email about a customer who only ever wrote once.
const twice = enquiry('Repeat Co');
const leads = eq.inserted.length;
eq.sends.length = 0;
eq.audits.length = 0;
const firstTry = await post(twice, from('198.51.100.7'));
const queued = eq.sends.length;
const secondTry = await post(twice, from('198.51.100.7'));
assert.equal(firstTry.status, 201);
assert.equal(secondTry.status, 201);
assert.equal(eq.inserted.length, leads + 1, 'the retry stored a second lead');
assert.equal(queued, 2);
assert.equal(eq.sends.length, queued, 'the retry queued a second announcement');
// Same id back, so a client that retried cannot end up holding a reference to
// a lead the founder will never see.
assert.equal((await secondTry.json()).id, (await firstTry.json()).id);
assert.equal(
  eq.audits.filter((row) => row.action === 'lead.created').length,
  1,
);

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
  'PASS: bounded body, validation before storage, per-visitor and shared enquiry allowances with hashed addresses, founder announcement and sender acknowledgement queued to the outbox, recorded queue outcome, one lead from a repeated submission, and a captured lead surviving audit, queue and configuration failure. Database and outbox mocked; nothing queued leaves the test.',
);
