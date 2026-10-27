process.on('uncaughtException', (error) => {
  console.error('Test failed:', error.message);
  process.exitCode = 1;
});
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

// The Front Desk's numbers live in code so the model never adds up a total.
// These checks are the reason that is safe to say on the page.
const source = ts.transpileModule(fs.readFileSync('lib/front-desk.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const desk = await import(
  'data:text/javascript;base64,' + Buffer.from(source).toString('base64')
);

assert.equal(desk.searchCatalogue('big shea butter tub')[0].sku, 'shea-5l');
assert.equal(desk.searchCatalogue('black soap')[0].sku, 'soap-500');
assert.equal(desk.searchCatalogue('perfume').length, 0);
assert.equal(desk.searchCatalogue('').length, desk.catalogue.length);

assert.equal(desk.findDeliveryArea('14 Spintex Road').area, 'Accra');
assert.equal(desk.findDeliveryArea('Community 11, Tema').area, 'Tema');
assert.equal(desk.findDeliveryArea('Kumasi'), null);

// The homepage story: one 5 litre tub to Spintex is GHS 510.
const homepage = desk.draftOrder({
  lines: [{ sku: 'shea-5l', quantity: 1 }],
  customerName: 'Ama Boateng',
  phone: '024 555 0198',
  area: 'Spintex',
  address: '14 Spintex Road',
});
assert.equal(homepage.total, 'GHS 510');
assert.equal(homepage.ready, true);

const partial = desk.draftOrder({
  lines: [
    { sku: 'soap-500', quantity: 2 },
    { sku: 'shea-1l', quantity: 1 },
  ],
  area: 'Tema',
});
assert.equal(partial.total, 'GHS 240');
assert.equal(partial.ready, false);
assert.deepEqual(partial.missing, [
  'a name for the order',
  'a number the rider can call',
  'the delivery address',
]);

// Things the agent may not decide never reach a total.
const blocked = desk.draftOrder({
  lines: [
    { sku: 'coconut-1l', quantity: 1 },
    { sku: 'shea-5l', quantity: 20 },
    { sku: 'made-up', quantity: 1 },
  ],
  customerName: 'Test',
  phone: '000',
  area: 'Kumasi',
  address: 'Somewhere',
});
assert.equal(blocked.ready, false);
assert.equal(blocked.total, null);
assert.equal(blocked.problems.length, 4);

console.log(
  'PASS: catalogue search, delivery areas, totals in code, missing details, and off-list items kept from a total.',
);
