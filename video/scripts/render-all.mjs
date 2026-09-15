import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

/**
 * Renders every cut of every story in one go.
 *
 * Remotion's CLI renders one composition per call, and the thing you actually
 * want at the end of a session is all three shapes of the same story, named the
 * same way, in one folder you can open on a phone. Doing that by hand is three
 * commands and one typo away from posting the square cut to Stories.
 */
const stories = ['order-story'];
const formats = ['vertical', 'square', 'wide'];

mkdirSync('out', { recursive: true });

for (const story of stories) {
  for (const format of formats) {
    const id = `${story}-${format}`;
    const output = `out/${id}.mp4`;
    process.stdout.write(`\nRendering ${id}\n`);
    // Inherited stdio so Remotion's own progress bar is the progress bar, and a
    // failure stops the loop instead of being swallowed into a summary.
    execFileSync('npx', ['remotion', 'render', id, output], {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
  }
}

process.stdout.write('\nAll cuts rendered into out/\n');
