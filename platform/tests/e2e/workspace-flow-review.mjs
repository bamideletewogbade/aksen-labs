// Read-only navigation/record review. Never submits forms or starts provider jobs.
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
const base = process.env.BASE_URL;
const token = process.env.ADMIN_TOKEN;
if (!base || !token)
  throw new Error('Run through scripts/run-e2e.mjs --workspace-review');
mkdirSync('outputs/workspace-review', { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
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
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
async function open(path) {
  const response = await page.goto(`${base}${path}`, {
    waitUntil: 'networkidle',
  });
  if (response.status() !== 200)
    console.log((await response.text()).slice(0, 2000));
  assert.equal(response.status(), 200, path);
  assert.notEqual(new URL(page.url()).pathname, '/login');
  await page.locator('h1').first().waitFor();
}
async function noOverflow(label) {
  const size = await page.evaluate(() => ({
    width: innerWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  if (size.scroll > size.width + 1) {
    console.log(
      await page.evaluate(() =>
        [...document.querySelectorAll('main *')]
          .filter(
            (el) =>
              el.getBoundingClientRect().right > innerWidth + 1 &&
              el.getBoundingClientRect().width,
          )
          .slice(0, 15)
          .map((el) => ({
            tag: el.tagName,
            classes: el.className,
            width: el.getBoundingClientRect().width,
            text: el.textContent.slice(0, 60),
          })),
      ),
    );
    await page.screenshot({
      path: 'outputs/workspace-review/overflow.png',
      fullPage: true,
    });
  }
  assert.ok(size.scroll <= size.width + 1, `${label}: ${JSON.stringify(size)}`);
}
try {
  if (!process.env.WORKSPACE_RESPONSIVE_ONLY) {
    await open('/admin/products');
    assert.equal(await page.locator('.admin-main-links a').count(), 7);
    await page.screenshot({
      path: 'outputs/workspace-review/portfolio-desktop.png',
      fullPage: true,
    });
    // Click every subordinate page, then verify its owning sidebar destination.
    const groups = [
      [
        '/admin/products',
        ['Product interest', 'Feedback', 'Demos', 'Branches & products'],
      ],
      [
        '/admin/pipeline',
        ['Assessment', 'Find prospects', 'Email', 'Conversations', 'Enquiries'],
      ],
      [
        '/admin/projects',
        ['Prepare a draft', 'Templates', 'Clients', 'Projects'],
      ],
      [
        '/admin/content',
        ['Publishing approvals', 'Social planning', 'Create media', 'Articles'],
      ],
      ['/admin/settings', ['AI costs & usage', 'Activity history', 'Settings']],
    ];
    for (const [path, labels] of groups) {
      await open(path);
      for (const label of labels) {
        await page
          .locator('.admin-module-nav')
          .getByRole('link', { name: label, exact: true })
          .click();
        await page.waitForLoadState('networkidle');
        assert.equal(
          await page
            .locator('.admin-links a[aria-current="page"]')
            .getAttribute('href'),
          path,
        );
      }
    }
    await open('/admin/prospects');
    for (const label of [
      'Review queue',
      'Import',
      'Automation & history',
      'Search',
    ]) {
      await page
        .getByRole('tab', { name: label, exact: label !== 'Review queue' })
        .click();
      assert.equal(
        await page
          .getByRole('tab', { name: label, exact: label !== 'Review queue' })
          .getAttribute('aria-selected'),
        'true',
      );
    }
    await open('/admin');
    assert.equal(
      await page.getByRole('heading', { name: 'Today', exact: true }).count(),
      1,
    );
    assert.ok((await page.locator('.daily-actions li').count()) <= 3);
    assert.equal(
      await page.getByText('Your work could not be loaded.').count(),
      0,
    );
    for (const area of ['Sales', 'Work', 'Money', 'All']) {
      const filter = page
        .getByRole('group', { name: 'Filter next steps' })
        .getByRole('button', { name: area, exact: true });
      await filter.click();
      assert.equal(await filter.getAttribute('aria-pressed'), 'true');
    }
    const nextLinks = await page
      .locator('.daily-actions a')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href')));
    for (const href of nextLinks) {
      await open(href);
      if (href.startsWith('/admin/projects')) {
        assert.equal(await page.locator('.project-list article').count(), 1);
        await page.getByRole('button', { name: 'Show all projects' }).click();
      } else if (href.startsWith('/admin/pipeline')) {
        assert.equal(await page.locator('.pl-list .pl-row').count(), 1);
        await page.getByRole('button', { name: 'Show all enquiries' }).click();
      }
    }
    await open('/admin/money');
    assert.equal(
      await page.getByText('Money records could not be loaded.').count(),
      0,
    );
    await page.screenshot({
      path: 'outputs/workspace-review/money-desktop.png',
      fullPage: true,
    });
    await open('/admin/projects');
    const seth = page
      .locator('.project-list article')
      .filter({ hasText: 'Dinero-Yard / Susu savings' });
    if (await seth.count()) {
      assert.match(await seth.innerText(), /Paid/);
      const njl = page
        .locator('.project-list article')
        .filter({ hasText: 'notjustlines / website' });
      assert.match(await njl.innerText(), /Payment recorded/);
      await seth
        .getByRole('link', { name: 'Client record', exact: true })
        .click();
      await page
        .getByText('CASH-20261010-SETH', { exact: true })
        .first()
        .waitFor();
      assert.match(await page.locator('body').innerText(), /Seth/);
      console.log('ok client links and recorded settlement states');
    }
  }
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of process.env.WORKSPACE_NAV_ONLY
      ? ['/admin/workspaces']
      : [
          '/admin',
          '/admin/money',
          '/admin/products',
          '/admin/pipeline',
          '/admin/prospects',
          '/admin/projects',
          '/admin/support',
          '/admin/workspaces',
        ]) {
      await open(path);
      await noOverflow(`${width} ${path}`);
      if (width === 390 && path === '/admin/products')
        await page.screenshot({
          path: 'outputs/workspace-review/portfolio-mobile.png',
          fullPage: true,
        });
      if ((width === 390 || width === 1440) && path === '/admin')
        await page.screenshot({
          path: `outputs/workspace-review/today-${width}.png`,
          fullPage: true,
        });
    }
    if (width <= 1024) {
      await page.getByRole('button', { name: 'Menu', exact: true }).click();
      if (width === 390)
        await page.screenshot({
          path: 'outputs/workspace-review/mobile-menu.png',
          fullPage: true,
        });
      await page
        .locator('.admin-links')
        .getByRole('link', { name: 'Sales', exact: true })
        .click();
      await page.waitForLoadState('networkidle');
      assert.equal(
        await page
          .getByRole('button', { name: 'Menu', exact: true })
          .getAttribute('aria-expanded'),
        'false',
      );
      await page.getByRole('button', { name: 'Menu', exact: true }).click();
      await page.keyboard.press('Escape');
      assert.equal(
        await page
          .getByRole('button', { name: 'Menu', exact: true })
          .getAttribute('aria-expanded'),
        'false',
      );
    }
    console.log(`ok ${width}px routes and navigation`);
  }
  assert.deepEqual(errors, []);
  console.log(
    'PASS workspace navigation, read-only client flows and responsive review',
  );
} finally {
  await browser.close();
}
