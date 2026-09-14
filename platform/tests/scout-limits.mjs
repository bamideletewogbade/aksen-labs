// Run: node tests/scout-limits.mjs
//
// The daily cap was written as a bare 6 in four places: the SQL that enforced
// it, the route that reported what was left, that route's error text, and the
// sentence under the search buttons. Changing it meant finding all four, and a
// missed one would have kept telling the operator a number the system no
// longer used. These checks hold the figure in one place and confirm nothing
// quietly writes its own copy of it.
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

const limits = await load('lib/scout-limits.ts');

// Default, with nothing configured.
delete process.env.SCOUT_DAILY_RUNS;
assert.equal(limits.dailyResearchRuns(), 50);
assert.equal(limits.researchRunsUncapped(), false);
assert.equal(limits.remainingResearchRuns(0), 50);
assert.equal(limits.remainingResearchRuns(48), 2);

// Never negative, however many runs were recorded.
assert.equal(limits.remainingResearchRuns(999), 0);

// Configured.
process.env.SCOUT_DAILY_RUNS = '200';
assert.equal(limits.dailyResearchRuns(), 200);
assert.equal(limits.remainingResearchRuns(10), 190);

// Zero removes the cap. null is reported rather than 0, because "uncapped"
// and "none left" must not render as the same thing.
process.env.SCOUT_DAILY_RUNS = '0';
assert.equal(limits.researchRunsUncapped(), true);
assert.equal(limits.remainingResearchRuns(500), null);
assert.match(limits.allowanceSentence(null), /not capped/);

// Nonsense falls back rather than disabling the guard by accident. A blank or
// negative value must not be read as zero, which would remove the cap.
for (const bad of ['', '   ', 'lots', '-5', 'NaN']) {
  process.env.SCOUT_DAILY_RUNS = bad;
  assert.equal(
    limits.dailyResearchRuns(),
    50,
    `SCOUT_DAILY_RUNS=${JSON.stringify(bad)} should fall back to the default`,
  );
  assert.equal(limits.researchRunsUncapped(), false);
}
delete process.env.SCOUT_DAILY_RUNS;

// The brief is a prompt, not a sentence.
assert.ok(limits.targetMaxLength >= 4000);
assert.ok(
  limits.targetMinLength >= 1 &&
    limits.targetMinLength < limits.targetMaxLength,
);

// No file may carry its own copy of the cap.
const enforcement = fs.readFileSync('lib/prospecting.ts', 'utf8');
assert.match(
  enforcement,
  /dailyResearchRuns\(\)/,
  'the quota no longer reads the shared limit',
);
assert.doesNotMatch(
  enforcement,
  /requests<6\b/,
  'prospecting.ts still hardcodes the old cap of 6',
);

const route = fs.readFileSync('app/api/admin/prospects/route.ts', 'utf8');
assert.match(
  route,
  /remainingResearchRuns\(/,
  'the route no longer reports the shared limit',
);
assert.doesNotMatch(route, /six-run/, 'the route still says "six-run"');
assert.match(
  route,
  /targetMaxLength \+ 4096/,
  'the request body cap must clear a full-length brief, or it is refused before validation',
);

const ui = fs.readFileSync('components/lead-scout.tsx', 'utf8');
assert.doesNotMatch(
  ui,
  /of 6 research runs/,
  'the interface still hardcodes 6',
);
assert.doesNotMatch(ui, /Up to six/, 'the interface still says "six"');
assert.match(
  ui,
  /data\.dailyRuns/,
  'the interface should show the figure the server enforces',
);

console.log('scout-limits: all checks passed');
