/**
 * Builds the Nigeria friends kit: every still image, in every shape.
 *
 *   node render.mjs            everything
 *   node render.mjs boutique   only files whose name contains "boutique"
 *
 * Why HTML and a headless browser rather than a design tool: a friend asks for
 * "the salon one but square" and it is one command, and a price change updates
 * forty images at once instead of forty edits nobody makes.
 *
 * Needs Chromium. Set CHROME_PATH if Playwright cannot find one.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import { contact, industries, offers } from './config.mjs';
import { screens, uiCss } from './ui.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, 'out');
const ART = join(here, '../../video/public/generated');
const filter = process.argv.slice(2).find((a) => !a.startsWith('--'));

const url = (p) => pathToFileURL(p).href;
const art = (key) => {
  const file = join(ART, `${key}.png`);
  // Inlined, because a page set from a string has no origin and Chromium will
  // not load file:// images into it. Fonts are fine; backgrounds are not.
  if (!existsSync(file)) return 'linear-gradient(160deg,#175b3b,#062319)';
  return `url('data:image/png;base64,${readFileSync(file).toString('base64')}')`;
};
const offer = (id) => offers.find((o) => o.id === id);

const fonts = ['Regular:400', 'Medium:500', 'SemiBold:600', 'Bold:700', 'Black:900']
  .map((w) => {
    const [name, weight] = w.split(':');
    return `@font-face{font-family:Geist;font-weight:${weight};src:url('${url(join(here, `fonts/Geist-${name}.woff2`))}')}`;
  })
  .join('');

const base = `
${fonts}
@font-face{font-family:'Geist Mono';src:url('${url(join(here, 'fonts/GeistMono-Medium.woff2'))}')}
*{box-sizing:border-box;margin:0}
body{font-family:Geist,sans-serif;background:transparent;-webkit-font-smoothing:antialiased}
.frame{position:relative;overflow:hidden;color:#fff;background:#062319}
.art{position:absolute;inset:0;background-size:cover;background-position:center}
.scrim{position:absolute;inset:0}
.kicker{font-family:'Geist Mono',monospace;font-size:30px;letter-spacing:5px;text-transform:uppercase;color:#c2f576;display:flex;align-items:center;gap:16px}
.kicker:before{content:'';width:14px;height:14px;border-radius:50%;background:#7cff62;box-shadow:0 0 18px #7cff62}
h1{font-weight:700;letter-spacing:-3px;line-height:1.0}
h1 em{font-family:Georgia,serif;font-style:italic;font-weight:400;color:#c2f576;letter-spacing:-1px}
.lede{color:#e7efe3;line-height:1.3}
.brand{display:flex;align-items:center;gap:14px;font-weight:700;font-size:34px;letter-spacing:-.5px}
.brand i{width:44px;height:44px;border-radius:13px;background:#c2f576;box-shadow:inset 0 0 0 9px #175b3b}
.label{font-size:20px;color:rgba(231,239,227,.72);font-family:'Geist Mono',monospace;letter-spacing:1px}
.cta{display:flex;align-items:center;justify-content:space-between;gap:20px;background:#c2f576;color:#062319;border-radius:30px;padding:26px 32px}
.cta b{font-size:36px;letter-spacing:-.5px;display:block}.cta span{font-size:26px;font-weight:600;display:block}.cta .cta-link{font-size:21px;font-weight:500;opacity:.75;font-family:'Geist Mono',monospace}
.wa{width:74px;height:74px;border-radius:50%;background:#062319;display:grid;place-items:center;flex:none}
.price{display:inline-flex;align-items:baseline;gap:14px;background:rgba(6,35,25,.78);border:1.5px solid rgba(194,245,118,.5);border-radius:999px;padding:14px 28px;backdrop-filter:blur(8px)}
.price span{font-size:24px;color:#a9bcb2}.price b{font-size:40px;color:#c2f576}
${uiCss}
`;

const waIcon = `<svg width="40" height="40" viewBox="0 0 24 24" fill="#c2f576"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.7.3-.2.3-.9.9-.9 2.2s1 2.5 1.1 2.7c.1.2 1.9 2.9 4.6 4 1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2l-.5-.3Z"/></svg>`;

const cta = (big = 'Book a free discovery call') => `
<div class="cta"><div><b>${big}</b><span>WhatsApp ${contact.whatsappDisplay}</span>${contact.link ? `<span class="cta-link">${contact.link}</span>` : ''}</div><div class="wa">${waIcon}</div></div>`;

const page = (w, h, body, extra = '') =>
  `<!doctype html><html><head><meta charset="utf-8"><style>${base}${extra}</style></head><body><div class="frame" style="width:${w}px;height:${h}px">${body}</div></body></html>`;

/* ---------- Layouts ---------- */

