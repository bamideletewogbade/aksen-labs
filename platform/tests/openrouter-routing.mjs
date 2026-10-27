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
  // The real module loads the AI SDK; the stub records what it was asked.
  './gateway-search': uri(
    'export async function gatewaySearch(o){globalThis.searchCalls.push(o);return globalThis.searchResult;}',
  ),
};
globalThis.searchCalls = [];
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
// Vercel AI Gateway goes first when its key is set, with its own model ids and
// no OpenRouter-only fields, and OpenRouter catches a gateway failure.
process.env.AI_GATEWAY_API_KEY = 'synthetic-gateway';
assert.equal(policy.gatewayEnabled(), true);
assert.equal(policy.aiConfigured(), true);
assert.equal(policy.gatewayModels()[0], policy.GATEWAY_DEFAULT_MODEL);
const urls = [];
const bodies = [];
globalThis.fetch = async (url, opts) => {
  urls.push(String(url));
  bodies.push(JSON.parse(opts.body));
  return new Response(
    JSON.stringify({
      id: 'gateway-request',
      model: 'served/model',
      choices: [{ finish_reason: 'stop', message: { content: '{"ok":true}' } }],
    }),
  );
};
const routed = await gateway.chatComplete({
  json: true,
  messages: [{ role: 'user', content: 'JSON please' }],
});
assert.equal(urls[0], 'https://ai-gateway.vercel.sh/v1/chat/completions');
assert.equal(bodies[0].model, policy.GATEWAY_DEFAULT_MODEL);
// Fallbacks live in providerOptions.gateway; a top-level models array is
// OpenRouter's spelling and the gateway ignores it.
assert.equal(bodies[0].models, undefined);
assert.ok(Array.isArray(bodies[0].providerOptions.gateway.models));
assert.equal(bodies[0].plugins, undefined);
assert.equal(bodies[0].provider, undefined);
assert.equal(routed.telemetry.provider, 'gateway');
// Web search goes to the gateway's Exa search with the gateway's model ids,
// and its pages come back as citations the evidence gate can read.
urls.length = 0;
globalThis.searchResult = {
  model: 'served/model',
  content: '{"leads":[]}',
  finishReason: 'stop',
  costDollars: 0.002,
  citations: [
    { url: 'https://example.com/', title: 'Example', content: 'Page text' },
  ],
};
const gatewaySearched = await gateway.chatComplete({
  webSearch: true,
  json: true,
  messages: [{ role: 'user', content: 'Find' }],
});
assert.equal(urls.length, 0);
assert.equal(globalThis.searchCalls.length, 1);
assert.equal(globalThis.searchCalls[0].models[0], policy.GATEWAY_DEFAULT_MODEL);
assert.equal(globalThis.searchCalls[0].apiKey, 'synthetic-gateway');
assert.equal(gatewaySearched.telemetry.provider, 'gateway');
assert.equal(gatewaySearched.citations[0].content, 'Page text');
assert.equal(gatewaySearched.costMicros, 2000);
// A call's own gateway models (Lead Scout's free-tier list) replace the
// gateway defaults there and never reach OpenRouter.
await gateway.chatComplete({
  webSearch: true,
  json: true,
  gatewayModels: policy.gatewayScoutModels(),
  messages: [],
});
assert.deepEqual(
  globalThis.searchCalls.at(-1).models,
  policy.GATEWAY_SCOUT_MODELS.split(','),
);
// A failed gateway search falls back to OpenRouter's search.
globalThis.searchResult = { content: '', citations: [] };
await gateway.chatComplete({
  webSearch: true,
  json: true,
  gatewayModels: policy.gatewayScoutModels(),
  messages: [],
});
assert.ok(urls[0].startsWith('https://openrouter.ai/'));
assert.ok(!policy.GATEWAY_SCOUT_MODELS.includes(bodies.at(-1).model));
assert.equal(bodies.at(-1).tools[0].type, 'openrouter:web_search');
urls.length = 0;
bodies.length = 0;
await gateway.chatComplete({
  models: ['example/model', 'second/model'],
  messages: [],
});
assert.ok(urls[0].startsWith('https://ai-gateway.vercel.sh/'));
assert.equal(bodies[0].model, 'example/model');
assert.deepEqual(bodies[0].providerOptions.gateway.models, ['second/model']);
// A refused gateway call is retried once on OpenRouter.
urls.length = 0;
globalThis.fetch = async (url) => {
  urls.push(String(url));
  if (String(url).includes('ai-gateway'))
    return new Response('', { status: 402 });
  return new Response(
    JSON.stringify({
      model: 'fallback/model',
      choices: [{ finish_reason: 'stop', message: { content: 'Fine' } }],
    }),
  );
};
const rescued = await gateway.chatComplete({ messages: [] });
assert.equal(urls.length, 2);
assert.equal(rescued.telemetry.provider, 'openrouter');
// Without OpenRouter, a gateway failure is the caller's error, tried once.
delete process.env.OPENROUTER_API_KEY;
urls.length = 0;
await assert.rejects(gateway.chatComplete({ messages: [] }));
assert.equal(urls.length, 1);
process.env.AI_PROVIDER = 'openrouter';
assert.equal(policy.gatewayEnabled(), false);
delete process.env.AI_PROVIDER;
delete process.env.AI_GATEWAY_API_KEY;
assert.equal(policy.aiConfigured(), false);
process.env.OPENROUTER_API_KEY = 'synthetic';
assert.equal(gateway.toCostMicros(Number.NaN), undefined);
assert.equal(gateway.toCostMicros(-1), undefined);
console.log(
  'PASS: auto/default routing, profiles, overrides, deduplication, JSON/session payload, actual-model/token/cost metadata, and empty/truncated/error/invalid-JSON rejection.',
);
