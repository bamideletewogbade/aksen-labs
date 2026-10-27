// Existing records are read only. No financial action or message is submitted.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const base = process.env.BASE_URL;
const token = process.env.ADMIN_TOKEN;
if (!base || !token) throw new Error('Run scripts/run-e2e.mjs --daily-checks');
const browser = await chromium.launch();
const context = await browser.newContext();
await context.addCookies([
  {
    name: 'aksen_admin',
    value: token,
    url: base,
    httpOnly: true,
    sameSite: 'Lax',
  },
]);
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
await page.route('**/api/**', (route) => {
  if (route.request().method() === 'GET') return route.continue();
  errors.push(`Unexpected write request: ${route.request().method()}`);
  return route.abort();
});
try {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/admin', '/admin/money']) {
      await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
      assert.ok(
        await page.locator('.admin-header > a').isVisible(),
        'primary action remains visible on a phone',
      );
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      );
      if (width === 390 && path === '/admin') {
        mkdirSync('outputs/workspace-review', { recursive: true });
        await page.screenshot({
          path: 'outputs/workspace-review/today-390.png',
          fullPage: true,
        });
      }
    }
  }
  const response = await context.request.get(`${base}/api/admin/workspaces`);
  assert.equal(response.status(), 200);
  const { businesses } = await response.json();
  let checkedRecord = false;
  for (const business of businesses) {
    const result = await context.request.get(
      `${base}/api/admin/workspaces?businessId=${encodeURIComponent(business.id)}`,
    );
    assert.equal(result.status(), 200);
    const data = await result.json();
    const financial = data.financials[0];
    if (!financial) continue;
    const recordUrl = `${base}/admin/workspaces?businessId=${encodeURIComponent(business.id)}&financialId=${encodeURIComponent(financial.id)}&tab=finance`;
    await page.goto(recordUrl, { waitUntil: 'networkidle' });
    await page
      .locator('.ws-fin-detail')
      .getByRole('heading', { name: financial.number, exact: true })
      .waitFor();
    assert.equal(
      await page.locator('.ws-toolbar select').first().inputValue(),
      business.id,
    );
    await page.goto(
      `${base}/admin/workspaces?businessId=${encodeURIComponent(business.id)}&financialId=missing-record-for-read-only-check`,
      { waitUntil: 'networkidle' },
    );
    await page
      .getByRole('alert')
      .filter({ hasText: 'That financial record is not available' })
      .waitFor();
    assert.equal(await page.locator('.ws-fin-detail').count(), 0);
    checkedRecord = true;
    break;
  }
  await page.goto(
    `${base}/admin/workspaces?businessId=missing-client-for-read-only-check`,
    { waitUntil: 'networkidle' },
  );
  await page
    .getByRole('alert')
    .filter({ hasText: 'That client record is not available' })
    .waitFor();
  assert.equal(
    await page.locator('.ws-toolbar select').first().inputValue(),
    '',
  );
  assert.equal(
    await page.locator('.ws-context').count(),
    0,
    'a missing link must not silently open another client',
  );
  const signedOut = await browser.newContext();
  const visitor = await signedOut.newPage();
  await visitor.goto(`${base}/admin/money`, { waitUntil: 'networkidle' });
  assert.equal(new URL(visitor.url()).pathname, '/login');
  const denied = await signedOut.request.get(`${base}/api/admin/workspaces`);
  assert.equal(denied.status(), 403);
  await signedOut.close();
  assert.deepEqual(errors, []);
  console.log(
    `PASS missing-record handling and signed-out access; ${checkedRecord ? 'financial record opens the correct client and document' : 'no existing financial record available for positive link check'}`,
  );
} finally {
  await browser.close();
}
