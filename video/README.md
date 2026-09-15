# Aksen Labs video

Marketing video rendered from code. One story, three shapes, no editor, no
licence fee, no footage shoot.

Everything here was run on this machine before it was written down.

## Why this and not a video editor

A clip gets posted to WhatsApp Status at 9:16, to the feed at 1:1, and to
LinkedIn at 16:9. Cutting the same story three times by hand is the job nobody
does twice, which is why most small businesses post one 16:9 clip letterboxed
into a phone. Here the story is a component and the three shapes are three
registrations of it, so a wording change is one edit and all three stay in step.

## Get going

```
cd video
npm install
npm run studio
```

That opens the Remotion studio at <http://localhost:3000> where you can scrub
the timeline and edit while it plays.

To render:

```
npm run render order-story-vertical out/vertical.mp4
npm run render:all
```

`render:all` writes every shape of every story into `out/`.

## What is in here

| Path | What it is |
|---|---|
| `src/brand.ts` | Palette, type scales and the three frame sizes |
| `src/Root.tsx` | Which compositions exist |
| `src/compositions/` | The stories |
| `src/components/Frame.tsx` | The shell every scene sits in, plus the safe area |
| `src/components/Generated.tsx` | Renders an AI asset, with provenance and a loud failure |
| `assets.config.mjs` | What should be generated, and why |
| `scripts/generate.mjs` | Generates and caches those assets |
| `scripts/write-script.mjs` | Drafts scene copy in the house voice |
| `scripts/capture.mjs` | Screen footage of the real product |
| `public/generated/` | The cached assets. Committed on purpose |

## The AI layer

### Generation is a build step, never a render step

This is the one thing to understand. A Remotion render calls your component once
per frame. A ten second clip at 30fps is 300 calls. If a frame asked a model for
an image, the render would cost 300 generations, take an hour, and every frame
would be a different picture, because these models are not deterministic.

So generation happens ahead of time and caches to disk:

```
node scripts/generate.mjs --dry     # what it would make, spends nothing
node scripts/generate.mjs           # make what is missing
node scripts/generate.mjs backdrop  # only keys containing "backdrop"
node scripts/generate.mjs --clips   # include video clips, which are slow
```

Assets already on disk with an unchanged prompt are skipped. The render then
reads files: fast, repeatable, free. `src/generated-manifest.json` records the
model, the prompt, the cost and the date for every asset, so six months from now
you can tell what a frame was made from.

Edit a prompt and the generator notices the fingerprint changed and remakes that
one asset. Change the `key` if you want to keep both.

### Writing copy

```
node scripts/write-script.mjs "hospitality, small hotels taking bookings on WhatsApp"
```

Drafts the four scenes in the house voice, writes `scripts/drafts/<slug>.json`,
and checks its own output for the phrasing the house style bans. Nothing renders
from that file. Copy makes a promise to a customer, so a person moves the lines
they keep into a composition. Same rule the feedback board follows.

### Two rules the code enforces

**A missing asset fails loudly.** `<Generated>` renders a visible placeholder
naming the key, not a blank frame. A video that silently ships black because
somebody forgot to run the generator is worse than one that will not render.

**Anything depicting a person or a place carries a label.** Set `label` on an
entry in `assets.config.mjs` and it is stamped onto the frame. The site already
writes "Fictional business example" under its own demonstrations. A generated
shop front in a marketing clip makes the same promise, and it should not depend
on whoever assembles the composition remembering a caption.

The rule in `assets.config.mjs`: generate what cannot be photographed honestly.
Textures, backdrops, abstract fields. Never a picture of "a happy client".

### The key

`scripts/load-env.mjs` looks for `OPENROUTER_API_KEY` in the environment, then
`video/.env`, then `../platform/.env`. Nothing is copied. A secret in two files
is a secret that gets rotated in one of them.

## Screen footage

```
npm install --no-save playwright
npx playwright install chromium
# start the site: cd ../platform && pnpm dev
npm run capture
```

Writes PNGs into `public/captures`.

**Why not OBS for this.** OBS records a person doing something on a screen. It
catches the notification that arrives mid-take, it cannot be repeated
identically, and every interface change means performing the demo again. A
script driving a headless browser gives the same shot every time and re-running
it after a redesign costs one command.

**Where OBS does earn its place**: anything that is not a web page. A phone
screen mirrored to the desktop showing the WhatsApp agent taking a real order is
footage this cannot produce. Capture that in OBS, drop the file in
`public/captures`, and compose around it here.

## Licence, which matters before this gets built on

Remotion is free for individuals and for **companies of up to 3 people**. At 4 or
more it needs a paid company licence. Fine today. Worth knowing before it is
baked into the pipeline.

Everything else in the stack is free: FFmpeg ships inside Remotion, Playwright is
Apache 2.0, and OBS is GPL.

## Cost

Rendering costs nothing and runs offline. The only spend is generation, and only
the first time, because the results are cached and committed. A backdrop image
is a fraction of a cent. Video clips are the expensive part, which is why none
are generated unless you pass `--clips`.
