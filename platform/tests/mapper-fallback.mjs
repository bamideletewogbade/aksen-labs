import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const compiled = ts.transpileModule(
  fs.readFileSync('lib/mapper-fallback.ts', 'utf8'),
  {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
const { mapperFallback } = await import(
  'data:text/javascript;base64,' + Buffer.from(compiled).toString('base64')
);

const result = mapperFallback([
  ['Serve customers better', 'Get more enquiries and sales'],
  ['Ghana', 'Nigeria'],
  ['WhatsApp, phone or social media', 'Spreadsheets and manual handoffs'],
]);
assert.match(result.title, /enquiry/i);
assert.match(result.summary, /Ghana|markets/i);
assert.match(result.summary, /WhatsApp/i);
assert.equal(result.steps.length, 3);
assert.match(result.humanControl, /team/i);
assert.doesNotMatch(JSON.stringify(result), /guaranteed|increase revenue|ROI/i);

console.log('mapper-fallback: all checks passed');
