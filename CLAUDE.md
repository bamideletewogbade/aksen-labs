# Aksen Labs

**Read `Docs/Aksen-Operating-Brief.md` before writing public copy, quoting a price, describing what Aksen has done, or planning work.** It is the source of truth for the business: what exists, what is true, where things stand, and the roadmap. This file is the index; that file is the substance.

## Repository map

| Path | What it is |
| --- | --- |
| `platform/` | The site and the admin workspace. Next-on-Workers via vinext, React 19, Drizzle, Neon. pnpm. |
| `Docs/` | Business record. Start with the operating brief. |
| `Docs/Operating-Templates/` | Discovery, qualification, proposal, scope, kickoff, UAT, handover, care, billing, change. |
| `clients/` | Per-client briefs and discovery notes. Real people. Treat accordingly. |
| `video/` | Remotion marketing video, plus the Playwright script that captures real product screens. |
| `marketing/nigeria-kit/` | Shareable images, reels config and captions for the Nigeria friends referral test. Prices live in its `config.mjs`. |
| `research/` | Positioning and market research inputs. |

## Rules that are not negotiable

Full detail in section 2 of the operating brief. The short version:

1. **No customer claims.** Aksen has no paying customers and no delivered results. Not "trusted by", not a testimonial, not a percentage, not a logo.
2. **The Frame Shop is not public proof.** No signed scope, price, payment or acceptance. It is a proposal.
3. **Client records never reach public assets.** If a screen with real records is wanted publicly, seed fictional data and capture that.
4. **AI prepares; a person decides.** It does not set a price, take a payment, promise a date, publish, sign, or contact anyone. This is enforced by the system, not by instructions. A feature that lets an agent cross one of those lines is a bug.
5. **No absolutes.** "Never misses an order", "replaces your staff", "guaranteed growth" are banned. "Helps organise" beats "sorts every".
6. **Voice:** no em dashes, no AI-stock phrasing. Plain words a shop owner uses. "Digital transformation" is the category we sell into, not how we open.

## Working in `platform/`

```bash
cd platform && pnpm dev
```

- Format `npx oxfmt <files>`, lint `npx oxlint <files>`, typecheck `npx tsc --noEmit`. The repo has pre-existing lint errors in admin components; do not treat them as yours, and do not add more.
- Test `pnpm test`, or `pnpm test <word>` for the files whose name contains it. Each file in `tests/` is also a plain `node tests/<name>.mjs`. The `*.integration.mjs` ones need `DATABASE_URL` and only ever touch transaction-local temp tables.
- Public pages live in `app/`, styled by the per-surface CSS files in `app/*.css`. `refresh.css` carries the public site.
- Comments explain *why*, in the voice of the surrounding code. Match it.

## Regenerating product screenshots

```bash
cd video && node scripts/capture-site.mjs
```

Add `--admin` for the workspace screens; it opens a browser window for you to sign in yourself and keeps the profile under `video/.auth/`. Public captures need the dev server running. Output lands in `platform/public/captures/`.

## How the business is run day to day

`Docs/Business-OS.md` is the operating system: three things a day, one from each of SELL, BUILD and COMPOUND, drawn from a pre-decided queue so no willpower is spent choosing. SELL is first and never optional.

| Command | Does |
| --- | --- |
| `/today` | Draws the three, SELL first, logs them |
| `/done` | Records what actually happened |
| `/weekly` | Refills the queue, updates the scoreboard, moves the money |
| `/money` | Adds or reviews a revenue mechanism |

| File | Holds |
| --- | --- |
| `Docs/Business-OS.md` | The rules, the lanes, the scoreboard, the ledger stages |
| `Docs/Queue.md` | Pre-decided work, three lanes, nothing over 25 minutes |
| `Docs/Revenue-Ledger.md` | Every way this could make money, as a pipeline |
| `Docs/Daily-Log.md` | Append-only record, streak, the two numbers |

The scoreboard is two numbers: **conversations with owners this week** and **cedis invoiced this month**. Features shipped, tests passing and pages redesigned are not on it, because all three can be at an all-time high in a company that is dying.

## Current focus

Phase 0 of the roadmap: close the enquiry loop so a stranger can reach the business and get a reply. Everything else waits. See section 6 of the operating brief, and section 7 for why.
