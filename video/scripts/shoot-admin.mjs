import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Screenshots of admin pages, for looking at while changing how they look.
 *
 * capture-site.mjs produces marketing assets and is choosy about what it
 * photographs. This one is a working tool: it shoots whatever routes you name,
 * full page, into a scratch folder, so a restyle can be checked against every
 * screen rather than the one that happened to be open.
 *
 * Reuses the signed-in profile from `capture-site.mjs --admin`. If that profile
 * has never been signed in, this opens a window and waits for you to do it.
 *
 *   node scripts/shoot-admin.mjs                     every route below
 *   node scripts/shoot-admin.mjs social pipeline     just those
 *   node scripts/shoot-admin.mjs --out before        into out/shots/before
 */

const routes = {
  home: '/admin',
  social: '/admin/social',
  pipeline: '/admin/pipeline',
  projects: '/admin/projects',
  'agent-desk': '/admin/agent-desk',
  operations: '/admin/operations',
  feedback: '/admin/feedback',
  prospects: '/admin/prospects',
  content: '/admin/content',
  approvals: '/admin/approvals',
  settings: '/admin/settings',
  audit: '/admin/audit',
  workspaces: '/admin/workspaces',
  waitlist: '/admin/waitlist',
  email: '/admin/email',
  products: '/admin/products',
  templates: '/admin/templates',
  support: '/admin/support',
  studio: '/admin/studio',
  demos: '/admin/demos',
  agents: '/admin/agents',
};

const base = process.env.CAPTURE_URL || 'http://localhost:3000';
const args = process.argv.slice(2);
const outFlag = args.indexOf('--out');
const label = outFlag === -1 ? 'current' : args[outFlag + 1];
const wanted = args.filter(
  (a, i) => !a.startsWith('--') && i !== outFlag + 1 - 2 + 2,
);
const picked =
  wanted.length > 0
    ? Object.fromEntries(
        Object.entries(routes).filter(([name]) => wanted.includes(name)),
      )
    : routes;

const dir = resolve(`out/shots/${label}`);
mkdirSync(dir, { recursive: true });

const { chromium } = await import('playwright');
const context = await chromium.launchPersistentContext(
  resolve('.auth/admin-profile'),
  {
    headless: true,
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  },
);

const page = await context.newPage();
await page.goto(`${base}/admin`, { waitUntil: 'domcontentloaded' });
if (!/\/admin/.test(page.url())) {
  console.error(
    '\nNot signed in. Run `node scripts/capture-site.mjs --admin` once and sign in\n' +
      'inside the window it opens, then try again.\n',
  );
  await context.close();
  process.exit(1);
}

for (const [name, path] of Object.entries(picked)) {
  try {
    await page.goto(`${base}${path}`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    await page.waitForTimeout(1200);
    await page.screenshot({
      path: `${dir}/${name}.png`,
      fullPage: true,
      // Very long admin pages make a screenshot nobody can read. This is enough
      // to see the layout and the palette, which is what a restyle needs.
      clip: await page.evaluate(() => ({
        x: 0,
        y: 0,
        width: Math.min(document.documentElement.scrollWidth, 1440),
        height: Math.min(document.documentElement.scrollHeight, 2400),
      })),
    });
    console.log(`${name.padEnd(14)} ${path}`);
  } catch (error) {
    console.log(`${name.padEnd(14)} FAILED  ${error.message.slice(0, 80)}`);
  }
}

await context.close();
console.log(`\nWritten to ${dir}`);
