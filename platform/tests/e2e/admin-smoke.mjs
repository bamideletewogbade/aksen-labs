/**
 * Every admin screen, opened the way the founder opens it.
 *
 * The suite in tests/ proves routes and libraries behave when called directly.
 * It cannot catch a server component that throws while rendering, a query that
 * returns a shape the page does not expect, or a client component that dies on
 * hydration, because in all three cases the route module itself is fine. Those
 * only show up in a browser, and until now nothing looked.
 *
 * Driven by scripts/run-e2e.mjs, which supplies the address and a session. Run
 * it directly only if you already have both:
 *   BASE_URL=http://localhost:3000 ADMIN_TOKEN=<64 hex> node tests/e2e/admin-smoke.mjs
 */
import { chromium } from 'playwright';

const base = process.env.BASE_URL || 'http://localhost:3000';
const token = process.env.ADMIN_TOKEN;
if (!token) {
  console.error('ADMIN_TOKEN is required. Run through scripts/run-e2e.mjs.');
  process.exit(1);
}

/**
 * Listed rather than globbed, so adding a screen is a deliberate line in this
 * file. A glob would have quietly covered a new page with whatever assertions
 * happened to be here, and quietly stopped covering one that got renamed.
 */
const routes = [
  '/admin',
  '/admin/agent-desk',
  '/admin/agents',
  '/admin/approvals',
  '/admin/audit',
  '/admin/content',
  '/admin/demos',
  '/admin/email',
  '/admin/feedback',
  '/admin/operations',
  '/admin/pipeline',
  '/admin/products',
  '/admin/projects',
  '/admin/prospects',
  '/admin/settings',
  '/admin/social',
  '/admin/studio',
  '/admin/support',
  '/admin/support/knowledge',
  '/admin/templates',
  '/admin/waitlist',
  '/admin/workspaces',
];

/**
 * Noise that is not this suite's business. Everything else a page logs to
 * console.error is treated as a finding, because in a server-rendered admin it
 * usually means a hydration mismatch or a failed fetch the screen swallowed.
 */
const ignored = [
  /favicon/i,
  /Download the React DevTools/i,
  /\[vite\]/i,
  /ERR_BLOCKED_BY_CLIENT/i,
];

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});
await context.addCookies([
  {
    name: 'aksen_admin',
    value: token,
    url: base,
    httpOnly: true,
    sameSite: 'Lax',
  },
]);

const findings = [];
const page = await context.newPage();

for (const route of routes) {
  const errors = [];
  const onConsole = (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (!ignored.some((pattern) => pattern.test(text))) errors.push(text);
  };
  const onCrash = (error) => errors.push(`uncaught: ${error.message}`);
  page.on('console', onConsole);
  page.on('pageerror', onCrash);

  let status = 0;
  let landed = '';
  try {
    const response = await page.goto(`${base}${route}`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    });
    status = response?.status() ?? 0;
    // Client components hydrate after domcontentloaded, and a component that
    // throws on hydration does it here rather than during navigation.
    await page.waitForTimeout(600);
    landed = new URL(page.url()).pathname;
  } catch (error) {
    errors.push(`navigation: ${error.message}`);
  }

  page.off('console', onConsole);
  page.off('pageerror', onCrash);

  // A redirect to /login means the session did not resolve, which is almost
  // never a bug in the page. It means the server is reading a different
  // database than the one the session was minted in, and every route after
  // this one would report the same thing for the same wrong reason.
  if (landed === '/login') {
    console.error(
      `\n  ${route} redirected to /login.\n` +
        '  The session cookie did not resolve. The dev server is almost\n' +
        '  certainly reading a different DATABASE_URL than the one the\n' +
        '  session was created in. Nothing below this point would be real.',
    );
    await browser.close();
    process.exit(1);
  }

  const ok = status === 200 && errors.length === 0;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${route}${ok ? '' : ` (${status})`}`);
  if (!ok) findings.push({ route, status, errors });
}

await browser.close();

console.log(`\n${routes.length - findings.length}/${routes.length} screens`);
for (const { route, status, errors } of findings) {
  console.log(`\n--- ${route} (HTTP ${status}) ---`);
  for (const error of errors) console.log(`  ${error}`);
}

process.exit(findings.length === 0 ? 0 : 1);
