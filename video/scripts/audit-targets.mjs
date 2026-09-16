import { resolve } from 'node:path';

/**
 * Tap targets under 44px on the pages a customer sees.
 *
 * 24px is the WCAG 2.5.8 floor and audit-ui.mjs treats anything below it as a
 * fault. 44px is the size a thumb actually wants, and on the client-facing
 * pages that is the bar worth holding. This lists everything in between so the
 * gap is a decision rather than an oversight.
 */

const ROUTES = [
  '/',
  '/solutions',
  '/pricing',
  '/how-it-works',
  '/about',
  '/products',
  '/business-agents',
  '/order-demo',
  '/support-demo',
  '/workspace-demo',
  '/agent-mapper',
  '/industries',
  '/feedback',
  '/blog',
];

const base = process.env.CAPTURE_URL || 'http://localhost:3000';
const COMFORT = 44;

const check = (comfort) => {
  const out = [];
  const seen = new Set();
  for (const el of document.querySelectorAll(
    'button, a, [role="button"], input[type="submit"], summary',
  )) {
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;

    const pad =
      parseFloat(s.paddingTop) +
      parseFloat(s.paddingBottom) +
      parseFloat(s.paddingLeft) +
      parseFloat(s.paddingRight);
    const filled = s.backgroundColor !== 'rgba(0, 0, 0, 0)';
    const outlined = parseFloat(s.borderTopWidth) > 0;
    if (el.tagName === 'A' && !filled && !outlined && pad < 12) continue;

    const small = Math.min(r.width, r.height);
    if (small >= comfort) continue;

    const label = (el.textContent || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 30);
    const cls = String(el.className).slice(0, 40);
    const key = `${cls}|${label}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      label: label || el.getAttribute('aria-label') || '(icon)',
      cls,
      size: `${Math.round(r.width)}x${Math.round(r.height)}`,
    });
  }
  return out;
};

const { chromium } = await import('playwright');
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 900 },
  hasTouch: true,
});
const page = await context.newPage();

let n = 0;
for (const route of ROUTES) {
  await page.goto(`${base}${route}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const rows = await page.evaluate(check, COMFORT);
  if (!rows.length) continue;
  console.log(`\n${route}`);
  for (const r of rows) {
    n += 1;
    console.log(`  ${r.size.padStart(7)}  "${r.label}"  .${r.cls}`);
  }
}
console.log(`\n${n} target${n === 1 ? '' : 's'} under ${COMFORT}px at 390px.\n`);
void resolve;
await browser.close();
