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
const catalogue = uri(
  compile(fs.readFileSync('lib/agent-workbench.ts', 'utf8')),
);
const {
  businessAgents,
  businessAgentCards,
  parseAgentBrief,
  agentSystemPrompt,
} = await import(catalogue);
assert.equal(businessAgents.length, 9);
assert.equal(new Set(businessAgents.map((a) => a.sourceNumber)).size, 9);
assert.equal(businessAgentCards().length, 3);
assert.equal(businessAgentCards(true).length, 9);
assert.ok(businessAgentCards().every((a) => a.public && !('instruction' in a)));
for (const a of businessAgents) {
  assert.equal(
    parseAgentBrief({ agent: a.id, brief: a.sample }, true).agent.id,
    a.id,
  );
  assert.ok(agentSystemPrompt(a).includes('untrusted evidence'));
  if (!a.public)
    assert.throws(() =>
      parseAgentBrief({ agent: a.id, brief: a.sample }, false),
    );
}
for (const agent of ['__proto__', 'constructor', 'unknown'])
  assert.throws(() => parseAgentBrief({ agent, brief: 'x'.repeat(40) }, true));
for (const brief of ['', 'short', 42, 'x'.repeat(8001)])
  assert.throws(() =>
    parseAgentBrief({ agent: 'opportunity-finder', brief }, false),
  );
assert.throws(() =>
  parseAgentBrief(
    { agent: 'opportunity-finder', brief: 'x'.repeat(40), snapshot: true },
    false,
  ),
);
assert.throws(() =>
  parseAgentBrief(
    { agent: 'founder-review', brief: 'x'.repeat(40), snapshot: 'true' },
    true,
  ),
);

globalThis.wb = {
  admin: false,
  quota: true,
  failProvider: false,
  failSave: false,
  queries: [],
  logs: [],
  calls: 0,
  counts: new Map(),
};
const modules = {
  'drizzle-orm': uri(
    'export const sql=(strings,...values)=>({text:strings.join("?"),values})',
  ),
  // The allowance table is modelled with real counters so the limits are
  // exercised, not stubbed. wb.quota=false denies every reservation outright.
  '@/db': uri(
    'export const getDb=()=>({execute:async q=>{wb.queries.push(q);if(q.text.includes("workspace_demo_usage")){if(!wb.quota)return {rows:[]};const [bucket,limit]=q.values;const used=wb.counts.get(bucket)||0;if(used>=limit)return {rows:[]};wb.counts.set(bucket,used+1);return {rows:[{requests:used+1}]}}if(q.text.startsWith("INSERT INTO agent_runs")&&wb.failSave)throw Error("SECRET DB");if(q.text.includes("FROM projects"))return {rows:[{name:"Owned project",stage:"delivery"}]};return {rows:[]}}})',
  ),
  '@/lib/bounded-json': uri(
    compile(fs.readFileSync('lib/bounded-json.ts', 'utf8')),
  ),
  '@/lib/workspace-access': uri(
    'export async function workspaceUser(){if(!wb.admin)throw Error("Denied");return {userId:"owner-a"}}',
  ),
  '@/lib/openrouter': uri(
    'export async function chatComplete(options){wb.calls++;wb.prompt=options;if(wb.failProvider)throw Error("SECRET PROVIDER");return {content:"Draft based on provided facts.",model:"mock",costMicros:1,telemetry:{model:"mock"}}}',
  ),
  '@/lib/agent-runs': uri(
    'export async function logAgentRun(row){wb.logs.push(row)}',
  ),
  '@/lib/agent-workbench': catalogue,
};
// Compile a real module, pointing its imports at the mocks above. The shared
// rate limiter is loaded the same way so the allowance logic under test is the
// one that actually ships, not a copy.
const rewrite = (file) =>
  compile(fs.readFileSync(file, 'utf8')).replace(
    /from\s+['"]([^'"]+)['"]/g,
    (_, name) => `from '${modules[name] || name}'`,
  );
