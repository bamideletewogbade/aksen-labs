import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const uri = (source) =>
  'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const compile = (file) =>
  ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
const modules = {
  '@/lib/request-log': uri(
    'export const withRequestLog=(path,handler)=>handler;',
  ),
  '@/lib/pricing': uri('export const resolvePricingSelection=()=>null;'),
  '@/lib/currency': uri('export const formatPrice=()=>"";'),
  'next/server': uri(
    'export const NextResponse={json:(value,init)=>Response.json(value,init)};',
  ),
  '@/db': uri('export const getDb=()=>({});'),
  '@/lib/workflow-suggestion': uri(
    'export const workflowSuggestion=()=>"A starting point";',
  ),
  '@/lib/bounded-json': uri(
    'export const boundedJson=(request)=>request.json();',
  ),
  '@/lib/rate-limit': uri(
    'export const currentHour=()=>"2026-09-19-09";export const reserve=async()=>true;export const visitorKey=async()=>"test";',
  ),
  '@/lib/lead-intake': uri(
    'export const intakeKey=async()=>"key";export const captureLead=async input=>{globalThis.captured=input;return {id:"lead-1",acknowledged:false}};',
  ),
  '@/lib/mapper-questions': uri(compile('lib/mapper-questions.ts')),
};
const routeSource = compile('app/api/opportunities/route.ts').replace(
  /from\s+['"]([^'"]+)['"]/g,
  (_, name) => `from '${modules[name] || name}'`,
);
const { POST } = await import(uri(routeSource));
const send = (body) =>
  POST(
    new Request('https://aksen.test/api/opportunities', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );

const input = {
  name: 'Ama',
  email: 'ama@example.test',
  company: '',
  answerFormat: 'goal-market-setup',
  answers: [
    ['Get more enquiries and sales', 'Serve customers better'],
    ['Ghana', 'Another African country'],
    ['WhatsApp, phone or social media', 'Spreadsheets and manual handoffs'],
  ],
  otherMarket: 'Côte d’Ivoire',
  example:
    'The team checks stock in a spreadsheet before answering WhatsApp enquiries.',
  recommendation: 'A clearer enquiry and follow-up flow',
};
assert.equal((await send({ ...input, otherMarket: '' })).status, 400);
assert.equal(
  (
    await send({
      ...input,
      answers: [input.answers[0], input.answers[1], ['Something else']],
      otherTools: '',
    })
  ).status,
  400,
);
assert.equal(
  (await send({ ...input, answers: [[], ...input.answers.slice(1)] })).status,
  400,
);
assert.equal(
  (await send({ ...input, answers: [['Unknown'], ...input.answers.slice(1)] }))
    .status,
  400,
);
assert.equal((await send(input)).status, 201);
assert.match(
  globalThis.captured.summary,
  /Get more enquiries and sales; Serve customers better/,
);
assert.match(
  globalThis.captured.summary,
  /Ghana; Another African country \(Côte d’Ivoire\)/,
);
assert.match(
  globalThis.captured.summary,
  /WhatsApp, phone or social media; Spreadsheets/,
);
assert.match(globalThis.captured.summary, /The team checks stock/);
assert.equal(globalThis.captured.company, '');

// Old cached pages can still send one string per question.
assert.equal(
  (
    await send({
      name: 'Kojo',
      email: 'kojo@example.test',
      company: 'Example Ltd',
      answers: ['Old goal', 'Old market', 'Old setup'],
      answerFormat: 'goal-market-setup',
    })
  ).status,
  201,
);
// The seven-step mapper sends its answers as an object and what was shown.
const diagnostic = {
  name: 'Efua',
  email: 'efua@example.test',
  company: '',
  answerFormat: 'diagnostic-v2',
  intake: {
    business: 'Food, drinks or catering',
    problem: 'profit',
    symptoms: [
      'Orders get lost, mixed up or forgotten',
      'We chase customers for payment',
    ],
    channels: ['WhatsApp', 'Phone calls'],
    tools: ['Memory, paper or a notebook'],
    markets: ['Ghana'],
    volume: '50 to 200',
    team: '2 to 5 people',
    example: 'Two party trays went to the wrong address last Saturday.',
  },
  recommendation: 'Stop the time and money slipping out of each sale',
  reportSummary:
    'First fix: One order list the whole team can see (One workflow).',
  needsReview: true,
};
assert.equal((await send(diagnostic)).status, 201);
assert.equal(
  globalThis.captured.work,
  'We sell, but time or money keeps slipping away',
);
assert.match(globalThis.captured.desiredOutcome, /Orders get lost/);
assert.match(globalThis.captured.summary, /wrong address last Saturday/);
assert.match(globalThis.captured.summary, /One order list/);
assert.match(globalThis.captured.summary, /a person should read/);
assert.equal(globalThis.captured.detail.problem, 'profit');
// Refused with the intake's own reason, before anything is captured.
globalThis.captured = null;
const refused = await send({
  ...diagnostic,
  intake: {
    ...diagnostic.intake,
    symptoms: ['Posts get likes but few messages'],
  },
});
assert.equal(refused.status, 400);
assert.match((await refused.json()).error, /not on the list/);
assert.equal(globalThis.captured, null);
assert.equal((await send({ ...diagnostic, email: 'nope' })).status, 400);

console.log('mapper-enquiry: all checks passed');
