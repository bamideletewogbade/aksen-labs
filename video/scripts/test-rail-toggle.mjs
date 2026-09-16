import { resolve } from 'node:path';

/** Does the button actually do it? The earlier check set the attribute by hand. */

const base = process.env.CAPTURE_URL || 'http://localhost:3000';
const { chromium } = await import('playwright');
const context = await chromium.launchPersistentContext(
  resolve('.auth/admin-profile'),
  { headless: true, viewport: { width: 1440, height: 900 } },
);
const page = await context.newPage();
page.on('console', (m) => {
  if (m.type() === 'error') console.log('  console error:', m.text().slice(0, 120));
});
page.on('pageerror', (e) => console.log('  page error:', e.message.slice(0, 160)));

// Always start from the same place, whatever the profile last remembered.
await page.goto(`${base}/admin`, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => localStorage.setItem('aksen-rail', 'expanded'));
await page.goto(`${base}/admin/prospects`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

const state = async (label) => {
  const s = await page.evaluate(() => ({
    rail: document.documentElement.dataset.rail,
    sidebar: Math.round(
      document.querySelector('.admin-sidebar').getBoundingClientRect().width,
    ),
    contentLeft: Math.round(
      document.querySelector('.admin-content').getBoundingClientRect().left,
    ),
    stored: (() => {
      try {
        return localStorage.getItem('aksen-rail');
      } catch {
        return 'blocked';
      }
    })(),
  }));
  console.log(
    `${label.padEnd(16)} rail=${String(s.rail).padEnd(9)} sidebar=${String(s.sidebar).padStart(3)}  content@${s.contentLeft}  stored=${s.stored}`,
  );
  return s;
};

await state('on load');

const toggle = page.locator('.admin-rail-toggle');
console.log('toggle found:', await toggle.count(), 'visible:', await toggle.isVisible().catch(() => false));

// Move the pointer away first: hovering the rail expands it and would mask
// whatever the click did.
await page.mouse.move(1200, 500);
await toggle.click({ force: true });
await page.waitForTimeout(600);
await page.mouse.move(1200, 500);
await page.waitForTimeout(400);
await state('after click 1');

await page.mouse.move(30, 400);
await page.waitForTimeout(600);
await state('hover open');

await page.mouse.move(1200, 500);
await page.waitForTimeout(600);
await state('unhover');

await page.mouse.move(30, 60);
await page.waitForTimeout(500);
await toggle.click();
await page.mouse.move(1200, 500);
await page.waitForTimeout(600);
await state('after click 2');

await context.close();
