import { resolve } from 'node:path';

/**
 * Every place in the admin where text cannot be read against what is behind it.
 *
 * Repainting a dark theme white turns contrast from a thing you designed into a
 * thing you inherited, and "check the other buttons" is not a job for eyes on
 * twenty-one pages. This walks the real DOM, resolves the actual background
 * behind each element including transparent ancestors, and reports anything
 * under the WCAG AA ratio for its size.
 *
 *   node scripts/audit-contrast.mjs
 *   node scripts/audit-contrast.mjs --all   include passes
 */

const routes = [
  '/admin',
  '/admin/social',
  '/admin/pipeline',
  '/admin/projects',
  '/admin/agent-desk',
  '/admin/operations',
  '/admin/feedback',
  '/admin/prospects',
  '/admin/content',
  '/admin/approvals',
  '/admin/settings',
  '/admin/audit',
  '/admin/workspaces',
  '/admin/waitlist',
  '/admin/email',
  '/admin/products',
  '/admin/templates',
  '/admin/support',
  '/admin/studio',
  '/admin/demos',
  '/admin/agents',
];

const base = process.env.CAPTURE_URL || 'http://localhost:3000';
const showAll = process.argv.includes('--all');

const { chromium } = await import('playwright');
const context = await chromium.launchPersistentContext(
  resolve('.auth/admin-profile'),
  { headless: true, viewport: { width: 1440, height: 1000 } },
);
const page = await context.newPage();

await page.goto(`${base}/admin`, { waitUntil: 'domcontentloaded' });
if (!/\/admin/.test(page.url())) {
  console.error('Not signed in. Run `node scripts/capture-site.mjs --admin`.');
  await context.close();
  process.exit(1);
}

const audit = () => {
  const parse = (value) => {
    const m = value.match(/[\d.]+/g);
    if (!m) return null;
    const [r, g, b, a = '1'] = m.map(Number);
    return { r, g, b, a };
  };
  // Alpha over whatever is behind it, or the reading is the colour the element
  // asked for rather than the colour a person sees.
  const over = (top, bottom) => ({
    r: top.r * top.a + bottom.r * (1 - top.a),
    g: top.g * top.a + bottom.g * (1 - top.a),
    b: top.b * top.a + bottom.b * (1 - top.a),
    a: 1,
  });
  const backdrop = (el) => {
    let layer = { r: 255, g: 255, b: 255, a: 1 };
    const stack = [];
    for (let n = el; n; n = n.parentElement) stack.push(n);
    for (const n of stack.reverse()) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0) layer = over(c, layer);
    }
    return layer;
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };

  const out = [];
  const seen = new Set();
  const targets = document.querySelectorAll(
    'button, a, [role="button"], .admin-primary, .admin-secondary, .badge, .chip',
  );
  for (const el of targets) {
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (!text) continue;
    const box = el.getBoundingClientRect();
    if (box.width < 2 || box.height < 2) continue;
    const style = getComputedStyle(el);
    if (style.visibility === 'hidden' || style.display === 'none') continue;

    const fgRaw = parse(style.color);
    if (!fgRaw) continue;
    const bg = backdrop(el);
    const fg = fgRaw.a < 1 ? over(fgRaw, bg) : fgRaw;
    const size = parseFloat(style.fontSize);
    const bold = parseInt(style.fontWeight, 10) >= 700;
    const large = size >= 24 || (size >= 18.66 && bold);
    const need = large ? 3 : 4.5;
    const r = ratio(fg, bg);

    const key = `${el.className}|${text.slice(0, 30)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      text: text.slice(0, 44),
      cls: String(el.className).slice(0, 52),
      fg: style.color,
      bg: `rgb(${Math.round(bg.r)}, ${Math.round(bg.g)}, ${Math.round(bg.b)})`,
      ratio: Math.round(r * 100) / 100,
      need,
      pass: r >= need,
    });
  }
  return out;
};

let failures = 0;
for (const route of routes) {
  try {
    await page.goto(`${base}${route}`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    await page.waitForTimeout(900);
    const rows = await page.evaluate(audit);
    const bad = showAll ? rows : rows.filter((r) => !r.pass);
    if (bad.length === 0) continue;
    console.log(`\n${route}`);
    for (const r of bad) {
      failures += r.pass ? 0 : 1;
      console.log(
        `  ${r.pass ? 'ok  ' : 'FAIL'} ${String(r.ratio).padStart(5)}:1 (need ${r.need})  "${r.text}"`,
      );
      if (!r.pass) console.log(`        ${r.fg} on ${r.bg}   .${r.cls}`);
    }
  } catch (error) {
    console.log(`\n${route}\n  could not load: ${error.message.slice(0, 70)}`);
  }
}

console.log(`\n${failures} unreadable element${failures === 1 ? '' : 's'}.\n`);
await context.close();
