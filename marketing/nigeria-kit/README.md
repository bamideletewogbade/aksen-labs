# Nigeria friends kit

Images, reels and captions friends can share in Nigeria. One job: show what Aksen can build across industries people recognise, and get people into a free discovery call.

Prices and reasoning: `Docs/Nigeria-Friends-Kit-and-Pricing-2026-09-16.md`.

## What is in it

| Folder | Format | Where it goes |
| --- | --- | --- |
| `out/story/` | 1080×1920 | WhatsApp Status, Instagram Stories, TikTok photo posts |
| `out/feed/` | 1080×1350 | Instagram and Facebook feed |
| `out/carousel/` | 11 slides, 1080×1350 | Instagram carousel, in order |
| `out/ui/` | Transparent PNG | The drawn product screens, used by the videos |
| `../../video/out/nigeria/` | 1080×1920 MP4 | Reels, TikTok, WhatsApp Status |
| `captions.md` | Text | Captions and share messages per platform |

Nine industries, each a fictional business: fashion (Lagos), food (Abuja), pharmacy (Abuja), real estate (Lekki), schools (Ibadan), beauty (Port Harcourt), logistics (Lagos), events (Enugu), retail (Kano). Plus the price menu, how we work, not-just-websites, the Lead Pack and a status friends post as themselves.

## Change something

Everything that goes stale is in `config.mjs`: prices, the WhatsApp number, the Workers link, and the nine businesses. Change it, then rebuild both:

```bash
cd marketing/nigeria-kit
npm install
node render.mjs                 # all stills, a few seconds
node render.mjs salon           # only files with "salon" in the name

cd ../../video
node scripts/render-nigeria.mjs         # all reels, about 20 minutes
node scripts/render-nigeria.mjs salon   # one reel
```

When the domain replaces the Workers address, change `contact.link` in `config.mjs`, rebuild, and update the link lines in `captions.md`.

On a machine without Playwright's Chromium, set `CHROME_PATH` to any Chrome or Edge executable.

## The illustrations

`video/public/generated/ng-*.png`, made with OpenRouter by `video/scripts/generate.mjs ng-`. Prompts live in `video/assets.config.mjs`; model, prompt and cost for each are in `video/src/generated-manifest.json`. The ten images cost about USD 0.39 in total.

They show places with nobody in them, never a person presented as a customer, and every asset that uses one says "Illustration" and names the business as fictional.

## Rules the kit follows

From section 2 of the operating brief:

- Examples are fictional and labelled. No results, clients or testimonials.
- No absolutes: "helps", "less guessing", not "never" or "guaranteed".
- Every screen with an action shows "AI prepared this. You decide." because that is true of what we build.
- No real brand names inside the drawn screens.
