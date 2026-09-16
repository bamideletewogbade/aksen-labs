import { mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';

/**
 * Fresh footage of Lead Scout, safe to publish.
 *
 * The screen recording from 15 September shows this feature working, and that
 * footage cannot be used: from about 1:10 it has real Ghanaian companies on
 * screen with their phone numbers and email addresses. Those businesses did not
 * agree to appear in Aksen's marketing. Blurring a scrolling page frame by
 * frame is fragile and one missed frame publishes a phone number, so the honest
 * fix is to record the interface again without the data in it.
 *
 * Two other things improve by re-recording rather than salvaging. Playwright
 * captures the page and nothing else, so there is no tab strip, no
 * localhost address bar and no personal bookmarks to crop away. And the admin
 * has been relit since that recording, so this shows what the product looks
 * like now rather than what it looked like last night.
 *
 * The search is deliberately never run. Clicking it spends a real research
 * allowance and returns real companies, which is the problem this exists to
 * avoid.
 *
 *   node scripts/record-leadscout.mjs
 */

const base = process.env.CAPTURE_URL || 'http://localhost:3000';
const OUT = resolve('out/social');
const RAW = resolve('out/social/.raw');
mkdirSync(OUT, { recursive: true });
rmSync(RAW, { recursive: true, force: true });
mkdirSync(RAW, { recursive: true });

/**
 * Written properly, because it is on screen for most of the clip. The target in
 * the old recording read "lets find schools we can sell ai powered services
 * too", which is a note to yourself, not a sentence for a customer to read.
 */
const TARGET = `Owner-led retail and made-to-order businesses in Accra.

They sell over WhatsApp and Instagram, take orders by message, and have no system behind it. Ten to fifty staff.

What matters: repeated questions, orders taken by hand, and a person spending their evening answering messages.`;

const { chromium } = await import('playwright');
const context = await chromium.launchPersistentContext(
  resolve('.auth/admin-profile'),
  {
    headless: true,
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 1,
    recordVideo: { dir: RAW, size: { width: 1600, height: 900 } },
  },
);

// The persistent context opens with a page already. Calling newPage() here made
// a second one, and Playwright records one video per page, so the file that
// came out was thirty seconds of the blank tab nobody used.
const page = context.pages()[0] ?? (await context.newPage());
await page.goto(`${base}/admin/prospects`, { waitUntil: 'networkidle' });
if (!/\/admin/.test(page.url())) {
  console.error('\nNot signed in. Run `node scripts/capture-site.mjs --admin`.\n');
  await context.close();
  process.exit(1);
}

// Collapse the rail so the working area fills the frame.
await page.evaluate(() => {
  document.documentElement.dataset.rail = 'collapsed';
});
await page.waitForTimeout(1400);

const field = page.locator('textarea').first();
await field.click();
await field.fill('');
await page.waitForTimeout(700);

// Typed rather than pasted. A field that fills instantly reads as a mock; a
// field being typed into reads as somebody using the thing.
for (const line of TARGET.split('\n')) {
  await field.type(line, { delay: 18 });
  await field.press('Enter');
}
await page.waitForTimeout(1600);

// Down to the staged pipeline, which is the part of this feature worth showing:
// it researches, checks evidence, rejects what it cannot support, and hands the
// result to a person.
await page.evaluate(() => window.scrollBy({ top: 420, behavior: 'smooth' }));
await page.waitForTimeout(2200);
await page.evaluate(() => window.scrollBy({ top: 420, behavior: 'smooth' }));
await page.waitForTimeout(2600);
await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
await page.waitForTimeout(1800);

await context.close();

// Largest file, not first. A blank page compresses to almost nothing, so size
// is a reliable way to tell the real recording from an empty one.
const { statSync: sizeOf } = await import('node:fs');
const webm = readdirSync(RAW)
  .filter((f) => f.endsWith('.webm'))
  .sort((a, b) => sizeOf(join(RAW, b)).size - sizeOf(join(RAW, a)).size)[0];
if (!webm) {
  console.error('\nPlaywright wrote no video.\n');
  process.exit(1);
}
const source = join(RAW, webm);
const out = join(OUT, 'leadscout-raw.mp4');

execFileSync(
  'ffmpeg',
  [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    source,
    '-c:v',
    'libx264',
    '-preset',
    'slow',
    '-crf',
    '20',
    '-pix_fmt',
    'yuv420p',
    '-r',
    '30',
    '-an',
    out,
  ],
  { stdio: 'inherit' },
);
renameSync(source, join(RAW, 'used.webm'));

const { statSync } = await import('node:fs');
const seconds = execFileSync(
  'ffprobe',
  ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out],
  { encoding: 'utf8' },
).trim();
console.log(
  `\nleadscout-raw.mp4  ${Number(seconds).toFixed(1)}s  ${(statSync(out).size / 1024 / 1024).toFixed(1)} MB`,
);
console.log('No search was run, so no real company appears in this clip.\n');
