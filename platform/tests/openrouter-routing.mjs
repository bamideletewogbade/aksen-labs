process.on('uncaughtException', (error) => {
  console.error('Test failed:', error.message);
  process.exitCode = 1;
});
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
const policy = await import(policyUri);
const dependencies = {
  './ai-routing': policyUri,
  './ai-text': uri(compile(fs.readFileSync('lib/ai-text.ts', 'utf8'))),
  './log-policy': uri(compile(fs.readFileSync('lib/log-policy.ts', 'utf8'))),
  './request-context': uri(
    compile(fs.readFileSync('lib/request-context.ts', 'utf8')),
  ),
  './backend-events': uri(
    'export async function logBackendEvent(){return true;}',
  ),
};
let gatewaySource = compile(fs.readFileSync('lib/openrouter.ts', 'utf8'));
for (const [name, url] of Object.entries(dependencies))
  gatewaySource = gatewaySource
    .replaceAll(`'${name}'`, `'${url}'`)
    .replaceAll(`"${name}"`, `"${url}"`);
const gateway = await import(uri(gatewaySource));
if (process.argv.includes('--live')) {
  process.loadEnvFile('.env');
  const networkFetch = globalThis.fetch;
  globalThis.fetch = async (...args) => {
    const response = await networkFetch(...args);
    if (!response.ok) {
      const data = await response
        .clone()
        .json()
        .catch(() => ({}));
      console.log(
        'Provider response:',
        response.status,
        String(data.error?.message || 'No error detail').slice(0, 300),
      );
    }
    return response;
  };
  for (const [routing, profile] of [
    ['auto', 'conversation'],
    ['default', 'conversation'],
    ['auto', 'structured'],
  ]) {
    const result = await gateway.chatComplete({
      routing,
      profile,
      json: profile === 'structured',
      maxTokens: 200,
      timeoutMs: 45000,
      messages: [
        {
          role: 'system',
          content:
            profile === 'structured'
              ? 'Return a JSON object with status ok and amount 450.'
              : 'Use only the fictional fact: a sample shelf costs GHS 450. Answer in one sentence.',
        },
        {
          role: 'user',
          content:
            profile === 'structured'
              ? 'Return the JSON test object.'
              : 'How much is the sample shelf?',
        },
      ],
    });
    assert.ok(result.content.includes('450'));
    if (profile === 'structured')
      assert.equal(JSON.parse(result.content).amount, 450);
    console.log(
      `PASS live ${routing}/${profile}: actual=${result.model}; cost USD micros=${result.costMicros ?? 'unreported'}; request=${result.telemetry.requestId || 'unreported'}`,
    );
  }
  process.exit(0);
}
for (const key of Object.keys(process.env).filter((k) =>
  k.startsWith('OPENROUTER_'),
))
  delete process.env[key];
process.env.OPENROUTER_API_KEY = 'synthetic';
assert.equal(policy.routingConfig().models[0], 'openrouter/auto');
assert.equal(policy.routingConfig('drafting').costTier, 'medium');
process.env.OPENROUTER_ROUTING_MODE = 'default';
process.env.OPENROUTER_MODEL = 'example/model';
assert.equal(policy.routingConfig().models[0], 'example/model');
process.env.OPENROUTER_FALLBACK_MODELS =
  'example/model, second/model,second/model,third/model';
assert.deepEqual(policy.routingConfig().models, [
  'example/model',
  'second/model',
  'third/model',
]);
delete process.env.OPENROUTER_ROUTING_MODE;
delete process.env.OPENROUTER_FALLBACK_MODELS;
delete process.env.OPENROUTER_MODEL;
let sent;
globalThis.fetch = async (url, opts) => {
  sent = JSON.parse(opts.body);
  return new Response(
    JSON.stringify({
      id: 'sample-request',
      model: 'actual/model',
      choices: [{ finish_reason: 'stop', message: { content: '{"ok":true}' } }],
      usage: { cost: 0.0004, prompt_tokens: 8, completion_tokens: 5 },
    }),
  );
};
const result = await gateway.chatComplete({
  profile: 'structured',
  json: true,
  sessionId: 'test-session',
  messages: [{ role: 'user', content: 'JSON please' }],
});
assert.equal(sent.model, 'openrouter/auto');
assert.equal(sent.plugins[0].id, 'auto-router');
assert.equal(sent.provider.require_parameters, true);
assert.equal(sent.session_id, 'test-session');
assert.equal(result.telemetry.model, 'actual/model');
assert.equal(result.costMicros, 400);
assert.equal(result.telemetry.promptTokens, 8);
await gateway.chatComplete({ routing: 'default', messages: [] });
assert.equal(sent.plugins, undefined);
assert.equal(sent.model, policy.DEFAULT_MODEL);
globalThis.fetch = async (_url, opts) => {
  sent = JSON.parse(opts.body);
  return new Response(
    JSON.stringify({
      choices: [
        {
          message: {
            content: '{"leads":[]}',
            annotations: [
              {
                type: 'url_citation',
                url_citation: {
                  url: 'https://example.com/',
                  title: 'Example',
                  content: 'Business source',
                },
              },
            ],
          },
        },
      ],
    }),
  );
};
const searched = await gateway.chatComplete({
  webSearch: true,
  json: true,
  messages: [],
});
assert.equal(sent.tools[0].type, 'openrouter:web_search');
assert.equal(sent.tools[0].parameters.max_uses, 2);
assert.equal(sent.max_tool_calls, 2);
assert.equal(searched.citations[0].content, 'Business source');
for (const payload of [
  { choices: [{ message: { content: '' } }] },
  { choices: [{ finish_reason: 'length', message: { content: 'Partial' } }] },
  { error: { message: 'provider failure' } },
  { choices: [{ message: { content: 'not json' } }] },
]) {
  globalThis.fetch = async () => new Response(JSON.stringify(payload));
  await assert.rejects(gateway.chatComplete({ json: true, messages: [] }));
}
let calls = 0;
globalThis.fetch = async () => {
  calls++;
  return new Response('', { status: 401 });
};
await assert.rejects(gateway.chatComplete({ messages: [] }));
assert.equal(calls, 1);
assert.equal(gateway.toCostMicros(Number.NaN), undefined);
assert.equal(gateway.toCostMicros(-1), undefined);
console.log(
  'PASS: auto/default routing, profiles, overrides, deduplication, JSON/session payload, actual-model/token/cost metadata, and empty/truncated/error/invalid-JSON rejection.',
);