// Story: WhatsApp Status, Instagram Story, TikTok still. 1080x1920.
const industryStory = (b) => {
  const o = offer(b.offer);
  return page(
    1080,
    1920,
    `<div class="art" style="background-image:${art(b.art)}"></div>
     <div class="scrim" style="background:linear-gradient(180deg,rgba(6,35,25,.55) 0%,rgba(6,35,25,.15) 22%,rgba(6,35,25,.35) 42%,rgba(6,35,25,.96) 70%,#062319 100%)"></div>
     <div style="position:absolute;inset:88px 72px 80px;display:flex;flex-direction:column">
       <div style="display:flex;justify-content:space-between;align-items:center"><div class="brand"><i></i>Aksen Labs</div><div class="label">WHAT WE CAN BUILD</div></div>
       <div class="kicker" style="margin-top:70px">${b.sector} · ${b.place}</div>
       <h1 style="font-size:112px;margin-top:22px;text-shadow:0 6px 40px rgba(0,0,0,.35)">${b.hook.replace(/\?$/, '<em>?</em>')}</h1>
       <div style="flex:1"></div>
       <div style="transform:rotate(-2deg);align-self:center;margin-bottom:34px">${screens[b.ui](b)}</div>
       <p class="lede" style="font-size:40px;margin-bottom:26px">${b.line}</p>
       <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:26px">
         <div class="price"><span>${o.name}</span><b>${o.price}</b></div>
       </div>
       ${cta()}
       <div class="label" style="margin-top:22px;text-align:center">Illustration. ${b.business} is a fictional example.</div>
     </div>`,
  );
};

// Feed: Instagram 4:5. 1080x1350.
const industryFeed = (b) => {
  const o = offer(b.offer);
  return page(
    1080,
    1350,
    `<div class="art" style="background-image:${art(b.art)};background-position:center 30%"></div>
     <div class="scrim" style="background:linear-gradient(90deg,rgba(6,35,25,.97) 0%,rgba(6,35,25,.88) 46%,rgba(6,35,25,.25) 100%)"></div>
     <div style="position:absolute;left:64px;top:64px;right:64px;display:flex;justify-content:space-between"><div class="brand"><i></i>Aksen Labs</div><div class="label">WHAT WE CAN BUILD</div></div>
     <div style="position:absolute;left:64px;top:190px;width:500px">
       <div class="kicker">${b.sector}</div>
       <h1 style="font-size:88px;margin-top:20px">${b.hook.replace(/\?$/, '<em>?</em>')}</h1>
       <p class="lede" style="font-size:36px;margin-top:30px">${b.line}</p>
       <div class="price" style="margin-top:40px"><span>${o.name}</span><b>${o.price}</b></div>
     </div>
     <div style="position:absolute;right:-330px;top:190px;transform:scale(.92) rotate(3deg);transform-origin:top right">${screens[b.ui](b)}</div>
     <div style="position:absolute;left:64px;right:64px;bottom:64px">${cta()}<div class="label" style="margin-top:16px">Illustration. ${b.business} is a fictional example.</div></div>`,
  );
};

const menuRows = (list, size = 34) =>
  list
    .map(
      (o, i) => `<div style="display:flex;align-items:center;gap:26px;padding:24px 0;border-bottom:1px solid rgba(194,245,118,.18)">
        <div style="font-family:'Geist Mono',monospace;font-size:24px;color:#7cff62;width:44px">0${i + 1}</div>
        <div style="flex:1"><b style="font-size:${size}px;display:block">${o.name}</b><span style="font-size:${size * 0.66}px;color:#a9bcb2">${o.note}</span></div>
        <div style="font-size:${size * 1.08}px;font-weight:700;color:${o.price === 'Free' ? '#062319' : '#c2f576'};${o.price === 'Free' ? 'background:#c2f576;padding:6px 18px;border-radius:14px' : ''};white-space:nowrap">${o.price}</div>
      </div>`,
    )
    .join('');

