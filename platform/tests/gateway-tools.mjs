// Jev's route order and the gateway search's citation reader, without a
// network or the AI SDK: fetch is replaced and the SDK import is stubbed.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const compile = (source) =>
  ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
const uri = (source) =>
  'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const policyUri = uri(compile(fs.readFileSync('lib/ai-routing.ts', 'utf8')));
const jev = await import(
  uri(
    compile(fs.readFileSync('lib/jev.ts', 'utf8')).replaceAll(
      "'./ai-routing'",
      `'${policyUri}'`,
    ),
  )
);
const search = await import(
  uri(
    compile(fs.readFileSync('lib/gateway-search.ts', 'utf8')).replaceAll(
      "'ai'",
      `'${uri('export const createGateway=()=>{};export const generateText=()=>{};export const isStepCount=()=>{};')}'`,
    ),
  )
);

for (const key of [
  'AI_GATEWAY_API_KEY',
  'AI_PROVIDER',
  'TYPESAFE_API_KEY',
  'OPENROUTER_API_KEY',
  'JEV_MODEL',
  'AI_GATEWAY_JEV_MODEL',
])
  delete process.env[key];

assert.equal(jev.jevConfigured(), false);
await assert.rejects(jev.askJev({ state: '', questions: {} }));

const calls = [];
let status = () => 200;
// lib/jev.ts always passes a string URL.
globalThis.fetch = async (/** @type {string} */ url, opts) => {
  calls.push({ url, body: JSON.parse(opts.body) });
  const code = status(url);
  return new Response(
    JSON.stringify(
      code === 200
        ? { model: 'm', answers: { fit: { type: 'noul', noul: 0.8 } } }
        : {},
    ),
    { status: code },
  );
};

// The gateway goes first, with its own model id.
process.env.AI_GATEWAY_API_KEY = 'synthetic-gateway';
process.env.OPENROUTER_API_KEY = 'synthetic';
const answered = await jev.systemOne({ state: 's', questions: {} });
assert.equal(answered.provider, 'gateway');
assert.equal(
  calls[0].url,
  'https://ai-gateway.vercel.sh/typesafe/v1/systemone',
);
assert.equal(calls[0].body.model, jev.GATEWAY_JEV_MODEL);
assert.equal((await jev.askJev({ state: 's', questions: {} })).fit.noul, 0.8);

// A refused gateway call falls through to OpenRouter's Decisions API.
calls.length = 0;
status = (url) => (url.includes('ai-gateway') ? 402 : 200);
const rescued = await jev.systemOne({ state: 's', questions: {} });
assert.equal(rescued.provider, 'openrouter');
assert.equal(calls.length, 2);
assert.equal(calls[1].url, 'https://openrouter.ai/api/alpha/decisions');
assert.equal(calls[1].body.model, jev.JEV_MODEL);

// AI_PROVIDER=openrouter turns the gateway off for Jev too.
calls.length = 0;
status = () => 200;
process.env.AI_PROVIDER = 'openrouter';
assert.equal(
  (await jev.systemOne({ state: 's', questions: {} })).provider,
  'openrouter',
);
delete process.env.AI_PROVIDER;

// TypeSafe direct sits between the two.
calls.length = 0;
process.env.TYPESAFE_API_KEY = 'synthetic-typesafe';
status = (url) => (url.includes('ai-gateway') ? 500 : 200);
assert.equal(
  (await jev.systemOne({ state: 's', questions: {} })).provider,
  'typesafe',
);
delete process.env.TYPESAFE_API_KEY;

// Every route failing is the caller's error.
status = () => 503;
await assert.rejects(jev.systemOne({ state: 's', questions: {} }));
delete process.env.AI_GATEWAY_API_KEY;
delete process.env.OPENROUTER_API_KEY;

// Exa results become citations with page text, deduplicated by URL; a
// highlights-only result keeps its highlights, and errors are skipped.
const citations = search.exaCitations([
  {
    results: [
      { url: 'https://a.example/', title: 'A', text: 'info@a.example' },
      { url: 'https://a.example/', title: 'A again', text: 'duplicate' },
      { url: 'https://b.example/', highlights: ['one', 2, 'two'] },
      { title: 'no url' },
    ],
  },
  { error: 'rate_limit', message: 'slow down' },
  null,
]);
assert.deepEqual(citations, [
  { url: 'https://a.example/', title: 'A', content: 'info@a.example' },
  { url: 'https://b.example/', title: '', content: 'one\ntwo' },
]);

console.log(
  'PASS: Jev gateway-first routing with fallbacks, provider switch, and Exa citation reading.',
);
