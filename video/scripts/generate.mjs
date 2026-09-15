import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { loadEnv } from './load-env.mjs';
import { assets, clips } from '../assets.config.mjs';

loadEnv();
// Imported after the environment is loaded, because the client reads the key at
// call time and a missing one should fail with the message from load-env.
const { image, video } = await import('../src/ai/openrouter.mjs');

/**
 * Generates the assets the compositions need, once, and caches them on disk.
 *
 * This is the whole design of the AI layer, so it is worth being explicit about
 * why it is a build step and not something a composition does while rendering.
 *
 * A Remotion render calls your component once per frame. At 30fps a ten second
 * clip is three hundred calls. If a frame asked a model for an image, the render
 * would cost three hundred generations, take an hour, and every frame would show
 * a different picture, because these models are not deterministic. Re-rendering
 * after a one word copy change would produce a different video.
 *
 * So generation happens here, ahead of time, keyed on a hash of the prompt and
 * its parameters. An asset already on disk is not generated again. The render
 * then reads files, which makes it fast, repeatable, and free. Delete a file to
 * force one asset to be made again; change a prompt and change its key.
 *
 *   node scripts/generate.mjs            all pending assets
 *   node scripts/generate.mjs shopfront  only keys containing "shopfront"
 *   node scripts/generate.mjs --clips    include the video clips, which are slow
 *   node scripts/generate.mjs --dry      print what would be spent, generate nothing
 */

const OUT = 'public/generated';
const MANIFEST = 'src/generated-manifest.json';

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const withClips = args.includes('--clips');
const filter = args.find((a) => !a.startsWith('--'));

// The key identifies the asset; the fingerprint identifies its content. Both are
// recorded, so a file whose prompt has since been edited is visible as stale
// rather than silently being the wrong picture.
const fingerprint = (entry) =>
  createHash('sha256')
    .update(JSON.stringify({ p: entry.prompt, a: entry.aspectRatio, d: entry.duration }))
    .digest('hex')
    .slice(0, 12);

mkdirSync(OUT, { recursive: true });

let manifest = {};
if (existsSync(MANIFEST)) {
  try {
    manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  } catch {
    // A corrupted manifest should not block a rebuild; the files are the truth
    // and the manifest is rewritten from them below.
    manifest = {};
  }
}

const queue = [...assets, ...(withClips ? clips : [])].filter(
  (entry) => !filter || entry.key.includes(filter),
);

if (queue.length === 0) {
  console.log('Nothing matched. Check assets.config.mjs.');
  process.exit(0);
}

let made = 0;
let skipped = 0;

for (const entry of queue) {
  const print = fingerprint(entry);
  const extension = entry.kind === 'video' ? 'mp4' : 'png';
  const file = `${OUT}/${entry.key}.${extension}`;
  const recorded = manifest[entry.key];

  if (existsSync(file) && recorded?.fingerprint === print) {
    skipped += 1;
    console.log(`  cached   ${entry.key}`);
    continue;
  }
  if (existsSync(file) && recorded?.fingerprint !== print)
    console.log(`  changed  ${entry.key} (prompt edited, regenerating)`);

  if (dry) {
    console.log(`  would generate  ${entry.key} (${entry.kind})`);
    continue;
  }

  process.stdout.write(`  making   ${entry.key} `);
  try {
    if (entry.kind === 'video') {
      const result = await video(entry);
      writeFileSync(file, result.buffer);
      manifest[entry.key] = record(entry, print, file, result.model);
    } else {
      const result = await image(entry);
      writeFileSync(file, Buffer.from(result.base64, 'base64'));
      manifest[entry.key] = record(entry, print, file, result.model, result.cost);
    }
    made += 1;
    process.stdout.write('done\n');
  } catch (error) {
    // One failed asset must not lose the ones already made, so the manifest is
    // written at the end regardless and this keeps going.
    process.stdout.write(`failed: ${error.message}\n`);
  }
}

function record(entry, print, file, model, cost) {
  return {
    // The provenance travels with the asset on purpose. Six months from now the
    // only way to know whether a frame was generated, by what, and from what
    // instruction, is if it was written down at the time.
    file: file.replace('public/', ''),
    kind: entry.kind,
    fingerprint: print,
    prompt: entry.prompt,
    model,
    label: entry.label ?? null,
    aspectRatio: entry.aspectRatio ?? null,
    generatedAt: new Date().toISOString(),
    ...(typeof cost === 'number' ? { costUsd: cost } : {}),
  };
}

writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`\n${made} generated, ${skipped} already cached. Manifest: ${MANIFEST}`);
if (!dry && made > 0)
  console.log('Commit public/generated and the manifest so a render never has to pay for them again.');
