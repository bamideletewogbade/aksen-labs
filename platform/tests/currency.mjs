// Run: node tests/currency.mjs
//
// Prices stopped being formatted strings and became shapes that convert. The
// risk that introduces is a wrong number in front of a customer, so these check
// the arithmetic, the rounding, the country defaults and that every published
// price still renders in all three currencies.
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

const built = new Map();
function moduleUrl(name) {
  const cached = built.get(name);
  if (cached) return cached;
  const compiled = compile(fs.readFileSync(`lib/${name}.ts`, 'utf8')).replace(
    /from '\.\/([a-z-]+)'/g,
    (_, dependency) => `from '${moduleUrl(dependency)}'`,
  );
  const url = uri(compiled);
  built.set(name, url);
  return url;
}

const {
  convert,
  formatPrice,
  formatMoney,
  currencyForCountry,
  isCurrency,
  isSetPrice,
  allSetFor,
  CURRENCY_INFO,
  CURRENCIES,
} = await import(moduleUrl('currency'));
const { stages, carePlans, pricingGroups } = await import(moduleUrl('pricing'));

// ---- the country default, which is what most visitors get ----
assert.equal(currencyForCountry('GH'), 'GHS');
assert.equal(
  currencyForCountry('gh'),
  'GHS',
  'the header case must not matter',
);
assert.equal(currencyForCountry('NG'), 'NGN');
assert.equal(
  currencyForCountry('KE'),
  'USD',
  'an unlisted country gets dollars',
);
assert.equal(
  currencyForCountry(null),
  'USD',
  'a missing country must not throw',
);
assert.equal(
  currencyForCountry('XX'),
  'USD',
  'Cloudflare sends XX when it cannot place a client',
);

assert.ok(isCurrency('NGN'));
assert.ok(!isCurrency('EUR'));
assert.ok(!isCurrency(''));
assert.ok(!isCurrency(null));

// ---- conversion and rounding ----
// Cedis are the base and must never be altered by a rounding step.
for (const amount of [900, 1500, 3000, 18000, 65000]) {
  assert.equal(convert(amount, 'GHS'), amount, 'a cedi figure was rounded');
}

// Converted figures land on the currency's step, so a price reads as a price
// rather than as the output of a spreadsheet.
for (const currency of ['NGN', 'USD']) {
  const step = CURRENCY_INFO[currency].step;
  for (const amount of [900, 1500, 3000, 8000, 18000, 60000]) {
    const value = convert(amount, currency);
    assert.equal(
      value % step,
      0,
      `${amount} in ${currency} is not on the ${step} step`,
    );
    assert.ok(value > 0, 'a converted price rounded away to nothing');
    // Rounding must stay close to the true figure, or it is not the price.
    const exact = amount * CURRENCY_INFO[currency].perCedi;
    assert.ok(
      Math.abs(value - exact) <= step,
      `${amount} in ${currency} rounded further than one step`,
    );
  }
}

// A tiny amount must not round to zero, which would advertise something free.
assert.ok(convert(1, 'USD') > 0);
assert.ok(convert(1, 'NGN') > 0);

// ---- formatting ----
assert.equal(formatMoney(1500, 'GHS'), 'GH₵1,500');
assert.match(formatMoney(1500, 'NGN'), /^₦[\d,]+$/);
assert.match(formatMoney(1500, 'USD'), /^\$[\d,]+$/);

assert.equal(formatPrice({ kind: 'exact', from: 1500 }, 'GHS'), 'GH₵1,500');
assert.equal(formatPrice({ kind: 'from', from: 3000 }, 'GHS'), 'From GH₵3,000');
assert.equal(
  formatPrice({ kind: 'range', from: 3000, to: 6000 }, 'GHS'),
  'GH₵3,000–6,000',
  'a range shows the symbol once, or it reads as two separate prices',
);
assert.equal(
  formatPrice({ kind: 'from', from: 900, per: 'month' }, 'GHS'),
  'From GH₵900/mo',
);
assert.equal(
  formatPrice({ kind: 'range', from: 8000, to: 20000, note: 'add-on' }, 'GHS'),
  'GH₵8,000–20,000 add-on',
);
// A custom price is a phrase and must survive every currency untouched.
for (const currency of CURRENCIES) {
  assert.equal(
    formatPrice({ kind: 'custom', label: 'Custom retainer' }, currency),
    'Custom retainer',
  );
}

