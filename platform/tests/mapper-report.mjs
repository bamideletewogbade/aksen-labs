import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

// The three mapper modules import each other by relative path, so each is
// compiled and its imports pointed at the others' data URLs.
const uri = (source) =>
  'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const compile = (file, modules = {}) =>
  ts
    .transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
    })
    .outputText.replace(
      /from\s+['"]([^'"]+)['"]/g,
      (_, name) => `from '${modules[name] || name}'`,
    );
const questionsUrl = uri(compile('lib/mapper-questions.ts'));
const reportUrl = uri(compile('lib/mapper-report.ts'));
const fallbackUrl = uri(
  compile('lib/mapper-fallback.ts', {
    './mapper-questions': questionsUrl,
    './mapper-report': reportUrl,
  }),
);
const Q = await import(questionsUrl);
const R = await import(reportUrl);
const { mapperFallback } = await import(fallbackUrl);

const intake = Q.parseIntake({
  business: 'Made-to-order, crafts or furniture',
  problem: 'customers',
  symptoms: [
    'Messages wait too long for a reply',
    'We check price or stock before we can reply',
  ],
  channels: ['WhatsApp'],
  tools: ['Spreadsheets'],
  markets: ['Ghana'],
  volume: '10 to 50',
  team: 'Just me',
}).intake;
assert.ok(intake);

const good = {
  headline: 'Answer WhatsApp price questions before customers give up',
  summary:
    'You run a made-to-order business on your own, and customers wait while you check prices in a spreadsheet.',
  leaks: [
    {
      where: 'Replies wait on the spreadsheet',
      evidence: 'You said you check price or stock before you can reply.',
    },
  ],
  doThisWeek: ['Pin your price list in WhatsApp Business as quick replies.'],
  firstFix: {
    title: 'Price answers on the chat you already use',
    what: 'Your price list joined to WhatsApp so the answer is ready when the question arrives.',
    whyFirst: 'It is the delay you described.',
    package: 'One workflow',
  },
  steps: [
    'Map the current replies.',
    'Join the price list.',
    'Try it on real enquiries.',
  ],
  measure: 'Time to first reply on twenty enquiries.',
  notYet: 'Leave a website until replies are faster.',
  humanControl: 'You approve every price before it is sent.',
  questions: ['How many enquiries a week end without a sale?'],
};

// Parse: code fences and extra text around the JSON are tolerated.
const parsed = R.parseReport('```json\n' + JSON.stringify(good) + '\n```');
assert.equal(parsed.firstFix.package, 'One workflow');
assert.equal(parsed.steps.length, 3);
assert.equal(R.parseReport('not json'), null);
assert.equal(R.parseReport(JSON.stringify({ ...good, measure: '' })), null);
assert.equal(
  R.parseReport(JSON.stringify({ ...good, humanControl: '' })),
  null,
);
// Em dashes are removed, not passed through.
assert.doesNotMatch(
  R.parseReport(JSON.stringify({ ...good, summary: 'Fast — and clear' }))
    .summary,
  /—/,
);

// Lint: a clean report passes, every rule catches its case.
assert.deepEqual(R.lintReport(parsed, intake), []);
const lintOf = (patch) => R.lintReport({ ...parsed, ...patch }, intake);
assert.ok(
  lintOf({ firstFix: { ...parsed.firstFix, package: 'Internal copilot' } })
    .length,
);
assert.ok(
  lintOf({ firstFix: { ...parsed.firstFix, package: 'Reporting layer' } })
    .length,
  'profit package for a customers problem',
);
assert.ok(lintOf({ steps: ['one', 'two'] }).length);
assert.ok(lintOf({ leaks: [] }).length);
for (const claim of [
  'Instant replies for every customer',
  'Guaranteed growth',
  'You will never miss an order',
  'Answers 24/7',
  'Double your sales',
  'It replaces your staff',
  'A seamless experience',
  'We connect the API',
  'Sales rise by 40%',
  'It costs GHS 5,000',
  'Live within 3 days',
])
  assert.ok(lintOf({ summary: claim }).length, claim);

// Fit checks: bands and the LLM fallback reader.
assert.equal(R.verdictFor(0.9), 'pass');
assert.equal(R.verdictFor(0.5), 'unsure');
assert.equal(R.verdictFor(0.1), 'fail');
assert.equal(R.verdictFor(null), 'not-run');
const results = R.checkResults({ fits_problem: 0.95, grounded: 0.2 });
assert.equal(results.length, R.judgeIds.length);
assert.equal(results.find((r) => r.id === 'grounded').verdict, 'fail');
assert.equal(results.find((r) => r.id === 'honest').verdict, 'not-run');
assert.equal(R.failedCheckFixes(results).length, 1);
assert.deepEqual(
  R.readLlmJudge('{"fits_problem":true,"grounded":false,"x":1}'),
  {
    fits_problem: 1,
    grounded: 0,
  },
);
assert.deepEqual(R.readLlmJudge('garbage'), {});
const state = R.judgeState(Q.intakeTranscript(intake), parsed);
assert.match(state, /VISITOR ANSWERS[\s\S]*REPORT/);
assert.match(state, /Suggested package: One workflow/);

// Every package a report may name exists on the pricing page by that name.
const pricing = fs.readFileSync('lib/pricing.ts', 'utf8');
for (const name of new Set(Object.values(R.packagesByProblem).flat()))
  if (name !== R.FREE_ASSESSMENT)
    assert.ok(
      pricing.includes(`name: '${name}'`),
      `${name} missing from pricing.ts`,
    );

// The rule-based report, for every problem and every symptom, passes the same
// rules the live one must, and names the visitor's own first symptom.
for (const problem of Q.problems.map((p) => p.id)) {
  for (const symptom of Q.symptomsFor(problem)) {
    const input = Q.parseIntake({
      business: 'Shop or retail',
      problem,
      symptoms: [symptom],
      symptomOther:
        symptom === Q.OTHER ? 'Delivery addresses are often wrong' : '',
      channels: ['WhatsApp'],
      tools: ['Spreadsheets'],
      markets: ['Ghana'],
      volume: 'Not sure',
      team: 'Just me',
    });
    assert.equal(input.error, undefined, `${problem} / ${symptom}`);
    const report = mapperFallback(input.intake);
    assert.deepEqual(
      R.lintReport(report, input.intake),
      [],
      `${problem} / ${symptom}`,
    );
    assert.equal(report.steps.length, 3);
    if (symptom !== Q.OTHER)
      assert.ok(
        report.leaks[0].evidence.includes(symptom),
        `${problem} / ${symptom}: the first leak must be the visitor's symptom`,
      );
  }
}

// The old test's cases, in the new shape.
const fallback = mapperFallback(intake);
assert.match(fallback.headline, /buyers/i);
assert.match(fallback.summary, /on your own/);
assert.match(fallback.summary, /10 to 50/);
assert.match(fallback.firstFix.whyFirst, /WhatsApp/);
assert.equal(fallback.firstFix.package, 'Website or WhatsApp assistant');
assert.match(fallback.humanControl, /team/i);
assert.doesNotMatch(
  JSON.stringify(fallback),
  /guaranteed|increase revenue|ROI/i,
);

console.log('mapper-report: all checks passed');
