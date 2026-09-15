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

## The launch film

`launch-film-vertical`, and the same film at 1:1 and 16:9. Fifty seconds, eight
shots, problem to proof:

| | | |
|---|---|---|
| 01 | the evening | generated clip |
| 02 | the problem, named | generated still |
| 03 | **a person** | **you, recorded in OBS** |
| 04 | what happens instead | real product screen |
| 05 | one place, not forty threads | real product screen |
| 06 | where the line is | type only |
| 07 | free on the site today | real product screen |
| 08 | the morning after, and where to go | generated still |

Shot 03 is empty until you record it, and that is the point. A launch film for a
company with no customers yet could open on a generated shop owner saying the
product changed their business. It would be the easiest frame in advertising and
the only outright lie in the edit. The rest of the film is careful about this:
the demos say "fictional business", the illustrations carry a label. So the film
leaves a hole a real person fills.

Until you record it, that shot renders a slate saying what is missing and how
long it needs to be. You can send the slate to whoever is recording.

### Recording shot 03

```
node scripts/make-obs-scenes.mjs
```

Then in OBS: **Scene Collection > Import**, choose `obs/Aksen-Labs.json`, and
pick your camera on the Camera source. Device ids are specific to a machine, so
that one field is deliberately left blank rather than guessed.

Four scenes, canvas 1080x1920:

- **01 To camera** — the shot the film needs. Head and shoulders, camera cropped
  to 9:16 rather than letterboxed.
- **02 Screen and camera** — talking over the product, camera low left.
- **03 Screen only** — no face, just the product being used.
- **04 Phone in hand** — point a phone at a phone. The WhatsApp side of the
  story, which the headless capture cannot produce.

Say who it is for and what you built. Fifteen seconds. Then:

```
# save the recording as public/footage/founder.mp4
npm run render -- launch-film-vertical out/launch.mp4
```

The scan runs automatically before `studio` and `render:all`, so the film picks
the file up with no other step. Anything else you record goes in the same folder
and is available by filename.

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

## Cost, measured on this account

Rendering costs nothing and runs offline. The only spend is generation, and only
the first time, because the results are cached and committed.

| | |
|---|---|
| Image, `google/gemini-2.5-flash-image` | **0.039 USD** |
| Image, `openai/gpt-image-1` | 0.25 USD, and it has no 9:16 |
| Clip, 4s, `bytedance/seedance-2.0-mini` | **0.31 USD** |

Gemini is the default for both reasons: six times cheaper, and it takes 9:16
natively instead of making a 2:3 and cropping the sides off. Clips are excluded
unless you pass `--clips`, because one clip costs what eight images cost.

The whole asset set in this repo came to about 1.20 USD, once.

## Three things about these models, learned the hard way

**Video models do not appear in `/models`.** Ask OpenRouter for its model list,
filter for video output, and you get nothing, which reads as "video generation is
not available". Submit to `/videos` and it works fine. The list is not the truth.

**Seedance scores your clip unless you stop it.** The first clip this workspace
ever submitted came back `failed` after 52 seconds with "the output audio may be
related to copyright restrictions". The picture was never the problem.
`generate_audio` is hard-off here.

**`unsigned_urls` needs the key.** The finished-clip payload hands back a URL
that points at OpenRouter's own API, not a pre-signed object store link. Fetching
it bare returns 401 after the clip has been generated and billed, which is the
worst possible place to find out.

And one about the pictures: gemini paints a black letterbox inside the frame,
about a sixth of the height, whatever the prompt says. `scripts/trim-borders.mjs`
measures and cuts it at generation time, so everything downstream can assume a
clean edge. `scripts/retrim.mjs` does the same to images generated before that
step existed, which beats paying to make them again.