modules['@/lib/rate-limit'] = uri(rewrite('lib/rate-limit.ts'));
const runtime = rewrite('lib/agent-workbench-runtime.ts');
const {
  runBusinessAgent,
  savedBusinessDrafts,
  adminHourlyLimit,
  visitorHourlyLimit,
  publicHourlyBudget,
} = await import(uri(runtime));
const input = {
  agent: 'opportunity-finder',
  brief:
    'Fictional private brief: our business receives 20 enquiries per week.',
};
const request = (body = input, admin = false, headers = {}) =>
  runBusinessAgent(
    new Request('https://aksen.test/api/business-agents', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
    admin,
  );
assert.equal((await request(input, true)).status, 403);
assert.equal((await savedBusinessDrafts()).status, 403);
assert.equal(
  (await request(input, false, { origin: 'https://other.test' })).status,
  403,
);
assert.equal(
  (await request(input, false, { 'sec-fetch-site': 'cross-site' })).status,
  403,
);
assert.equal(wb.calls, 0);
assert.equal(wb.queries.length, 0);
assert.equal(
  (await request({ ...input, agent: 'cost-review', admin: true })).status,
  400,
);
assert.equal((await request({ ...input, snapshot: true })).status, 400);
assert.equal((await request('{')).status, 400);
assert.equal((await request('x'.repeat(40001))).status, 413);
assert.equal(wb.calls, 0);
wb.quota = false;
assert.equal((await request()).status, 429);
assert.equal(wb.calls, 0);
wb.quota = true;
const publicResult = await request();
assert.equal(publicResult.status, 200);
assert.equal(publicResult.headers.get('cache-control'), 'private, no-store');
assert.equal((await publicResult.json()).saved, false);
assert.ok(!JSON.stringify(wb.logs).includes('Fictional private brief'));
assert.ok(!JSON.stringify(wb.logs).includes('Draft based on provided facts'));
assert.ok(
  !wb.queries.some(
    (q) =>
      q.text.includes('FROM projects') ||
      q.text.startsWith('INSERT INTO agent_runs'),
  ),
);
wb.admin = true;
const privateResult = await request(
  { agent: 'founder-review', brief: input.brief, snapshot: true },
  true,
);
assert.equal(privateResult.status, 200);
assert.equal((await privateResult.json()).saved, true);
const projectQuery = wb.queries.find((q) => q.text.includes('FROM projects'));
assert.ok(projectQuery.text.includes('WHERE owner_id=?'));
assert.ok(projectQuery.values.includes('owner-a'));
assert.ok(projectQuery.text.includes('LIMIT 25'));
assert.ok(wb.prompt.messages[1].content.includes('not a full weekly history'));
const savedQuery = wb.queries.find((q) =>
  q.text.startsWith('INSERT INTO agent_runs'),
);
const trace = JSON.parse(savedQuery.values.at(-1));
assert.equal(trace.ownerId, 'owner-a');
assert.equal(trace.agentId, 'founder-review');
assert.ok(trace.content);
assert.ok(!('brief' in trace));
assert.equal((await savedBusinessDrafts()).status, 200);
assert.ok(wb.queries.at(-1).text.includes("trace->>'ownerId'=?"));
assert.deepEqual(wb.queries.at(-1).values, ['owner-a']);
wb.failSave = true;
assert.equal(
  (await request({ ...input, agent: 'cost-review' }, true)).status,
  503,
);
wb.failSave = false;
wb.failProvider = true;
const failure = await request();
assert.equal(failure.status, 503);
assert.ok(!(await failure.text()).includes('SECRET'));
wb.failProvider = false;
wb.admin = false;
wb.counts.clear();
const from = (address) => ({ 'cf-connecting-ip': address });
const sharedBucket = () =>
  [...wb.counts.keys()].find((key) =>
    key.startsWith('agent-workbench-public-'),
  );
for (let run = 0; run < visitorHourlyLimit; run++)
  assert.equal((await request(input, false, from('198.51.100.7'))).status, 200);
const capped = await request(input, false, from('198.51.100.7'));
assert.equal(capped.status, 429);
assert.match((await capped.json()).error, /free drafts for this hour/);
// A second visitor still gets through, which the single shared bucket prevented.
assert.equal((await request(input, false, from('198.51.100.8'))).status, 200);
// The capped visitor spent only their own allowance of the shared budget.
assert.equal(wb.counts.get(sharedBucket()), visitorHourlyLimit + 1);
// Addresses are hashed, so no bucket key carries one.
assert.ok(![...wb.counts.keys()].some((key) => key.includes('198.51.100')));
assert.ok(
  [...wb.counts.keys()].some((key) =>
    key.startsWith('agent-workbench-visitor-'),
  ),
);
// The forwarded header is used only when Cloudflare's is absent.
assert.equal(
  (
    await request(input, false, {
      'x-forwarded-for': '203.0.113.4, 70.41.3.18',
    })
  ).status,
  200,
);
// Callers we cannot tell apart share one small bucket rather than going free.
assert.equal((await request(input, false)).status, 200);
assert.ok(
  [...wb.counts.keys()].some((key) =>
    key.startsWith('agent-workbench-visitor-unidentified-'),
  ),
);
// The shared budget stops a visitor who still has their own allowance left.
wb.counts.set(sharedBucket(), publicHourlyBudget);
const busy = await request(input, false, from('198.51.100.9'));
assert.equal(busy.status, 429);
assert.match((await busy.json()).error, /busy right now/);
// Each administrator keeps a separate allowance.
wb.counts.clear();
wb.admin = true;
for (let run = 0; run < adminHourlyLimit; run++)
  assert.equal((await request(input, true)).status, 200);
assert.equal((await request(input, true)).status, 429);
assert.ok(
  [...wb.counts.keys()].every((key) =>
    key.startsWith('agent-workbench-owner-a-'),
  ),
);
assert.match(
  fs.readFileSync('components/site-chrome.tsx', 'utf8'),
  /href: '\/business-agents'/,
);
assert.match(
  fs.readFileSync('app/api/business-agents/route.ts', 'utf8'),
  /runBusinessAgent\(request, false\)/,
);
assert.match(
  fs.readFileSync('app/api/admin/business-agents/route.ts', 'utf8'),
  /runBusinessAgent\(request, true\)/,
);
console.log(
  'PASS: nine curated roles, three public tools, private access, source isolation, request limits, per-visitor and shared allowances with hashed addresses, per-administrator allowances, navigation entry, owner-scoped snapshot/history, public logging privacy, saved drafts, and provider/storage failure handling. Provider and database mocked; no external actions.',
);
