import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const compiled = ts.transpileModule(fs.readFileSync('lib/media-episodes.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { cleanEpisodeInput } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));

const valid = {
  title: '  What is an AI model? ', topic: 'One useful idea', script: 'A reviewed script',
  scenes: [{ id: 'scene-1', kind: 'presenter', narration: 'Hello', visual: 'Host to camera', seconds: 8 }],
  sources: [' https://example.com/research '], aspectRatio: '9:16',
};
const cleaned = cleanEpisodeInput(valid);
assert.equal(cleaned?.title, 'What is an AI model?');
assert.deepEqual(cleaned?.sources, ['https://example.com/research']);
assert.equal(cleanEpisodeInput({ ...valid, sources: ['http://example.com'] }), null);
assert.equal(cleanEpisodeInput({ ...valid, scenes: [...valid.scenes, valid.scenes[0]] }), null);
assert.equal(cleanEpisodeInput({ ...valid, scenes: [{ ...valid.scenes[0], seconds: 0 }] }), null);
assert.equal(cleanEpisodeInput({ ...valid, script: 'x'.repeat(12_001) }), null);
console.log('media-episodes: validation checks passed');
