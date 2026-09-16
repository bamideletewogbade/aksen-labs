import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, extname } from 'node:path';

/**
 * What has been generated, what it produced, and what it cost.
 *
 * The manifest has carried `costUsd` per asset since the pipeline was built and
 * nothing has ever read it back, so the one number that decides whether this is
 * a business has been sitting in a JSON file nobody opens. Two commands from
 * now it is a page.
 *
 * It is a static page rather than a screen in the admin on purpose. An asset
 * browser in the product would be a new module, and the operating brief says
 * not before Phase 4.
 *
 *   node scripts/assets.mjs          write out/assets.html
 *   node scripts/assets.mjs --open   and open it
 */

/**
 * For reading the numbers in the currency the business quotes in. An assumption,
 * not a rate anyone is held to: change it here when it drifts.
 * Set 15 September 2026.
 */
const GHS_PER_USD = 12.5;

const root = resolve('.');
const manifestPath = join(root, 'src/generated-manifest.json');
const manifest = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, 'utf8'))
  : {};

const VIDEO = new Set(['.mp4', '.webm', '.mov']);
const IMAGE = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);

function listFiles(dir) {
  const full = join(root, dir);
  if (!existsSync(full)) return [];
  return readdirSync(full)
    .filter((name) => {
      const ext = extname(name).toLowerCase();
      return VIDEO.has(ext) || IMAGE.has(ext);
    })
    .map((name) => {
      const stat = statSync(join(full, name));
      return {
        name,
        href: `../${dir}/${name}`.replace('../out/', './'),
        bytes: stat.size,
        at: stat.mtime,
        video: VIDEO.has(extname(name).toLowerCase()),
      };
    })
    .sort((a, b) => b.at - a.at);
}

const generated = Object.entries(manifest).map(([key, value]) => ({
  key,
  ...value,
  href: `../public/${value.file}`,
  video: value.kind === 'video',
}));

const renders = listFiles('out').filter((f) => f.name !== 'assets.html');
const captures = listFiles('public/captures');

const spent = generated.reduce((total, a) => total + (a.costUsd ?? 0), 0);
const films = renders.filter((r) => r.video).length;

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;
const usd = (value) => `$${value.toFixed(4)}`;
const ghs = (value) => `GHS ${(value * GHS_PER_USD).toFixed(2)}`;
const when = (value) =>
  new Date(value).toISOString().slice(0, 16).replace('T', ' ');

const escape = (value) =>
  String(value ?? '').replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c],
  );

const preview = (item) =>
  item.video
    ? `<video src="${escape(item.href)}" controls preload="metadata" muted playsinline></video>`
    : `<img src="${escape(item.href)}" alt="${escape(item.key ?? item.name)}" loading="lazy">`;

const generatedCards = generated
  .map(
    (a) => `
  <figure class="card">
    ${preview(a)}
    <figcaption>
      <div class="row"><strong>${escape(a.key)}</strong><span class="cost">${usd(a.costUsd ?? 0)}</span></div>
      <div class="meta">${escape(a.kind)} · ${escape(a.aspectRatio ?? '')} · ${escape(a.model ?? '')}</div>
      <div class="meta">${escape(when(a.generatedAt))}${a.label ? ` · labelled ${escape(a.label)}` : ''}</div>
      <details><summary>Prompt</summary><p>${escape(a.prompt)}</p></details>
    </figcaption>
  </figure>`,
  )
  .join('');

const fileCards = (items) =>
  items
    .map(
      (f) => `
  <figure class="card">
    ${preview(f)}
    <figcaption>
      <div class="row"><strong>${escape(f.name)}</strong><span class="free">free</span></div>
      <div class="meta">${mb(f.bytes)} · ${escape(when(f.at))}</div>
    </figcaption>
  </figure>`,
    )
    .join('');

