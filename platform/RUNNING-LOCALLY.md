# Running this locally

Every command below was run on this machine before it was written down.

## The one thing to know first

**`.env` points at the live Neon database.** Running locally does not give you a
sandbox. An enquiry you create, a lead you delete, a project item you tick off
while poking around is doing that to the real data the deployed site is using.

There is no separate development database today. Until there is, treat the
local admin as production with a different address bar.

`pnpm e2e` reads `E2E_DATABASE_URL` if you set one, and falls back to the live
`DATABASE_URL` with a warning. A branch of the live database, made once in the
Neon console and pasted into `.env` as `E2E_DATABASE_URL`, is what turns that
run from looking at real records into being allowed to click things in them.

## Start it

```
cd "C:\Users\HP\Desktop\Side Hustle\Aksen-Labs\platform"
pnpm install
pnpm dev
```

Then open <http://localhost:3000>.

`pnpm install` is only needed the first time, or after pulling changes that
touch `package.json`.

**The first start takes about 30 seconds** and looks stuck while it says
`[optimizer] bundling dependencies`. It is not stuck. Later starts are quick.
The first page you open also compiles on demand, so give it a few seconds.

Stop it with `Ctrl+C` in that terminal.

## Signing in to the admin

<http://localhost:3000/admin> redirects to `/login`, same as production.

Sign in with the admin email and the password set by
`scripts/configure-admin.mjs`. Both come from `.env`, and `.env` is the same
one production uses, so the password is the same in both places.

Records are owned by `local_seedy`, which is `ADMIN_OWNER_ID` in `.env`. The
dev server prints `Sites local sign-in: seedy@sites.test` on startup, which is
where that name comes from.

## Running it the way Cloudflare will

`pnpm dev` runs Vite. It is fast and reloads on save, but it is not the
runtime the site is deployed to. To exercise the actual Worker:

```
pnpm build
pnpm start
```

That serves the built Worker through `wrangler dev`. Use it when the thing you
are checking is runtime behaviour rather than markup: geolocation headers,
cookies, anything touching `crypto.subtle`, or anything that behaved
differently in production than it did in dev.

## Checks before pushing

```
pnpm test
pnpm lint
pnpm build
```

`pnpm test` runs everything in `tests/`. It used to be a list of ten `node
tests/<name>.mjs` lines copied into this file, which meant the twenty-two other
tests were only run by whoever remembered they existed. `pnpm test <word>`
narrows it while you work on one thing.

`pnpm e2e` is the separate one: it starts a dev server, signs itself in and
opens all twenty-two admin screens in a real browser, looking for pages that
render fine when called directly and break in front of a person. Slower, and it
reads the live database, so it is a before-pushing check rather than a
while-editing one.

`pnpm build` succeeding is **not** a typecheck. It has passed with real type
errors in it more than once, including two that would have printed
`[object Object]` where a price belongs. `pnpm lint` is what catches those.

## Deploying

**A deploy is a push to `main`.** OpenAI Sites (`.openai/hosting.json`) builds
from the GitHub repo and publishes the Worker named `aksen-labs`, which is the
one serving <https://aksen-labs.bishoptewogbade.workers.dev>. It lands about a
minute after the push.

```
pnpm test
pnpm build
git push origin main
```

`pnpm build` here is only a check that it builds. The host does its own build,
with pnpm 10.11.1, from what is committed. Anything left uncommitted does not
ship, so run `git status` first.

To confirm it landed, look for a deployment dated after your push:

```
node node_modules/wrangler/bin/wrangler.js deployments list --name aksen-labs
```

**Do not run `wrangler deploy --config dist/server/wrangler.json`.** This file
used to say to. That config is named `sites-project`, a Worker nothing routes
to, so the command succeeds, prints a URL, and changes nothing anyone can see.
`sites-project` was last deployed on 15 September; the live site has moved on
through pushes since.

### Secrets

Worker secrets are separate from `.env` and are not sent by a push. Every
secret command needs `--name aksen-labs`. Without it wrangler reads the name
from the config and writes to `sites-project`, with the same silent success.

To change the admin password in both places:

```
node scripts/configure-admin.mjs
node scripts/push-admin-secrets.mjs
```

In that order. Running `configure-admin` after a push leaves production holding
the previous password. `push-admin-secrets` already targets `aksen-labs`.

Anything else, Paystack for example, is added one at a time. It asks for the
value, so it never lands in your shell history:

```
node node_modules/wrangler/bin/wrangler.js secret put PAYSTACK_SECRET_KEY --name aksen-labs
```

To see what production actually has (names only, never values):

```
node node_modules/wrangler/bin/wrangler.js secret list --name aksen-labs
```

## Things that will waste an hour if nobody told you

**`EPERM ... dist` when building.** A dev server or a stray `workerd` is
holding the folder. Close any `pnpm dev` or `pnpm start` window, and if it
persists:

```
taskkill /F /IM workerd.exe
```

**`pnpm exec <anything>` can trigger a full reinstall**, which fails the same
way if a server is running, and has left `node_modules/.bin` empty. Call the
binary directly instead: `node node_modules/wrangler/bin/wrangler.js ...`.

**Never run `oxfmt` on a directory.** It reformats every file it can reach, and
has twice produced a diff of seventy unrelated files. Name the file:
`pnpm exec oxfmt path/to/one-file.tsx`.

**Port 3000 already in use** usually means a dev server from a previous session
is still alive. `Get-NetTCPConnection -LocalPort 3000 -State Listen` will name
the process.

## What is verified above

Checked on 14 September 2026 with Node v24.15.0 and pnpm 11.11.0:
`pnpm dev` starts and `/`, `/pricing`, `/products`, `/business-agents` and
`/login` all answer 200, with `/admin` redirecting to `/login` as it should.

The deploy section was checked on 28 September 2026: push `94b3e09` at 00:02
UTC appeared as a new `aksen-labs` deployment at 00:03, and the live
`/business-agents` page showed the change.
