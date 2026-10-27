// Reads actual screens; blocks business mutations and paid provider requests.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const base = process.env.BASE_URL;
if (!base || !process.env.ADMIN_TOKEN) throw Error('Use scripts/run-e2e.mjs --ux-review');
const output = 'work/admin-ux-review';
mkdirSync(output, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext();
await context.addCookies([{ name: 'aksen_admin', value: process.env.ADMIN_TOKEN, url: base, httpOnly: true, sameSite: 'Lax' }]);
await context.route('**/api/**', route => ['GET', 'HEAD'].includes(route.request().method()) ? route.continue() : route.abort());
const page = await context.newPage();
const routes = ['','money','pipeline','projects','workspaces','prospects','assessment','assessment/client','operations','templates','support','support/knowledge','email','content','social','studio','approvals','products','waitlist','feedback','demos','settings','agents','audit'];
const results = [];
try {
  for (const route of routes) {
    const errors = [];
    const onError = e => errors.push(e.message);
    page.on('pageerror', onError);
    await page.setViewportSize({ width: 1440, height: 1000 });
    const response = await page.goto(`${base}/admin${route ? `/${route}` : ''}`, { waitUntil: 'networkidle', timeout: 60000 });
    if (new URL(page.url()).pathname === '/login') throw Error('Session did not resolve');
    const samples = [];
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      samples.push(await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, overflow: [...document.querySelectorAll('main *')].filter(e => e.getBoundingClientRect().right > innerWidth + 2 && getComputedStyle(e).position !== 'fixed').slice(0, 5).map(e => ({ tag: e.tagName, class: e.className })) })));
      if (width === 1440 || width === 390) await page.screenshot({path: `${output}/${route.replaceAll('/', '-') || 'today'}-${width}.png`, fullPage: true});
    }
    results.push({route, status: response.status(), errors, samples});
    console.log(JSON.stringify(results.at(-1)));
    page.off('pageerror', onError);
  }
} finally {
  writeFileSync(`${output}/survey.json`, JSON.stringify(results, null, 2));
  await browser.close();
}
if (results.some(r => r.status !== 200 || r.errors.length || r.samples.some(s => s.scroll > s.width + 1))) process.exitCode = 1;
