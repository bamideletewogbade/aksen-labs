// Read credits by default. --live also makes small synthetic provider calls.
// No business records, outreach, or database writes.
import fs from 'node:fs';
import ts from 'typescript';
import assert from 'node:assert/strict';
process.loadEnvFile('.env');
const uri = (s) =>
  'data:text/javascript;base64,' + Buffer.from(s).toString('base64');
function source(file) {
  return ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
}
const policyUri = uri(source('lib/ai-routing.ts'));
const policy = await import(policyUri);
const { gatewayCredits } = await import(uri(source('lib/gateway-credits.ts')));
console.log('Credits before:', await gatewayCredits());
if (!process.argv.includes('--live')) process.exit(0);
if (!policy.gatewayEnabled())
  throw new Error('Vercel AI Gateway is not active.');
// Make this a gateway-only probe, so backup success cannot hide a broken route.
delete process.env.OPENROUTER_API_KEY;
delete process.env.TYPESAFE_API_KEY;
const { systemOne } = await import(
  uri(source('lib/jev.ts').replaceAll("'./ai-routing'", `'${policyUri}'`))
);
const { gatewaySearch } = await import(
  uri(
    source('lib/gateway-search.ts').replaceAll(
      "'ai'",
      `'${import.meta.resolve('ai')}'`,
    ),
  )
);
let failures = 0;
for (const [name, probe] of [
  [
    'decision model',
    async () => {
      const result = await systemOne({
        state: 'This fictional shop opens at 9am.',
        questions: {
          opens_at_nine: {
            type: 'noul',
            instructions: 'Does the shop open at 9am?',
          },
        },
        timeoutMs: 25000,
      });
      assert.equal(result.provider, 'gateway');
      assert.equal(typeof result.body.answers?.opens_at_nine?.noul, 'number');
      return { provider: result.provider, model: result.body.model };
    },
  ],
  [
    'search with source evidence',
    async () => {
      const result = await gatewaySearch({
        apiKey: process.env.AI_GATEWAY_API_KEY,
        models: policy.gatewayScoutModels(),
        messages: [
          {
            role: 'system',
            content:
              'Use web search to find the official Vercel AI Gateway pricing page. Return a JSON object with a short summary.',
          },
          { role: 'user', content: 'What is the monthly free credit?' },
        ],
        temperature: 0,
        maxTokens: 600,
        signal: AbortSignal.timeout(45000),
      });
      assert.ok(result.content);
      assert.ok(result.citations.some((c) => c.url && c.content));
      return {
        model: result.model,
        citations: result.citations.length,
        costDollars: result.costDollars,
      };
    },
  ],
]) {
  try {
    console.log('PASS', name, await probe());
  } catch (error) {
    failures++;
    console.error(
      'FAIL',
      name,
      error instanceof Error ? error.message.slice(0, 240) : 'Unknown error',
    );
  }
}
console.log('Credits after:', await gatewayCredits());
process.exitCode = failures ? 1 : 0;
