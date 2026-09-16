import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Stills for the ad, at film resolution.
 *
 * capture-site.mjs shoots phone-shaped frames for the website and refuses to
 * photograph anything holding client records. This shoots the same product at
 * 1920x1080 for a composition to push in on, and it inherits the same rule: no
 * route here renders a real prospect, a real client or a real contact detail.
 *
 * `at` scrolls before the shot, because the part of a page worth putting in a
 * film is rarely the part at the top.
 *
 *   node scripts/shoot-film-stills.mjs
 */

const shots = [
  { name: 'home-hero', path: '/', at: 0 },
  { name: 'home-flow', path: '/', at: 1150 },
  { name: 'home-line', path: '/', at: 2350 },
  { name: 'home-services', path: '/', at: 3150 },
  { name: 'home-proof', path: '/', at: 3900 },
  { name: 'home-open', path: '/', at: 4850 },
  { name: 'products', path: '/products', at: 300 },
  { name: 'agents', path: '/business-agents', at: 0 },
  { name: 'admin-home', path: '/admin', at: 0 },
  { name: 'admin-home-lower', path: '/admin', at: 620 },
  { name: 'admin-tools', path: '/admin/agent-desk', at: 0 },
  { name: 'admin-drafts', path: '/admin/operations', at: 0 },
  // The saved target in the database reads "lets find schools we can sell ai
  // powered services too", which is a note to yourself. `type` puts a written
  // sentence in the field for the photograph without saving it, so the
  // workspace keeps whatever the founder actually set.
  {
    name: 'admin-prospects',
    path: '/admin/prospects',
    at: 0,
    type: 'Owner-led retail and made-to-order businesses in Accra.\nThey sell over WhatsApp and Instagram, take orders by message, and have no system behind it.',
  },
  { name: 'admin-feedback', path: '/admin/feedback', at: 0 },
  { name: 'admin-social', path: '/admin/social', at: 0 },
  { name: 'admin-content', path: '/admin/content', at: 0 },
];

const base = process.env.CAPTURE_URL || 'http://localhost:3000';
const OUT = resolve('public/screens');
mkdirSync(OUT, { recursive: true });

const { chromium } = await import('playwright');
const context = await chromium.launchPersistentContext(
  resolve('.auth/admin-profile'),
  {
    headless: true,
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  },
);
const page = context.pages()[0] ?? (await context.newPage());

for (const shot of shots) {
  try {
    await page.goto(`${base}${shot.path}`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    // The rail is collapsed for every admin shot so the working area fills the
    // frame, which is what a film wants to show.
    await page.evaluate(() => {
      document.documentElement.dataset.rail = 'collapsed';
    });
    await page.waitForTimeout(700);
    if (shot.type) {
      const field = page.locator('textarea').first();
      await field.fill(shot.type);
      // Blur so the caret is not sitting in the middle of the shot. Plain JS:
      // this file is .mjs and a TypeScript cast here is a syntax error that
      // takes the whole capture down.
      await page.evaluate(() => {
        const el = document.activeElement;
        if (el && typeof el.blur === 'function') el.blur();
      });
      await page.waitForTimeout(500);
    }
    if (shot.at) {
      await page.evaluate((y) => window.scrollTo(0, y), shot.at);
      await page.waitForTimeout(900);
    }
    await page.screenshot({ path: `${OUT}/${shot.name}.png`, fullPage: false });
    console.log(`${shot.name.padEnd(20)} ${shot.path}`);
  } catch (error) {
    console.log(`${shot.name.padEnd(20)} FAILED ${error.message.slice(0, 60)}`);
  }
}

await context.close();
console.log(`\nWritten to ${OUT}\n`);
