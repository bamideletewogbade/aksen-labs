import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { zipSync, strToU8 } from 'fflate';

const id = '00000000-0000-4000-8000-000000000001';
const sceneId = 'fixture';
const assetPath = `episodes/${id}/${sceneId}.png`;
const backgroundPath = `episodes/${id}/second-background.png`;
const kitPath = resolve('tests', 'render-fixture.zip');
const outputPath = resolve('tests', 'render-fixture.mp4');
const voicePath = `episodes/${id}/voice.wav`;
const samples = 32000;
const voice = Buffer.alloc(44 + samples * 2);
voice.write('RIFF', 0); voice.writeUInt32LE(voice.length - 8, 4); voice.write('WAVEfmt ', 8);
voice.writeUInt32LE(16, 16); voice.writeUInt16LE(1, 20); voice.writeUInt16LE(1, 22);
voice.writeUInt32LE(16000, 24); voice.writeUInt32LE(32000, 28); voice.writeUInt16LE(2, 32); voice.writeUInt16LE(16, 34);
voice.write('data', 36); voice.writeUInt32LE(samples * 2, 40);
for (let i = 0; i < samples; i++) voice.writeInt16LE(Math.round(Math.sin(2 * Math.PI * 440 * i / 16000) * 2500), 44 + i * 2);
const files = {
  'episode.json': strToU8(JSON.stringify({ version: 1, episodeId: id, title: 'Scene background render test', aspectRatio: '9:16', voicePath, scenes: [{ id: sceneId, seconds: 1, narration: 'Aksen Labs render test', visual: 'Test image', assetPath }, { id: 'second', seconds: 1, narration: 'Second scene with a new backdrop', visual: 'Background switch', assetPath: `episodes/${id}/second.png`, background: { kind: 'image' }, backgroundPath, fit: 'contain', transition: 'fade' }] })),
  [voicePath]: new Uint8Array(voice),
  [assetPath]: new Uint8Array(readFileSync(resolve('..', 'video', 'public', 'ng-ui', 'salon.png'))),
  [`episodes/${id}/second.png`]: new Uint8Array(readFileSync(resolve('..', 'video', 'public', 'ng-ui', 'restaurant.png'))),
  [backgroundPath]: new Uint8Array(readFileSync(resolve('..', 'video', 'public', 'generated', 'backdrop-hero-vertical.png'))),
};
writeFileSync(kitPath, zipSync(files, { level: 0 }));
try {
  execFileSync(process.execPath, ['scripts/render-media-episode.mjs', kitPath, outputPath], { stdio: 'inherit' });
  assert.ok(existsSync(outputPath) && readFileSync(outputPath).byteLength > 1000, 'Expected a nonempty MP4');
  const ffprobe = join('..', 'video', 'node_modules', '@remotion', 'compositor-win32-x64-msvc', 'ffprobe.exe');
  const stream = JSON.parse(execFileSync(ffprobe, ['-v', 'error', '-show_entries', 'stream=codec_type', '-of', 'json', outputPath], { encoding: 'utf8' }));
  assert.ok(stream.streams.some((entry) => entry.codec_type === 'audio'), 'Expected an audio stream in the MP4');
  assert.equal(JSON.parse(readFileSync(`${outputPath}.json`, 'utf8')).voiceover, true);
  const shortVoice = Buffer.from(voice.subarray(0, 44 + 8000 * 2));
  shortVoice.writeUInt32LE(shortVoice.length - 8, 4);
  shortVoice.writeUInt32LE(8000 * 2, 40);
  writeFileSync(kitPath, zipSync({ ...files, [voicePath]: new Uint8Array(shortVoice) }, { level: 0 }));
  assert.throws(() => execFileSync(process.execPath, ['scripts/render-media-episode.mjs', kitPath, outputPath], { stdio: 'pipe' }), (error) => { assert.match(String(error.stderr), /Voiceover is/); return true; });
  assert.ok(!existsSync(resolve('..', 'video', '.media-episode-render.lock')), 'Failed preflight should release the render lock');
  console.log('Scene and background changes plus voiceover rendered to MP4.');
} finally {
  rmSync(kitPath, { force: true });
  rmSync(outputPath, { force: true });
  rmSync(`${outputPath}.json`, { force: true });
}
