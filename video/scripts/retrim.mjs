import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { trimBorders } from './trim-borders.mjs';

/**
 * Trims the letterbox off images that were generated before the trim step
 * existed.
 *
 * A one-off, kept because it will be needed again the next time a model starts
 * doing something new to the edges of its output: the alternative is paying to
 * regenerate a set of pictures that are perfectly good apart from a border.
 */
let changed = 0;
for (const name of readdirSync('public/generated').filter((n) => n.endsWith('.png'))) {
  const path = `public/generated/${name}`;
  const { buffer, trimmed } = trimBorders(readFileSync(path));
  if (!trimmed) {
    console.log(`  clean    ${name}`);
    continue;
  }
  writeFileSync(path, buffer);
  changed += 1;
  console.log(
    `  trimmed  ${name}  top ${trimmed.top}, bottom ${trimmed.bottom}, left ${trimmed.left}, right ${trimmed.right}`,
  );
}
console.log(`\n${changed} trimmed.`);