const glow = `<div class="art" style="background-image:${art('ng-backdrop-lime')};opacity:.9"></div><div class="scrim" style="background:linear-gradient(180deg,rgba(6,35,25,.3),rgba(6,35,25,.92) 55%)"></div>`;

const offersStory = () =>
  page(
    1080,
    1920,
    `${glow}<div style="position:absolute;inset:88px 72px 80px;display:flex;flex-direction:column">
      <div class="brand"><i></i>Aksen Labs</div>
      <div class="kicker" style="margin-top:80px">Simple prices · Naira</div>
      <h1 style="font-size:104px;margin-top:20px">Start small.<br/><em>Grow</em> from there.</h1>
      <div style="margin-top:50px">${menuRows(offers, 34)}</div>
      <div style="flex:1"></div>
      <p class="lede" style="font-size:30px;margin-bottom:24px">Pay 50% to start, 50% at handover. Transfer or card. Third-party fees shown on your quote.</p>
      ${cta()}
    </div>`,
  );

const offersFeed = () =>
  page(
    1080,
    1350,
    `${glow}<div style="position:absolute;inset:64px;display:flex;flex-direction:column">
      <div style="display:flex;justify-content:space-between"><div class="brand"><i></i>Aksen Labs</div><div class="label">PRICES IN NAIRA</div></div>
      <h1 style="font-size:78px;margin-top:40px">Start small. <em>Grow</em> from there.</h1>
      <div style="margin-top:18px">${menuRows(offers.slice(0, 6), 28)}</div>
      <div style="flex:1"></div>${cta()}
    </div>`,
  );

const steps = [
  ['Free call', 'Tell us how the business runs today. 20 minutes on WhatsApp.'],
  ['Best first step', 'More customers, smoother operations, or clearer numbers. We pick one.'],
  ['Fixed price build', 'You see the price before we start. Pay half to begin.'],
  ['We keep it running', 'Small edits, checks and support as you grow.'],
];

const howStory = () =>
  page(
    1080,
    1920,
    `${glow}<div style="position:absolute;inset:88px 72px 80px;display:flex;flex-direction:column">
      <div class="brand"><i></i>Aksen Labs</div>
      <div class="kicker" style="margin-top:80px">How we work</div>
      <h1 style="font-size:100px;margin-top:20px">Not just a website.<br/>A <em>digital partner.</em></h1>
      <div style="margin-top:60px;display:flex;flex-direction:column;gap:26px">
        ${steps
          .map(
            ([t, d], i) => `<div style="display:flex;gap:28px;align-items:flex-start;background:rgba(6,35,25,.7);border:1px solid rgba(194,245,118,.22);border-radius:28px;padding:30px">
            <div style="width:78px;height:78px;border-radius:22px;background:${i === 0 ? '#c2f576' : 'rgba(194,245,118,.12)'};color:${i === 0 ? '#062319' : '#c2f576'};display:grid;place-items:center;font-size:38px;font-weight:700;flex:none">${i + 1}</div>
            <div><b style="font-size:42px;display:block">${t}</b><span style="font-size:30px;color:#a9bcb2;line-height:1.3">${d}</span></div></div>`,
          )
          .join('')}
      </div>
      <div style="flex:1"></div>${cta()}
    </div>`,
  );

const pillars = [
  ['Get more customers', 'Pages, WhatsApp ordering, lead lists, follow-ups.'],
  ['Run smoother inside', 'Bookings, stock, approvals, staff dashboards.'],
  ['Know your numbers', 'Sales, orders and payments in one clear view.'],
];

