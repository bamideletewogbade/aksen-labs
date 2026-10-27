import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const source = ts.transpileModule(
  fs.readFileSync('lib/gateway-credits.ts', 'utf8'),
  {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
const { gatewayCredits } = await import(
  'data:text/javascript;base64,' + Buffer.from(source).toString('base64')
);
delete process.env.AI_GATEWAY_API_KEY;
assert.deepEqual(await gatewayCredits(), { status: 'not-configured' });
process.env.AI_GATEWAY_API_KEY = 'synthetic';
globalThis.fetch = async (_url, options) => {
  assert.equal(options.cache, 'no-store');
  return Response.json({ balance: '4.95', total_used: '0.05' });
};
assert.deepEqual(await gatewayCredits(), {
  status: 'available',
  balance: 4.95,
  totalUsed: 0.05,
});
for (const body of [
  {},
  { balance: null, total_used: 0 },
  { balance: '', total_used: 0 },
  { balance: 'bad', total_used: 0 },
]) {
  globalThis.fetch = async () => Response.json(body);
  assert.deepEqual(await gatewayCredits(), { status: 'unavailable' });
}
globalThis.fetch = async () => Response.json({ balance: '0', total_used: '5' });
assert.equal((await gatewayCredits()).balance, 0);
globalThis.fetch = async () =>
  new Response('secret upstream details', { status: 401 });
assert.deepEqual(await gatewayCredits(), { status: 'unavailable' });
globalThis.fetch = async () => {
  throw new Error('network');
};
assert.deepEqual(await gatewayCredits(), { status: 'unavailable' });
console.log(
  'PASS: credit balance parsing, zero balance, unavailable responses and network failure.',
);
