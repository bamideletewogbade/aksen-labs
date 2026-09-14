// Run: node tests/contact-channels.mjs
//
// A published phone number is worse to get wrong than a published price. A
// stale price looks like a mistake; a stale number looks like a company that
// has stopped trading, and nobody who hits it will tell us. The build price and
// the Lead Scout run limit were each written out by hand in several files and
// both drifted, so this pins the number to one module and checks that nothing
// else has started carrying its own copy.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const load = async (file) =>
  import(
    'data:text/javascript;base64,' +
      Buffer.from(
        ts.transpileModule(fs.readFileSync(file, 'utf8'), {
          compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2022,
          },
        }).outputText,
      ).toString('base64')
  );

const { whatsappNumber, whatsappDisplay, whatsappLink } = await load(
  'lib/contact-channels.ts',
);

// wa.me accepts digits only. A leading plus or a space produces a link that
// opens WhatsApp and then fails to find the contact, which looks like the
// number is wrong rather than the link.
assert.match(
  whatsappNumber,
  /^[1-9]\d{7,14}$/,
  'the number must be digits only, no plus, no spaces, no leading zero',
);
assert.ok(
  whatsappNumber.startsWith('234') || whatsappNumber.startsWith('233'),
  'expected a Nigerian (234) or Ghanaian (233) country code',
);

// The display form must be the same number, however it is spaced.
assert.equal(
  whatsappDisplay.replace(/[^\d]/g, ''),
  whatsappNumber,
  'the display number and the link number are different numbers',
);

// A link from a page carries that page, so a conversation arriving with no
// referrer still says where it started.
const fromPricing = whatsappLink('/pricing');
assert.ok(fromPricing.startsWith(`https://wa.me/${whatsappNumber}?text=`));
assert.match(decodeURIComponent(fromPricing), /\/pricing/);

// The home page adds nothing useful, so it is left out rather than saying "/".
const fromHome = whatsappLink('/');
assert.doesNotMatch(decodeURIComponent(fromHome), /reading \//);
assert.equal(
  whatsappLink(''),
  fromHome,
  'an empty path should match the home page',
);
assert.equal(
  whatsappLink(),
  fromHome,
  'a missing path should match the home page',
);

// The text must survive being put in a URL. An unencoded space silently
// truncates the prefill in some clients.
assert.ok(!fromPricing.includes(' '), 'the link contains a raw space');

// Nothing else may carry its own copy of the number.
const offenders = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const full = `${dir}/${entry.name}`;
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx|css|mjs)$/.test(entry.name)) {
      if (full.endsWith('lib/contact-channels.ts')) continue;
      if (full.endsWith('tests/contact-channels.mjs')) continue;
      const body = fs.readFileSync(full, 'utf8');
      if (body.includes(whatsappNumber) || body.includes(whatsappDisplay)) {
        offenders.push(full);
      }
    }
  }
};
for (const dir of ['app', 'components', 'lib', 'tests']) {
  if (fs.existsSync(dir)) walk(dir);
}
assert.deepEqual(
  offenders,
  [],
  `the number is written out again in: ${offenders.join(', ')}`,
);

console.log('contact-channels: all checks passed');
