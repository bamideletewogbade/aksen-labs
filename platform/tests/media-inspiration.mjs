import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const compiled = ts.transpileModule(fs.readFileSync('lib/media-inspiration.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { youtubeVideoId, cleanAngles, cleanScript } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));

const id = 'dQw4w9WgXcQ';
assert.equal(youtubeVideoId('https://www.youtube.com/watch?v=' + id + '&t=3'), id);
assert.equal(youtubeVideoId('https://youtu.be/' + id), id);
assert.equal(youtubeVideoId('https://youtube.com/shorts/' + id), id);
assert.equal(youtubeVideoId('https://youtube.com.evil.example/watch?v=' + id), null);
assert.equal(youtubeVideoId('http://youtube.com/watch?v=' + id), null);
assert.equal(youtubeVideoId('https://youtube.com/watch?v=bad'), null);

const angle = { title: 'A real test', hook: 'What would happen?', ownAngle: 'Our view', businessExample: 'A shop tests it', sourceConnection: 'Inspired by the title', proofNeeded: 'Verify the actual result' };
assert.equal(cleanAngles({ angles: [angle, angle, angle] })?.length, 3);
assert.equal(cleanAngles({ angles: [angle] }), null);
assert.equal(cleanAngles({ angles: [{ ...angle, proofNeeded: '' }, angle, angle] }), null);
assert.equal(cleanScript({ script: 'A draft', scenes: [
  { kind: 'presenter', seconds: 20, narration: 'First part', visual: 'Host' },
  { kind: 'visual', seconds: 25, narration: 'Second part', visual: 'Diagram' },
] })?.scenes.length, 2);
assert.equal(cleanScript({ script: 'A draft', scenes: [{ kind: 'presenter', seconds: 5, narration: 'Too short', visual: 'Host' }] }), null);
console.log('media-inspiration: URL and generated-output checks passed');
