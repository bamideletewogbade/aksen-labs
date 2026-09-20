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
const { mapperQuestions, parseMapperAnswers } = await import(
  'data:text/javascript;base64,' + Buffer.from(compiled).toString('base64')
);

const selected = [
  [mapperQuestions[0].options[0], mapperQuestions[0].options[3]],
  [mapperQuestions[1].options[0], mapperQuestions[1].options[1]],
  [mapperQuestions[2].options[0], mapperQuestions[2].options[4]],
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
  [selected[0], selected[1], [mapperQuestions[2].exclusive, selected[2][0]]],
  [selected[0], selected[1]],
])
  assert.equal(parseMapperAnswers(invalid), null);

console.log('mapper-questions: all checks passed');
