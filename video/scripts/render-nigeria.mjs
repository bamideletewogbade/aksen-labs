/**
 * Renders the Nigeria friends kit videos into out/nigeria.
 *
 *   node scripts/render-nigeria.mjs            all of them
 *   node scripts/render-nigeria.mjs salon      only ids containing "salon"
 *
 * Run `node scripts/generate.mjs ng-` first if the illustrations are missing,
 * and `node ../marketing/nigeria-kit/render.mjs` so the product screens in
 * public/ng-ui match the stills.
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readdirSync } from 'node:fs';
import { industries } from '../../marketing/nigeria-kit/config.mjs';

const filter = process.argv[2];
// Keep the screens the videos use in step with the stills, every time.
mkdirSync('public/ng-ui', { recursive: true });
for (const f of readdirSync('../marketing/nigeria-kit/out/ui'))
  copyFileSync(`../marketing/nigeria-kit/out/ui/${f}`, `public/ng-ui/${f}`);

const ids = ['ng-overview', 'ng-offers', ...industries.map((b) => `ng-reel-${b.id}`)].filter(
  (id) => !filter || id.includes(filter),
);
mkdirSync('out/nigeria', { recursive: true });
const extra = process.env.CHROME_PATH ? [`--browser-executable=${process.env.CHROME_PATH}`] : [];
for (const id of ids) {
  console.log(`rendering ${id}`);
  execFileSync('npx', ['remotion', 'render', 'src/index.ts', id, `out/nigeria/${id}.mp4`, '--crf=20', '--concurrency=2', ...extra], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
}
