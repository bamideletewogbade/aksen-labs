/**
 * Does the saved capture profile reach the admin, and where does it land if
 * not? A one-line answer, so a failed capture run does not turn into guessing
 * about whether somebody signed in to the wrong window.
 */
import { resolve } from 'node:path';

const { chromium } = await import('playwright');
const base = process.env.CAPTURE_URL || 'http://localhost:3000';

const context = await chromium.launchPersistentContext(
  resolve('.auth/admin-profile'),
  { headless: true, viewport: { width: 1280, height: 800 } },
);
const page = await context.newPage();
await page.goto(`${base}/admin`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);
console.log(`landed on: ${page.url()}`);
console.log(`title: ${await page.title()}`);
await context.close();