const notJustStory = () =>
  page(
    1080,
    1920,
    `${glow}<div style="position:absolute;inset:88px 72px 80px;display:flex;flex-direction:column">
      <div class="brand"><i></i>Aksen Labs</div>
      <div class="kicker" style="margin-top:80px">For Nigerian businesses</div>
      <h1 style="font-size:108px;margin-top:20px">We build what your business <em>actually</em> needs.</h1>
      <div style="margin-top:56px;display:flex;flex-direction:column;gap:22px">
        ${pillars
          .map(
            ([t, d]) => `<div style="padding:34px;border-radius:30px;background:linear-gradient(120deg,rgba(23,91,59,.85),rgba(6,35,25,.85));border:1px solid rgba(194,245,118,.25)">
            <b style="font-size:48px;display:block;color:#c2f576">${t}</b><span style="font-size:32px;color:#e7efe3">${d}</span></div>`,
          )
          .join('')}
      </div>
      <p class="lede" style="font-size:34px;margin-top:40px">AI does the busy work. <b style="color:#c2f576">You make the decisions.</b></p>
      <div style="flex:1"></div>${cta()}
    </div>`,
  );

const leadPackStory = () =>
  page(
    1080,
    1920,
    `${glow}<div style="position:absolute;inset:88px 72px 80px;display:flex;flex-direction:column">
      <div class="brand"><i></i>Aksen Labs</div>
      <div class="kicker" style="margin-top:80px">Lead Pack · ₦29,900</div>
      <h1 style="font-size:104px;margin-top:20px">30 businesses you could <em>sell to</em>.</h1>
      <p class="lede" style="font-size:38px;margin-top:30px">Tell us who you sell to and where. Our research tool finds them, checks every contact against a public source, and drafts messages for you to send. Usually ready in 2 working days.</p>
      <div style="margin-top:50px;background:#fff;color:#10261d;border-radius:36px;padding:34px;display:flex;flex-direction:column;gap:18px;box-shadow:0 40px 80px rgba(0,0,0,.4)">
        ${[
          ['Lekki boutique hotels', '9 found · 6 verified'],
          ['Abuja private clinics', '12 found · 8 verified'],
          ['Ibadan secondary schools', '15 found · 11 verified'],
        ]
          .map(
            ([t, s]) =>
              `<div style="display:flex;justify-content:space-between;align-items:center;padding:18px 6px;border-bottom:1px solid #eef2eb"><b style="font-size:32px">${t}</b><span class="chip chip-ok" style="font-size:24px">${s}</span></div>`,
          )
          .join('')}
        <div style="font-size:24px;color:#53635a">Example searches. Nothing is sent to anyone until you decide.</div>
      </div>
      <div style="flex:1"></div>${cta('Get your Lead Pack')}
    </div>`,
  );

const friendStatus = () =>
  page(
    1080,
    1920,
    `${glow}<div style="position:absolute;inset:88px 72px 80px;display:flex;flex-direction:column">
      <div class="kicker">Business owners, see this 👀</div>
      <h1 style="font-size:116px;margin-top:30px">My people at <em>Aksen Labs</em> build tech that helps businesses grow.</h1>
      <p class="lede" style="font-size:40px;margin-top:36px">WhatsApp ordering. Bookings. Stock. Lead lists. Dashboards. They start with a free call and tell you the best first step.</p>
      <div style="margin-top:50px;display:flex;flex-wrap:wrap;gap:16px">
        ${['Fashion', 'Food', 'Pharmacy', 'Real estate', 'Schools', 'Salons', 'Logistics', 'Events', 'Retail']
          .map((t) => `<span style="font-size:32px;padding:14px 26px;border-radius:999px;border:1.5px solid rgba(194,245,118,.5);color:#c2f576">${t}</span>`)
          .join('')}
      </div>
      <div style="flex:1"></div>
      <div style="font-size:40px;margin-bottom:24px">Prices from <b style="color:#c2f576">₦29,900</b>. Tell them I sent you.</div>
      ${cta()}
    </div>`,
  );