// ---- every published price, in every currency ----
const everyPrice = [
  ...stages.map((s) => s.price),
  ...pricingGroups.flatMap((g) => g.packages.map((p) => p.price)),
  ...carePlans.map((p) => p.price),
];
assert.ok(everyPrice.length >= 20, 'the price list lost entries');

for (const price of everyPrice) {
  assert.ok(
    price && typeof price === 'object',
    'a price is still a plain string',
  );
  assert.ok(
    ['exact', 'from', 'range', 'custom'].includes(price.kind),
    `unknown price kind: ${price.kind}`,
  );
  if (price.kind === 'range') {
    assert.ok(price.to > price.from, 'a range ends before it starts');
  }
  for (const currency of CURRENCIES) {
    const rendered = formatPrice(price, currency);
    assert.ok(rendered.trim(), 'a price rendered as nothing');
    // No entry may leak a hardcoded currency from before the change.
    assert.doesNotMatch(
      rendered,
      /GHS/,
      `"${rendered}" still contains a written-out GHS`,
    );
    if (price.kind !== 'custom') {
      assert.ok(
        rendered.includes(CURRENCY_INFO[currency].symbol),
        `${rendered} is missing the ${currency} symbol`,
      );
    }
  }
}

// Ordering must survive conversion: what is cheaper in cedis is cheaper in
// naira and in dollars, or the page would contradict itself between currencies.
const ordered = [...everyPrice]
  .filter((p) => p.kind !== 'custom')
  .sort((a, b) => a.from - b.from);
for (const currency of CURRENCIES) {
  for (let i = 1; i < ordered.length; i++) {
    assert.ok(
      convert(ordered[i].from, currency) >=
        convert(ordered[i - 1].from, currency),
      `conversion to ${currency} reordered the price list`,
    );
  }
}

// ---- prices set for a market, rather than converted into it ----

// Nigeria is a primary market and its figures are chosen, not derived. A price
// that quietly fell back to conversion would move whenever the cedi moved,
// which is the opposite of what setting it was for.
assert.ok(
  allSetFor(everyPrice, 'NGN'),
  'some published prices have no Nigerian figure and would be converted instead',
);
assert.ok(
  !allSetFor(everyPrice, 'USD'),
  'dollars are expected to be converted; if that changed, the page note must change with it',
);

// A set figure is used exactly as written. Passing it through the rounding
// step would move a deliberate number by an increment meant for arithmetic
// nobody did here.
const setExactly = {
  kind: 'range',
  from: 10000,
  to: 18000,
  set: { NGN: { from: 1234567, to: 2345678 } },
};
assert.equal(formatPrice(setExactly, 'NGN'), '₦1,234,567–2,345,678');
// The same price still converts for a currency it was not set for.
assert.equal(
  formatPrice(setExactly, 'USD'),
  formatPrice({ kind: 'range', from: 10000, to: 18000 }, 'USD'),
  'a set figure for one market leaked into another',
);

assert.ok(isSetPrice(stages[0].price, 'NGN'));
assert.ok(!isSetPrice(stages[0].price, 'USD'));
// A custom label has no figure to set, and must not claim one.
assert.ok(!isSetPrice({ kind: 'custom', label: 'Custom retainer' }, 'NGN'));

// Set naira prices must still rise with the cedi list. If a cheaper package
// were priced above a dearer one, the page would contradict itself between
// currencies and a customer would notice before we did.
const nairaOrder = [...everyPrice]
  .filter((p) => p.kind !== 'custom')
  .sort((a, b) => a.from - b.from)
  .map((p) => p.set?.NGN?.from ?? convert(p.from, 'NGN'));
for (let i = 1; i < nairaOrder.length; i++) {
  assert.ok(
    nairaOrder[i] >= nairaOrder[i - 1],
    'the Nigerian prices are not in the same order as the cedi prices',
  );
}

// A set range must not end before it starts.
for (const price of everyPrice) {
  const set = price.set?.NGN;
  if (set?.to !== undefined) {
    assert.ok(set.to > set.from, 'a Nigerian range ends before it starts');
  }
}

// Every set naira figure should be within sight of the cedi price. This is a
// guard against a typo adding or losing a zero, not a rule about pricing: a
// deliberate decision to charge half or double will trip it, and should.
for (const price of everyPrice) {
  const set = price.set?.NGN;
  if (!set) continue;
  const converted = convert(price.from, 'NGN');
  const ratio = set.from / converted;
  assert.ok(
    ratio > 0.5 && ratio < 2,
    `a Nigerian figure is ${ratio.toFixed(1)}x the converted one, which looks like a missing or extra zero`,
  );
}

console.log('currency: all checks passed');
