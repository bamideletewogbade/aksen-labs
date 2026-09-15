import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';

/**
 * Records which human-recorded clips are sitting in public/footage.
 *
 * A component cannot check the filesystem: it is bundled and runs in a browser,
 * where node:fs does not exist. And it cannot just try to load the file and see,
 * because a missing video fails the render rather than falling back. So the
 * check happens here, ahead of the render, and the result is a small JSON file
 * the component imports.
 *
 * Wired to npm's pre-hooks, so `npm run studio` and `npm run render:all` both
 * rescan first. Dropping a recording in and pressing render is the whole
 * workflow; nobody should have to remember a second command.
 */
const DIR = 'public/footage';
const OUT = 'src/footage-manifest.json';

mkdirSync(DIR, { recursive: true });

const names = readdirSync(DIR)
  .filter((name) => name.toLowerCase().endsWith('.mp4'))
  .map((name) => name.replace(/\.mp4$/i, ''))
  .sort();

writeFileSync(OUT, `${JSON.stringify(names, null, 2)}\n`);

if (names.length)
  console.log(`footage: ${names.join(', ')}`);
else
  console.log(
    'footage: none yet. Record the to-camera shot in OBS and save it as public/footage/founder.mp4',
  );