// Carousel: 1080x1350 slides, swipe order matters.
const carousel = () => {
  const slides = [];
  slides.push(
    page(
      1080,
      1350,
      `${glow}<div style="position:absolute;inset:64px;display:flex;flex-direction:column">
        <div class="brand"><i></i>Aksen Labs</div>
        <div style="flex:1"></div>
        <div class="kicker">Swipe →</div>
        <h1 style="font-size:112px;margin-top:20px">9 things we can build for <em>Nigerian</em> businesses.</h1>
        <p class="lede" style="font-size:34px;margin-top:26px">Examples below are fictional. The tools are real.</p>
      </div>`,
    ),
  );
  for (const [i, b] of industries.entries()) {
    slides.push(
      page(
        1080,
        1350,
        `<div class="art" style="background-image:${art(b.art)}"></div>
         <div class="scrim" style="background:linear-gradient(180deg,rgba(6,35,25,.85) 0%,rgba(6,35,25,.55) 30%,rgba(6,35,25,.95) 62%)"></div>
         <div style="position:absolute;left:64px;top:60px;right:64px;display:flex;justify-content:space-between;align-items:center"><div class="kicker">${String(i + 1).padStart(2, '0')} · ${b.sector}</div><div class="label">${i + 2}/11</div></div>
         <h1 style="position:absolute;left:64px;right:64px;top:130px;font-size:74px">${b.hook.replace(/\?$/, '<em>?</em>')}</h1>
         <div style="position:absolute;left:50%;top:290px;transform:translateX(-50%) scale(1);transform-origin:top center">${screens[b.ui](b)}</div>
         <p class="lede" style="position:absolute;left:64px;right:64px;bottom:96px;font-size:34px">${b.line}</p>
         <div class="label" style="position:absolute;left:64px;bottom:50px">Illustration. ${b.business} is fictional.</div>`,
      ),
    );
  }
  slides.push(
    page(
      1080,
      1350,
      `${glow}<div style="position:absolute;inset:64px;display:flex;flex-direction:column">
        <div class="brand"><i></i>Aksen Labs</div>
        <h1 style="font-size:88px;margin-top:60px">Not sure where to <em>start?</em></h1>
        <p class="lede" style="font-size:36px;margin-top:24px">That is what the free call is for. We look at how you work and suggest one first step. Prices from ₦29,900.</p>
        <div style="flex:1"></div>${cta()}
      </div>`,
    ),
  );
  return slides;
};

/* ---------- Build ---------- */

const jobs = [];
for (const b of industries) {
  jobs.push([`story/industry-${b.id}.png`, industryStory(b), 1080, 1920]);
  jobs.push([`feed/industry-${b.id}.png`, industryFeed(b), 1080, 1350]);
  // Transparent screen on its own, for the videos.
  jobs.push([
    `ui/${b.id}.png`,
    `<!doctype html><html><head><meta charset="utf-8"><style>${base}body{padding:60px}</style></head><body><div id="ui" style="display:inline-block">${screens[b.ui](b)}</div></body></html>`,
    980,
    1400,
    true,
  ]);
}
jobs.push(['story/offers.png', offersStory(), 1080, 1920]);
jobs.push(['feed/offers.png', offersFeed(), 1080, 1350]);
jobs.push(['story/how-we-work.png', howStory(), 1080, 1920]);
jobs.push(['story/not-just-websites.png', notJustStory(), 1080, 1920]);
jobs.push(['story/lead-pack.png', leadPackStory(), 1080, 1920]);
jobs.push(['story/friend-status.png', friendStatus(), 1080, 1920]);
carousel().forEach((html, i) => jobs.push([`carousel/slide-${String(i + 1).padStart(2, '0')}.png`, html, 1080, 1350]));

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || undefined,
});
const pageCtx = await browser.newPage({ deviceScaleFactor: 1 });
let count = 0;
for (const [name, html, w, h, transparent] of jobs) {
  if (filter && !name.includes(filter)) continue;
  const file = join(OUT, name);
  mkdirSync(dirname(file), { recursive: true });
  await pageCtx.setViewportSize({ width: w, height: h });
  await pageCtx.setContent(html, { waitUntil: 'load' });
  await pageCtx.evaluate(() => document.fonts.ready);
  if (transparent) {
    await pageCtx.locator('#ui').screenshot({ path: file, omitBackground: true });
  } else {
    await pageCtx.screenshot({ path: file, clip: { x: 0, y: 0, width: w, height: h } });
  }
  count += 1;
  process.stdout.write(`  ${name}\n`);
}
await browser.close();
writeFileSync(join(OUT, '.built'), new Date().toISOString());
console.log(`\n${count} images in ${OUT}`);

