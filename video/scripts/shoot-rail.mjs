import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

/** The rail in its three states, since two of them only exist under a pointer. */

const base = process.env.CAPTURE_URL || 'http://localhost:3000';
const dir = resolve('out/shots/rail');
mkdirSync(dir, { recursive: true });

const { chromium } = await import('playwright');
const context = await chromium.launchPersistentContext(
  resolve('.auth/admin-profile'),
  { headless: true, viewport: { width: 1440, height: 900 } },
);
const page = await context.newPage();
await page.goto(`${base}/admin/prospects`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

const shot = async (name) => {
  await page.screenshot({ path: `${dir}/${name}.png` });
  console.log(name);
};

await shot('1-expanded');

await page.evaluate(() => {
  document.documentElement.dataset.rail = 'collapsed';
});
await page.waitForTimeout(600);
await shot('2-collapsed');

// Hover the rail. The expansion is CSS, so a real pointer move is the only way
// to see what a person sees.
await page.mouse.move(30, 400);
await page.waitForTimeout(700);
await shot('3-hovered');

const width = await page.evaluate(() => {
  const side = document.querySelector('.admin-sidebar');
  const main = document.querySelector('.admin-content');
  return {
    sidebar: Math.round(side.getBoundingClientRect().width),
    contentLeft: Math.round(main.getBoundingClientRect().left),
  };
});
console.log('\nhovered sidebar width:', width.sidebar);
console.log('content left edge:', width.contentLeft, '(must not move on hover)');

await context.close();
