import { resolve } from 'node:path';

/**
 * Is anything broken at any width a person actually uses?
 *
 * Four faults, none of which a screenshot of one page catches:
 *
 *   overflow   the page scrolls sideways, which on a phone means the layout
 *              is wider than the device and everything is slightly wrong
 *   clipped    a control whose own content does not fit inside it, which is
 *              how a label ends up cut in half or pushed onto a second line
 *   offscreen  a control that extends past the right edge, so half the button
 *              is somewhere the thumb cannot reach
 *   tiny       a tap target under 24px, which is the floor in WCAG 2.5.8 and
 *              well under the 44px anyone designing for thumbs would use
 *
 *   node scripts/audit-ui.mjs            public pages
 *   node scripts/audit-ui.mjs --admin    the workspace as well
 */

const PUBLIC = [
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
  '/changelog',
  '/privacy',
];

const ADMIN = [
  '/admin',
  '/admin/social',
  '/admin/pipeline',
  '/admin/projects',
  '/admin/prospects',
  '/admin/content',
  '/admin/settings',
  '/admin/feedback',
];

// The widths that matter, not a sweep. 360 is the common floor on Android in
// Ghana, 390 covers most iPhones, 768 is where tablets and split windows live,
// 1440 is the desktop the design was drawn at.
const WIDTHS = [360, 390, 768, 1024, 1440];

const base = process.env.CAPTURE_URL || 'http://localhost:3000';
const withAdmin = process.argv.includes('--admin');

const check = () => {
  const faults = [];
  const vw = document.documentElement.clientWidth;
  const touch = vw < 900;

  if (document.documentElement.scrollWidth > vw + 1) {
    // Name the widest offender, or "the page is too wide" is unactionable.
    let worst = null;
    for (const el of document.querySelectorAll('body *')) {
      const b = el.getBoundingClientRect();
      if (b.width === 0 || b.height === 0) continue;
      const right = b.right + window.scrollX;
      if (right > vw + 1 && (!worst || right > worst.right)) {
        worst = { right, el };
      }
    }
    faults.push({
      kind: 'overflow',
      what: `page is ${document.documentElement.scrollWidth}px wide in a ${vw}px viewport`,
      cls: worst ? String(worst.el.className).slice(0, 60) : '',
      tag: worst ? worst.el.tagName.toLowerCase() : '',
    });
  }

  const seen = new Set();
  for (const el of document.querySelectorAll(
    'button, a, [role="button"], input[type="submit"], summary',
  )) {
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') continue;
    const b = el.getBoundingClientRect();
    if (b.width === 0 || b.height === 0) continue;
    const label = (el.textContent || '').replace(/\s+/g, ' ').trim();
    const cls = String(el.className).slice(0, 48);
    const key = `${cls}|${label.slice(0, 24)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    // Content bigger than its own box only matters when the box hides the
    // remainder. With overflow visible a line-height rounding of three or four
    // pixels spills harmlessly, and flagging that buries the real faults under
    // one row per wordmark per page.
    const hides = /hidden|clip/.test(style.overflowX + style.overflowY);
    const cutH = el.scrollWidth > el.clientWidth + 1;
    const cutV = el.scrollHeight > el.clientHeight + 1;
    if (hides && (cutH || cutV)) {
      faults.push({
        kind: 'clipped',
        what: `"${label.slice(0, 34)}" content ${el.scrollWidth}x${el.scrollHeight} cut to ${el.clientWidth}x${el.clientHeight}`,
        cls,
        tag: el.tagName.toLowerCase(),
      });
    } else if (cutH && el.scrollWidth > el.clientWidth + 8) {
      // Horizontal spill is still worth knowing about: a label wider than its
      // button is how a control ends up overlapping the one beside it.
      faults.push({
        kind: 'spill',
        what: `"${label.slice(0, 34)}" is ${el.scrollWidth}px wide in a ${el.clientWidth}px box`,
        cls,
        tag: el.tagName.toLowerCase(),
      });
    }

    // Past the edge only counts when nothing can bring it back. A tab strip
    // that scrolls sideways on a phone is a deliberate design, and its last
    // tab is supposed to start offscreen.
    let scroller = false;
    for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
      if (/auto|scroll/.test(getComputedStyle(n).overflowX)) {
        scroller = true;
        break;
      }
    }
    if (!scroller && (b.right > vw + 1 || b.left < -1)) {
      faults.push({
        kind: 'offscreen',
        what: `"${label.slice(0, 34)}" spans ${Math.round(b.left)} to ${Math.round(b.right)}`,
        cls,
        tag: el.tagName.toLowerCase(),
      });
    }

    // Only things that present themselves as targets. A link in a sentence is
    // text, and WCAG exempts it for that reason; measuring every one of them
    // reports forty rows of prose and hides the two controls that are wrong.
    // A target is something with a skin: a fill, an outline, or real padding.
    const pad =
      parseFloat(style.paddingTop) +
      parseFloat(style.paddingBottom) +
      parseFloat(style.paddingLeft) +
      parseFloat(style.paddingRight);
    const filled =
      style.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
      style.backgroundColor !== 'transparent';
    const outlined = parseFloat(style.borderTopWidth) > 0;
    const looksLikeTarget =
      el.tagName !== 'A' || filled || outlined || pad >= 12;

    if (touch && looksLikeTarget && (b.height < 24 || b.width < 24)) {
      faults.push({
        kind: 'tiny',
        what: `"${label.slice(0, 28) || el.getAttribute('aria-label') || '(icon)'}" is ${Math.round(b.width)}x${Math.round(b.height)}`,
        cls,
        tag: el.tagName.toLowerCase(),
      });
    }
  }
  return faults;
};

const { chromium } = await import('playwright');
const context = withAdmin
  ? await chromium.launchPersistentContext(resolve('.auth/admin-profile'), {
      headless: true,
    })
  : await chromium.launch({ headless: true }).then((b) => b.newContext());
const page = await context.newPage();

const routes = withAdmin ? [...PUBLIC, ...ADMIN] : PUBLIC;
let total = 0;
const tally = {};

for (const width of WIDTHS) {
  await page.setViewportSize({ width, height: 900 });
  const found = [];
  for (const route of routes) {
    try {
      await page.goto(`${base}${route}`, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });
      await page.waitForTimeout(700);
      const faults = await page.evaluate(check);
      for (const f of faults) found.push({ route, ...f });
    } catch (error) {
      found.push({
        route,
        kind: 'error',
        what: error.message.slice(0, 60),
        cls: '',
      });
    }
  }
  console.log(`\n=== ${width}px ${'='.repeat(46)}`);
  if (found.length === 0) console.log('  clean');
  let route = '';
  for (const f of found) {
    if (f.route !== route) {
      route = f.route;
      console.log(`  ${route}`);
    }
    tally[f.kind] = (tally[f.kind] || 0) + 1;
    total += 1;
    console.log(
      `    ${f.kind.padEnd(10)} ${f.what}${f.cls ? `\n               <${f.tag} class="${f.cls}">` : ''}`,
    );
  }
}

console.log(`\n${'-'.repeat(54)}`);
console.log(
  `${total} fault${total === 1 ? '' : 's'}${
    total ? `: ${Object.entries(tally).map(([k, n]) => `${n} ${k}`).join(', ')}` : ''
  }\n`,
);
await context.close();
