import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const compiled = ts.transpileModule(fs.readFileSync('lib/media-jev.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { jevQuestions, parseJevResult, cleanJevOutcome, jevSummary } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));

assert.equal(Object.keys(jevQuestions()).length, 2);
const answer = (choice) => ({ choice, confidence: 0.7, probabilities: { [choice]: 0.8 } });
const agreed = parseJevResult({ model: 'jev-1', answers: { founder_fit: answer('angle_2'), practical_example: answer('angle_2') }, usage: { input_tokens: 70, output_tokens: 12 } });
assert.equal(agreed?.suggestion, 'angle_2');
assert.equal(agreed?.inputTokens, 70);
assert.equal(parseJevResult({ answers: { founder_fit: answer('angle_1'), practical_example: answer('angle_2') } })?.suggestion, null);
assert.equal(parseJevResult({ answers: { founder_fit: answer('invalid'), practical_example: answer('angle_2') } }), null);
assert.equal(cleanJevOutcome({ editorialQuality: 5, published: false, views: 0 })?.views, 0);
assert.equal(cleanJevOutcome({ editorialQuality: 6 }), null);
assert.equal(cleanJevOutcome({ views: -1 }), null);
const summary = jevSummary([
  { status: 'shadow', suggestion: 'angle_2', selectedAngle: 'angle_2', outcome: { editorialQuality: 5, published: true }, inputTokens: 70, outputTokens: 12, latencyMs: 100 },
  { status: 'shadow', suggestion: 'angle_1', selectedAngle: 'angle_2', outcome: { editorialQuality: 2 }, inputTokens: 50, outputTokens: 10, latencyMs: 200 },
  { status: 'skipped', suggestion: null, selectedAngle: 'angle_1', outcome: {}, inputTokens: null, outputTokens: null, latencyMs: 0 },
]);
assert.equal(summary.agreement, 1);
assert.equal(summary.comparable, 2);
assert.equal(summary.qualityWhenAgreed.average, 5);
assert.equal(summary.qualityWhenDisagreed.average, 2);
console.log('media-jev: typed decisions, outcomes and summary passed');
