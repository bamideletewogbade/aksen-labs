import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const compiled = ts.transpileModule(
  fs.readFileSync('lib/mapper-questions.ts', 'utf8'),
  {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
const {
  legacyMapperQuestions,
  parseMapperAnswers,
  parseIntake,
  intakeTranscript,
  mapperSteps,
  stepProblem,
  symptomsFor,
  emptyIntake,
  MAX_SYMPTOMS,
  OTHER,
} = await import(
  'data:text/javascript;base64,' + Buffer.from(compiled).toString('base64')
);

// The seven-step intake.
const good = {
  business: 'Made-to-order, crafts or furniture',
  sells: 'Custom picture frames',
  problem: 'customers',
  symptoms: [
    'Messages wait too long for a reply',
    'We check price or stock before we can reply',
  ],
  channels: ['WhatsApp', 'Instagram or Facebook'],
  tools: ['Spreadsheets', 'Memory, paper or a notebook'],
  markets: ['Nigeria'],
  volume: '10 to 50',
  team: '2 to 5 people',
  example: 'A customer asked for a price on Saturday and we replied on Monday.',
  frequency: 'Every week',
  tried: '',
};
const parsed = parseIntake(good);
assert.equal(parsed.error, undefined);
assert.equal(parsed.intake.problem, 'customers');
assert.match(
  intakeTranscript(parsed.intake),
  /Problem that hurts most \(their one choice\): People ask/,
);
assert.match(intakeTranscript(parsed.intake), /replied on Monday/);

// Refused, with a reason, rather than silently trimmed.
for (const bad of [
  { ...good, problem: 'everything' },
  { ...good, business: 'Spaceship yard' },
  // A symptom from a different problem's list.
  { ...good, symptoms: ['Stock runs out or piles up'] },
  { ...good, symptoms: symptomsFor('customers').slice(0, MAX_SYMPTOMS + 1) },
  { ...good, symptoms: [OTHER], symptomOther: '' },
  { ...good, tools: [OTHER], toolsOther: '  ' },
  { ...good, markets: ['Another African country'], marketOther: '' },
  { ...good, channels: [] },
  { ...good, volume: '' },
  { ...good, team: 'A thousand' },
  { ...good, frequency: 'Hourly' },
])
  assert.ok(parseIntake(bad).error, JSON.stringify(bad).slice(0, 80));
assert.ok(parseIntake(null).error);
assert.ok(parseIntake([good]).error);

// Optional fields may be empty, and "other" text is dropped when not chosen.
const minimal = parseIntake({
  ...good,
  sells: '',
  example: '',
  frequency: '',
  businessOther: 'should be dropped',
});
assert.equal(minimal.error, undefined);
assert.equal(minimal.intake.businessOther, '');

// Every step blocks until its required fields are filled, and not after.
const draft = emptyIntake();
for (const step of mapperSteps) {
  const required = step.fields.some((f) => f.kind !== 'text' && !f.optional);
  assert.equal(!!stepProblem(step, draft), required, step.prompt);
}
for (const step of mapperSteps)
  assert.equal(stepProblem(step, { ...draft, ...good }), '', step.prompt);

// Every problem has symptoms to choose, each ending with a way out.
for (const id of ['leads', 'customers', 'profit', 'product', 'unsure']) {
  const list = symptomsFor(id);
  assert.ok(list.length >= 4, id);
  assert.equal(list.at(-1), OTHER);
}

// The previous three-question format, still sent by cached pages.
const selected = [
  [legacyMapperQuestions[0].options[0], legacyMapperQuestions[0].options[3]],
  [legacyMapperQuestions[1].options[0], legacyMapperQuestions[1].options[1]],
  [legacyMapperQuestions[2].options[0], legacyMapperQuestions[2].options[4]],
];
assert.deepEqual(parseMapperAnswers(selected), selected);
assert.deepEqual(
  parseMapperAnswers(['Old goal label', 'Old market label', 'Old setup label']),
  [['Old goal label'], ['Old market label'], ['Old setup label']],
);
for (const invalid of [
  [[], selected[1], selected[2]],
  [[selected[0][0], selected[0][0]], selected[1], selected[2]],
  [['A choice never shown'], selected[1], selected[2]],
  [
    selected[0],
    selected[1],
    [legacyMapperQuestions[2].exclusive, selected[2][0]],
  ],
  [selected[0], selected[1]],
])
  assert.equal(parseMapperAnswers(invalid), null);

console.log('mapper-questions: all checks passed');
