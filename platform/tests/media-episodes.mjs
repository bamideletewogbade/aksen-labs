import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const compiled = ts.transpileModule(fs.readFileSync('lib/media-episodes.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { cleanEpisodeInput, sceneCueSheet, episodeDuration } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));

const valid = {
  title: '  What is an AI model? ', topic: 'One useful idea', script: 'A reviewed script',
  scenes: [{ id: 'scene-1', kind: 'presenter', narration: 'Hello', visual: 'Host to camera', seconds: 8 }],
  sources: [' https://example.com/research '], aspectRatio: '9:16', channelPosts: {}, proofChecks: [],
};
const cleaned = cleanEpisodeInput(valid);
assert.equal(cleaned?.title, 'What is an AI model?');
assert.deepEqual(cleaned?.sources, ['https://example.com/research']);
assert.equal(cleanEpisodeInput({ ...valid, sources: ['http://example.com'] }), null);
assert.equal(cleanEpisodeInput({ ...valid, scenes: [...valid.scenes, valid.scenes[0]] }), null);
assert.equal(cleanEpisodeInput({ ...valid, scenes: [{ ...valid.scenes[0], seconds: 0 }] }), null);
assert.equal(cleanEpisodeInput({ ...valid, script: 'x'.repeat(12_001) }), null);
assert.equal(cleanEpisodeInput({ ...valid, originEvaluationId: '00000000-0000-4000-8000-000000000001' })?.originEvaluationId, '00000000-0000-4000-8000-000000000001');
assert.equal(cleanEpisodeInput({ ...valid, originEvaluationId: '../wrong' }), null);
assert.equal(cleanEpisodeInput({ ...valid, scenes: [{ ...valid.scenes[0], asset: { kind: 'image', id: '../wrong' } }] }), null);
const styled = { ...valid.scenes[0], background: { kind: 'image', id: 'backdrop-1' }, fit: 'contain', transition: 'fade' };
assert.deepEqual(cleanEpisodeInput({ ...valid, scenes: [styled] })?.scenes[0].background, styled.background);
assert.equal(cleanEpisodeInput({ ...valid, scenes: [{ ...styled, background: { kind: 'image', id: '../bad' } }] }), null);
assert.equal(cleanEpisodeInput({ ...valid, scenes: [{ ...styled, transition: 'spin' }] }), null);
assert.equal(cleanEpisodeInput({ ...valid, channelPosts: { linkedin: { title: 'Hook', caption: 'Short post' } } })?.channelPosts.linkedin?.caption, 'Short post');
const openCheck = { id: 'check-1', question: 'What is the source?', evidenceUrl: '', status: 'open' };
assert.equal(cleanEpisodeInput({ ...valid, proofChecks: [openCheck] })?.proofChecks[0].status, 'open');
assert.equal(cleanEpisodeInput({ ...valid, proofChecks: [{ ...openCheck, status: 'verified' }] }), null);
assert.equal(cleanEpisodeInput({ ...valid, proofChecks: [{ ...openCheck, status: 'verified', evidenceUrl: 'https://example.com/source' }] })?.proofChecks[0].status, 'verified');
assert.equal(episodeDuration([{ ...valid.scenes[0], seconds: 8 }, { ...valid.scenes[0], id: 'scene-2', seconds: 12 }]), 20);
assert.deepEqual(sceneCueSheet([{ ...valid.scenes[0], seconds: 8 }, { ...valid.scenes[0], id: 'scene-2', seconds: 12 }]).map(({ start, end }) => [start, end]), [[0, 8], [8, 20]]);
assert.equal(sceneCueSheet([styled])[0].transition, 'fade');
console.log('media-episodes: validation checks passed');
