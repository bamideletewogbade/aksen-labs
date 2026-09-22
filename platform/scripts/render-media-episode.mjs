// Usage from platform: node scripts/render-media-episode.mjs <aksen-render-episode.zip> [output.mp4]
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, openSync, closeSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { unzipSync } from 'fflate';

const kitPath = process.argv[2];
if (!kitPath) throw new Error('Pass an approved episode render kit ZIP.');
const video = resolve('..', 'video');
const manifestPath = join(video, 'src', 'episode-manifest.json');
const originalManifest = readFileSync(manifestPath);
const files = unzipSync(new Uint8Array(readFileSync(resolve(kitPath))));
const source = files['episode.json'];
if (!source) throw new Error('Render kit has no episode.json.');
const manifest = JSON.parse(Buffer.from(source).toString('utf8'));
if (manifest.version !== 1 || !/^[a-zA-Z0-9-]{1,100}$/.test(manifest.episodeId) ||
  !['9:16', '16:9', '1:1'].includes(manifest.aspectRatio) ||
  typeof manifest.title !== 'string' || !manifest.title.trim() || manifest.title.length > 120 ||
  !Array.isArray(manifest.scenes) || manifest.scenes.length < 1 || manifest.scenes.length > 20) {
  throw new Error('Invalid episode manifest.');
}
const publicDir = join(video, 'public');
const targetDir = join(publicDir, 'episodes', manifest.episodeId);
const voicePath = manifest.voicePath || '';
if (voicePath) {
  if (!['wav', 'mp3'].some((extension) => voicePath === `episodes/${manifest.episodeId}/voice.${extension}`) || !files[voicePath]) throw new Error('Missing or unsafe voiceover in render kit.');
} else if (manifest.voicePath != null && manifest.voicePath !== '') throw new Error('Invalid voiceover path.');
const cleaned = [];
let total = voicePath ? files[voicePath].byteLength : 0;
for (const scene of manifest.scenes) {
  if (!/^[a-zA-Z0-9-]{1,80}$/.test(scene.id) || !Number.isInteger(scene.seconds) || scene.seconds < 1 || scene.seconds > 300 ||
    typeof scene.narration !== 'string' || scene.narration.length > 2000 || typeof scene.visual !== 'string' || scene.visual.length > 1000) {
    throw new Error('Invalid scene in render kit.');
  }
  const extension = scene.assetPath?.endsWith('.mp4') ? 'mp4' : scene.assetPath?.endsWith('.png') ? 'png' : scene.assetPath?.endsWith('.jpg') ? 'jpg' : '';
  const expectedPath = `episodes/${manifest.episodeId}/${scene.id}.${extension}`;
  if (!extension || scene.assetPath !== expectedPath || !files[expectedPath]) throw new Error(`Missing or unsafe asset for scene ${scene.id}.`);
  if (scene.fit != null && !['cover', 'contain'].includes(scene.fit)) throw new Error(`Invalid media framing for scene ${scene.id}.`);
  if (scene.transition != null && !['cut', 'fade'].includes(scene.transition)) throw new Error(`Invalid transition for scene ${scene.id}.`);
  const background = scene.background || { kind: 'preset', value: 'deep' };
  if (background.kind === 'preset') {
    if (!['deep', 'lime', 'paper'].includes(background.value) || scene.backgroundPath) throw new Error(`Invalid background for scene ${scene.id}.`);
  } else if (background.kind === 'image') {
    const bgExtension = scene.backgroundPath?.endsWith('.png') ? 'png' : scene.backgroundPath?.endsWith('.jpg') ? 'jpg' : '';
    if (!bgExtension || scene.backgroundPath !== `episodes/${manifest.episodeId}/${scene.id}-background.${bgExtension}` || !files[scene.backgroundPath]) throw new Error(`Missing or unsafe background for scene ${scene.id}.`);
    total += files[scene.backgroundPath].byteLength;
  } else throw new Error(`Invalid background for scene ${scene.id}.`);
  total += files[expectedPath].byteLength;
  if (total > 150_000_000) throw new Error('Kit media exceeds 150 MB.');
  cleaned.push({ id: scene.id, seconds: scene.seconds, narration: scene.narration, visual: scene.visual, assetPath: expectedPath, background: background.kind === 'image' ? { kind: 'image' } : background, backgroundPath: background.kind === 'image' ? scene.backgroundPath : '', fit: scene.fit || 'cover', transition: scene.transition || 'cut' });
}
const output = resolve(process.argv[3] || join(video, 'out', `media-episode-${manifest.episodeId}.mp4`));
if (!existsSync(join(video, 'node_modules'))) throw new Error('Install video dependencies with npm ci in the video directory.');
const compositorDir = join(video, 'node_modules', '@remotion');
const ffprobePackage = readdirSync(compositorDir).find((name) => name.startsWith('compositor-') && existsSync(join(compositorDir, name, process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe')));
const ffprobe = ffprobePackage ? join(compositorDir, ffprobePackage, process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe') : 'ffprobe';
function probe(path) {
  const output = execFileSync(ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', path], { encoding: 'utf8' });
  const duration = Number(JSON.parse(output).format?.duration);
  if (!Number.isFinite(duration) || duration <= 0) throw new Error(`Could not read duration of ${path}.`);
  return duration;
}
const lockPath = join(video, '.media-episode-render.lock');
let lock;
try { lock = openSync(lockPath, 'wx'); } catch { throw new Error('Another episode render is using this local Remotion workspace. Try again when it finishes.'); }
try {
  mkdirSync(targetDir, { recursive: true });
  mkdirSync(dirname(output), { recursive: true });
  for (const scene of cleaned) {
    writeFileSync(join(publicDir, scene.assetPath), files[scene.assetPath]);
    if (scene.backgroundPath) writeFileSync(join(publicDir, scene.backgroundPath), files[scene.backgroundPath]);
  }
  if (voicePath) {
    writeFileSync(join(publicDir, voicePath), files[voicePath]);
    const duration = probe(join(publicDir, voicePath));
    const planned = cleaned.reduce((sum, scene) => sum + scene.seconds, 0);
    if (Math.abs(duration - planned) > 1) throw new Error(`Voiceover is ${duration.toFixed(1)}s, but the scene plan is ${planned}s.`);
  }
  for (const scene of cleaned) {
    if (scene.assetPath.endsWith('.mp4')) {
      const duration = probe(join(publicDir, scene.assetPath));
      if (duration + 0.1 < scene.seconds) throw new Error(`Clip for scene ${scene.id} is ${duration.toFixed(1)}s, but the scene needs ${scene.seconds}s.`);
    }
  }
  writeFileSync(manifestPath, JSON.stringify({ title: manifest.title, aspectRatio: manifest.aspectRatio, scenes: cleaned, voicePath }));
  execFileSync(process.execPath, [join(video, 'node_modules', '@remotion', 'cli', 'remotion-cli.js'), 'render', 'media-episode', output], { cwd: video, stdio: 'inherit' });
  const rendered = readFileSync(output);
  const report = { episodeId: manifest.episodeId, output, durationSeconds: cleaned.reduce((sum, scene) => sum + scene.seconds, 0), voiceover: Boolean(voicePath), outputBytes: rendered.byteLength, outputSha256: createHash('sha256').update(rendered).digest('hex') };
  writeFileSync(`${output}.json`, JSON.stringify(report, null, 2));
  console.log(`Rendered ${output}`);
} finally {
  writeFileSync(manifestPath, originalManifest);
  rmSync(targetDir, { recursive: true, force: true });
  closeSync(lock);
  rmSync(lockPath, { force: true });
}
