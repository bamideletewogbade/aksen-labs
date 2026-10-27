// Read-only page check. Creates and removes only its own temporary auth session.
import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { chromium } from 'playwright';
process.loadEnvFile('.env');
const base = process.env.BASE_URL || 'http://localhost:3000';
const db = neon(process.env.DATABASE_URL);
const hash = (text) => createHash('sha256').update(text).digest('hex');
const token = randomBytes(32).toString('hex');
const tokenHash = hash(token);
let browser;
try {
  await db.query(
    `INSERT INTO admin_sessions (token_hash,owner_id,email,config_version,expires_at) VALUES ($1,$2,$3,$4,now()+interval '10 minutes')`,
    [
      tokenHash,
      process.env.ADMIN_OWNER_ID,
      process.env.ADMIN_EMAILS.split(',')[0].trim(),
      hash(
        `${process.env.ADMIN_PASSWORD_HASH || ''}:${process.env.ADMIN_EMAILS || ''}`,
      ),
    ],
  );
  browser = await chromium.launch();
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
  for (const width of [1440, 375, 320]) {
    await page.setViewportSize({ width, height: 900 });
    const response = await page.goto(`${base}/admin/settings`, {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    assert.equal(response.status(), 200);
    assert.equal(new URL(page.url()).pathname, '/admin/settings');
    await page
      .getByRole('heading', { name: 'AI connection and credits' })
      .waitFor();
    const content = await page.locator('main').innerText();
    assert.ok(
      /USD [\d.]+ available|credit balance could not be checked/.test(content),
      'Balance or explicit unavailable state must render',
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    assert.deepEqual(errors, []);
    console.log(
      `PASS authenticated settings at ${width}px: ${content.includes('credit balance could not be checked') ? 'unavailable balance state' : 'live balance'}, test control, no page errors or overflow.`,
    );
  }
} finally {
  await browser?.close();
  await db.query('DELETE FROM admin_sessions WHERE token_hash=$1', [tokenHash]);
}
