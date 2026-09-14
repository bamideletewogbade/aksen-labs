import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const uri = (s) =>
  'data:text/javascript;base64,' + Buffer.from(s).toString('base64');
const compile = (s) =>
  ts.transpileModule(s, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
const { publicUrl, validateProspects } = await import(
  uri(compile(fs.readFileSync('lib/prospect-evidence.ts', 'utf8')))
);
for (const url of [
  'javascript:alert(1)',
  'https://127.0.0.1',
  'http://user:pass@example.com',
  'http://[::1]',
  'http://test.local',
  'https://test.com:9000',
])
  assert.equal(publicUrl(url), null);
const sources = [
  {
    url: 'https://cedar.example/contact',
    title: 'Cedar Home',
    content:
      'Cedar Home: hello@cedar.example; +233 20 123 4567. https://www.linkedin.com/company/cedar-home/',
  },
];
const lead = {
  company: 'Cedar Home',
  website: 'https://cedar.example',
  description: 'Furniture',
  opportunity: 'Hypothesis: quotation support',
  sources: [sources[0].url],
  contacts: [
    { kind: 'email', value: 'hello@cedar.example', source: sources[0].url },
    { kind: 'email', value: 'invented@cedar.example', source: sources[0].url },
    { kind: 'phone', value: '+233 20 123 4567', source: sources[0].url },
    {
      kind: 'linkedin',
      value: 'https://www.linkedin.com/company/cedar-home/',
      source: sources[0].url,
    },
    {
      kind: 'linkedin',
      value: 'https://linkedin.com/in/private-person',
      source: sources[0].url,
    },
  ],
};
assert.equal(
  validateProspects({ leads: [lead] }, sources)[0].contacts.length,
  3,
);
assert.equal(validateProspects({ leads: [lead] }, []).length, 0);
assert.equal(
  validateProspects(
    { leads: [{ ...lead, website: 'https://invented.example' }] },
    sources,
  ).length,
  0,
);
assert.equal(
  validateProspects(
    { leads: [lead] },
    sources.map((s) => ({ ...s, content: '' })),
  )[0].contacts.length,
  0,
);
assert.throws(() => validateProspects({ notLeads: [] }, sources));
const prospectingSource = compile(fs.readFileSync('lib/prospecting.ts', 'utf8'))
  .replace(
    "from './prospect-evidence'",
    `from '${uri(compile(fs.readFileSync('lib/prospect-evidence.ts', 'utf8')))}'`,
  )
  .replace(
    "from './openrouter'",
    `from '${uri('export async function chatComplete(){throw new Error("not called")}')}'`,
  )
  .replace(
    "from './backend-events'",
    `from '${uri('export async function logBackendEvent(){}')}'`,
  )
  .replace(
    "from '@/db'",
    `from '${uri('export function getDb(){throw new Error("not called")}')}'`,
  )
  .replace(
    "from './scout-limits'",
    `from '${uri(compile(fs.readFileSync('lib/scout-limits.ts', 'utf8')))}'`,
  )
  .replace("from 'drizzle-orm'", `from '${uri('export const sql=()=>[]')}'`);
const { parseProspectCandidates } = await import(uri(prospectingSource));
assert.deepEqual(
  parseProspectCandidates(
    '{"candidates":[{"company":"Cedar","website":"https://cedar.example"},{"company":"Unsafe","website":"http://127.0.0.1"}]}',
  ),
  [{ company: 'Cedar', website: 'https://cedar.example/' }],
);
assert.deepEqual(
  parseProspectCandidates(
    '{"candidates":[{"company":"Social only","website":"https://www.linkedin.com/company/social-only"}]}',
  ),
  [],
);
globalThis.scoutAuth = false;
globalThis.scoutQueries = 0;
const mods = {
  'drizzle-orm': uri('export const sql=(...x)=>x'),
  '@/db': uri(
    'export const getDb=()=>({execute:async()=>{globalThis.scoutQueries++;return {rows:[]}}})',
  ),
  '@/lib/workspace-access': uri(
    'export async function workspaceUser(){if(!globalThis.scoutAuth)throw new Error("Forbidden");return {userId:"owner"}}',
  ),
  '@/lib/request-log': uri('export const withRequestLog=(_p,h)=>h'),
  '@/lib/bounded-json': uri(
    compile(fs.readFileSync('lib/bounded-json.ts', 'utf8')),
  ),
  '@/lib/prospecting': uri(
    'export async function runProspecting(){throw new Error("not expected")};export const promoteProspectQuery=()=>[];export const reviewProspectQuery=()=>[]',
  ),
  // The real module, so the route is tested against the limits it will
  // actually enforce rather than against numbers invented for the test.
  '@/lib/scout-limits': uri(
    compile(fs.readFileSync('lib/scout-limits.ts', 'utf8')),
  ),
};
const code = compile(
  fs.readFileSync('app/api/admin/prospects/route.ts', 'utf8'),
).replace(
  /from\s+['"]([^'"]+)['"]/g,
  (_, name) => `from '${mods[name] || name}'`,
);
const { GET, POST } = await import(uri(code));
const post = (body, headers = {}) =>
  POST(
    new Request('https://local/api/admin/prospects', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );
assert.equal((await GET()).status, 403);
assert.equal((await post({ action: 'discover' })).status, 403);
assert.equal(globalThis.scoutQueries, 0);
globalThis.scoutAuth = true;
assert.equal((await post({}, { origin: 'https://elsewhere' })).status, 403);
assert.equal((await post('x'.repeat(4097))).status, 400);
assert.equal(
  (await post({ action: 'configure', target: 'short' })).status,
  400,
);
assert.equal(
  (await post({ action: 'configure', target: 'Ghana furniture businesses' }))
    .status,
  200,
);
console.log(
  'PASS: source matching, unsupported contact rejection, private-profile exclusion, URL safety, authentication before database access, origin and payload limits.',
);
