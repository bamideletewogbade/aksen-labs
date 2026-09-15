import { mkdirSync } from 'node:fs';

/**
 * Screen footage of the real product, captured by script rather than by hand.
 *
 * OBS is the obvious tool for this and it is the wrong one here. OBS records a
 * person doing something on a screen: it catches the notification that arrives
 * mid-take, it cannot be repeated identically, and every time the interface
 * changes somebody has to sit down and perform the demo again. For a web
 * product, a script that drives a headless browser gives you the same shot every
 * time, and re-running it after a redesign costs one command.
 *
 * OBS still earns its place for anything that is not a web page: a phone screen
 * mirrored to the desktop showing the WhatsApp agent taking a real order is
 * footage this cannot produce.
 *
 * Playwright is not a dependency of this workspace, because it pulls a browser
 * down with it and most renders do not need footage at all. Before the first
 * run:
 *
 *   npm install --no-save playwright
 *   npx playwright install chromium
 *
 * Then start the site (pnpm dev in ../platform) and run `npm run capture`.
 */

const shots = [
  { name: 'home-hero', path: '/', settle: 2500 },
  { name: 'products-tools', path: '/products', settle: 1800 },
  { name: 'feedback-board', path: '/feedback', settle: 1800 },
  { name: 'order-demo', path: '/order-demo', settle: 2000 },
];

const base = process.env.CAPTURE_URL || 'http://localhost:3000';

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error(
    'Playwright is not installed. Run:\n  npm install --no-save playwright\n  npx playwright install chromium',
  );
  process.exit(1);
}

mkdirSync('public/captures', { recursive: true });

// The phone frame the vertical cut is built around. Capturing at this size
// rather than cropping a desktop shot means the site's own mobile layout is
// what appears in the video, which is the layout the viewer will meet.
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 430, height: 860 },
  deviceScaleFactor: 3,
  // Every render is deterministic, so the footage should be too: no reveal
  // animation half-finished in one capture and finished in the next.
  reducedMotion: 'reduce',
});

for (const shot of shots) {
  const page = await context.newPage();
  await page.goto(`${base}${shot.path}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(shot.settle);
  await page.screenshot({
    path: `public/captures/${shot.name}.png`,
    fullPage: false,
  });
  console.log(`captured ${shot.name}`);
  await page.close();
}

await browser.close();
console.log('\nFootage is in public/captures. Use it in a composition with <Img src={staticFile("captures/home-hero.png")} />.');
