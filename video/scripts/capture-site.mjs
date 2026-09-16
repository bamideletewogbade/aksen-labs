import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Screens of the running software, for the homepage to show.
 *
 * capture.mjs takes footage for the film. This takes stills the website itself
 * serves, which is a different job with different rules: they go into the
 * platform's public folder as committed assets, so the site never depends on
 * this workspace at build time, only on somebody re-running this after a
 * redesign.
 *
 * Phone-sized on purpose. The homepage shows them in a phone frame, most of the
 * people who will see them are holding one, and a desktop screenshot scaled
 * into a narrow column is unreadable.
 *
 * Before the first run:
 *   npm install --no-save playwright
 *   npx playwright install chromium
 *
 * Public screens (no login):
 *   node scripts/capture-site.mjs
 *
 * Admin screens: the admin is behind a password this script must never hold.
 * It opens a real browser window at the login page and waits for you to sign in
 * IN THAT WINDOW, then captures.
 *   node scripts/capture-site.mjs --admin
 *
 * The window is its own browser with its own cookies, so signing in anywhere
 * else does nothing for it. It keeps a profile under .auth/ so the next run
 * finds you already signed in. That directory is a live session for whoever
 * has the machine: it is gitignored, and deleting it signs the profile out.
 */

const OUT = resolve('../platform/public/captures');
const base = process.env.CAPTURE_URL || 'http://localhost:3000';
const wantsAdmin = process.argv.includes('--admin');

const publicShots = [
  { name: 'products', path: '/products', settle: 1800 },
  { name: 'business-agents', path: '/business-agents', settle: 1800 },
  { name: 'order-demo', path: '/order-demo', settle: 2000 },
  { name: 'support-demo', path: '/support-demo', settle: 1800 },
];

/**
 * Screens of the controls, not of the records.
 *
 * /admin/projects and /admin/pipeline are deliberately not here. Projects
 * renders live client rows: the first capture of it showed a named prospect and
 * the state of an open negotiation, which is not ours to publish. Pipeline is
 * safe today only because it happens to be empty, and a shot that is safe by
 * accident will stop being safe the week somebody fills it in.
 *
 * If a records screen is ever wanted on the public site, seed a fictional
 * dataset and capture that. Do not capture the real one and check it afterwards.
 */
const adminShots = [
  { name: 'admin-agent-desk', path: '/admin/agent-desk', settle: 2400 },
  { name: 'admin-operations', path: '/admin/operations', settle: 2400 },
  { name: 'admin-feedback', path: '/admin/feedback', settle: 2400 },
];

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error(
    'Playwright is not installed. Run:\n  npm install --no-save playwright\n  npx playwright install chromium',
  );
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });

// Two shapes, because the two halves are used on two machines. A customer
// meets the public site on a phone; the workspace is a thing you sit down in
// front of, and squeezed into a phone frame it would be a picture of an admin
// nobody actually uses that way.
const settings = {
  viewport: wantsAdmin
    ? { width: 1280, height: 800 }
    : { width: 430, height: 620 },
  deviceScaleFactor: 2,
  // Every capture should be the same capture. A reveal caught half finished
  // reads as a rendering bug in the screenshot.
  reducedMotion: 'reduce',
};

// The admin run keeps its profile so signing in is a once-per-machine job
// rather than a toll on every capture. The public run stays throwaway.
const browser = wantsAdmin
  ? await chromium.launchPersistentContext(resolve('.auth/admin-profile'), {
      headless: false,
      ...settings,
    })
  : await chromium.launch({ headless: true });
const context = wantsAdmin ? browser : await browser.newContext(settings);

/**
 * PNG in, WebP out, using the browser that is already open.
 *
 * Six phone screenshots at 2x come to several megabytes of PNG, which is not a
 * thing to put on a homepage. Encoding them needs an image library, or it needs
 * a canvas, and there is a canvas right here.
 */
async function toWebp(page, png, name) {
  const dataUrl = await page.evaluate(async (bytes) => {
    const blob = new Blob([new Uint8Array(bytes)], { type: 'image/png' });
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext('2d').drawImage(bitmap, 0, 0);
    return canvas.toDataURL('image/webp', 0.86);
  }, [...png]);
  const body = Buffer.from(dataUrl.split(',')[1], 'base64');
  writeFileSync(resolve(OUT, `${name}.webp`), body);
  return body.length;
}

async function capture(shots) {
  const page = await context.newPage();
  for (const shot of shots) {
    await page.goto(`${base}${shot.path}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(shot.settle);
    const png = await page.screenshot({ fullPage: false });
    const size = await toWebp(page, png, shot.name);
    console.log(`${shot.name}.webp  ${Math.round(size / 1024)} KB`);
  }
  await page.close();
}

if (wantsAdmin) {
  const page = await context.newPage();
  await page.goto(`${base}/admin`);
  if (!/\/admin/.test(page.url())) {
    console.log(
      '\n' +
        '  A browser window has opened. Sign in INSIDE THAT WINDOW.\n' +
        '  It is a separate browser with its own cookies, so signing in\n' +
        '  anywhere else will not reach it. This script never sees the\n' +
        '  password.\n\n' +
        '  Waiting up to ten minutes...\n',
    );
    // A heartbeat, because "still waiting" and "you signed in somewhere else"
    // look identical from here otherwise.
    const beat = setInterval(() => {
      console.log(`  ...still on ${page.url()}`);
    }, 10000);
    try {
      await page.waitForURL(/\/admin/, { timeout: 600000 });
    } finally {
      clearInterval(beat);
    }
  }
  console.log('Signed in. Capturing.\n');
  await page.close();
  await capture(adminShots);
} else {
  await capture(publicShots);
}

await browser.close();
console.log(`\nWritten to ${OUT}`);