const page = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Aksen assets and what they cost</title>
<style>
  :root { --ink:#10261d; --green:#175b3b; --lime:#c2f576; --paper:#f9faf7; --muted:#53635a; --line:#d6e0ce; }
  * { box-sizing:border-box }
  body { margin:0; background:var(--paper); color:var(--ink); font:15px/1.6 Inter,system-ui,sans-serif; }
  .shell { width:min(1180px, calc(100% - 40px)); margin:0 auto; padding:40px 0 70px }
  h1 { font-size:clamp(2rem,4vw,3rem); letter-spacing:-.04em; margin:0 0 6px }
  h2 { font-size:1.3rem; letter-spacing:-.02em; margin:44px 0 4px }
  .sub { color:var(--muted); margin:0 0 30px }
  .headline { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin:26px 0 8px }
  .stat { padding:18px; border:1px solid var(--line); border-radius:12px; background:#fff }
  .stat b { display:block; font-size:1.7rem; letter-spacing:-.03em }
  .stat span { color:var(--muted); font-size:.8rem }
  .argument { margin:18px 0 0; padding:20px; border-radius:12px; background:var(--ink); color:#eef5e4 }
  .argument b { color:var(--lime) }
  .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:16px; margin-top:18px }
  .card { margin:0; border:1px solid var(--line); border-radius:12px; background:#fff; overflow:hidden }
  .card img, .card video { display:block; width:100%; aspect-ratio:9/16; object-fit:cover; background:#e8ece3 }
  .card figcaption { padding:12px 13px 14px }
  .row { display:flex; justify-content:space-between; align-items:baseline; gap:8px }
  .row strong { font-size:.9rem; overflow-wrap:anywhere }
  .cost { font-family:ui-monospace,monospace; font-size:.76rem; color:var(--green); font-weight:700 }
  .free { font-family:ui-monospace,monospace; font-size:.7rem; color:var(--muted); text-transform:uppercase; letter-spacing:.08em }
  .meta { color:var(--muted); font-size:.76rem; margin-top:3px; overflow-wrap:anywhere }
  details { margin-top:8px } summary { cursor:pointer; font-size:.76rem; color:var(--green) }
  details p { font-size:.76rem; color:var(--muted); margin:6px 0 0 }
  .note { margin-top:40px; padding-top:18px; border-top:1px solid var(--line); color:var(--muted); font-size:.82rem }
  @media (max-width:760px){ .headline{grid-template-columns:repeat(2,1fr)} .shell{width:calc(100% - 24px)} }
</style></head><body><div class="shell">

<h1>Assets, and what they cost</h1>
<p class="sub">Generated ${generated.length} paid assets. Produced ${films} rendered videos from them. Read back from the pipeline's own manifest, not typed in.</p>

<div class="headline">
  <div class="stat"><b>${usd(spent)}</b><span>spent on generation, all time</span></div>
  <div class="stat"><b>${ghs(spent)}</b><span>at GHS ${GHS_PER_USD}/USD</span></div>
  <div class="stat"><b>${films}</b><span>rendered cuts produced</span></div>
  <div class="stat"><b>${usd(0)}</b><span>cost of the next cut</span></div>
</div>

<div class="argument">
  Every asset behind the launch film cost <b>${usd(spent)}</b>, about <b>${ghs(spent)}</b>, once.
  A new format, a new hook, a different language or a seasonal recut reuses all of it and costs
  <b>one command</b>. An editor's second cut costs them another day, so they have to charge for it.
  Ours does not, which is the whole of the margin and the reason a small shop can afford this.
</div>

<h2>Generated · paid</h2>
<p class="sub">Images and clips bought from a model. These are committed to the repo because they cost money and the cache only works if they travel with it.</p>
<div class="grid">${generatedCards || '<p class="sub">Nothing generated yet.</p>'}</div>

<h2>Rendered · free</h2>
<p class="sub">Output of <code>npm run render</code>. Re-running costs compute and nothing else.</p>
<div class="grid">${fileCards(renders) || '<p class="sub">Nothing rendered yet.</p>'}</div>

<h2>Captured · free</h2>
<p class="sub">Real product screens from <code>scripts/capture-site.mjs</code>.</p>
<div class="grid">${fileCards(captures) || '<p class="sub">Nothing captured yet.</p>'}</div>

<p class="note">
  Written ${when(Date.now())} by <code>scripts/assets.mjs</code>. Costs come from
  <code>src/generated-manifest.json</code>, which the generator writes per asset.
  The cedi figure uses an assumed GHS ${GHS_PER_USD}/USD set 15 September 2026; change it at the top of the script.
  Compute and the founder's time are not in these numbers, and the founder's time is the expensive part.
</p>
</div></body></html>`;

const outPath = join(root, 'out/assets.html');
writeFileSync(outPath, page, 'utf8');

console.log(`\n${generated.length} generated assets, ${films} rendered cuts.`);
console.log(`Spent on generation: ${usd(spent)}  (about ${ghs(spent)})`);
console.log(`Cost of the next cut: ${usd(0)} plus compute.\n`);
console.log(`Written to ${outPath}`);

if (process.argv.includes('--open')) {
  const { spawn } = await import('node:child_process');
  const opener =
    process.platform === 'win32'
      ? ['cmd', ['/c', 'start', '', outPath]]
      : process.platform === 'darwin'
        ? ['open', [outPath]]
        : ['xdg-open', [outPath]];
  spawn(opener[0], opener[1], { detached: true, stdio: 'ignore' }).unref();
}
