# Folio deploy runbook

How to build, ship and verify the Aksen platform Worker, and how to get back if a deploy goes wrong.

| | |
|---|---|
| Worker | `sites-project` |
| Cloudflare account | bishoptewogbade@gmail.com, `86fe5ad88f569cb859952f090b459cbf` |
| Live at | https://sites-project.bishoptewogbade.workers.dev |
| Database | Neon, production branch, pooled endpoint |
| Working directory | `C:\Users\HP\Desktop\Side Hustle\Aksen-Labs\platform` |

A formatted version of this runbook is in `Folio-Deploy-Runbook-2026-09-12.html`.

## Status at the time of writing

The UI rebuild is committed but not deployed. Commit `98d9c26` replaced the Folio page with the single console. The live Worker is still serving version `3f28d04d`, which has the previous stacked layout. Run steps 2 and 3 to ship it.

## Before you start

Four things are already true. Check them only if something behaves oddly.

- **Secrets are set and persist across deploys.** `DATABASE_URL`, `OPENROUTER_API_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`. You never re-push these when deploying.
- **The database migration is applied.** `folio_users`, `folio_sessions`, `folio_login_tokens` and `folio_cvs` all exist. Only re-run `scripts/migrate-folio.mjs` if the schema changes.
- **Call binaries through node.** `node_modules/.bin` has no shims in this checkout, so `npx wrangler` and `pnpm run dev` both fail. Every command below calls `node` directly on purpose.
- **The admin area is deliberately locked.** `ADMIN_PASSWORD_HASH`, `ADMIN_EMAILS` and `ADMIN_OWNER_ID` are unset, so `/admin` redirects for everyone. Push them when you want in.

## Deploy

Run these in order. Building after deploying ships the previous bundle against new code.

### 1. Confirm the account

```
node node_modules/wrangler/bin/wrangler.js whoami
```

Expect bishoptewogbade@gmail.com and `workers (write)` in the scope list. If it reports you are logged out, run the same command with `login` instead.

### 2. Build

```
node node_modules/vinext/dist/cli.js build
```

Expect `Build complete` after roughly a minute. The route list it prints should include the seven `/api/folio/*` entries.

Stop here if it errors. Deploying on a failed build serves the last good assets against the new server code, which fails in ways that look unrelated to the real cause.

### 3. Deploy

```
node node_modules/wrangler/bin/wrangler.js deploy --config dist/server/wrangler.json
```

Expect `Deployed sites-project triggers` and a `Current Version ID`. Copy that version ID. It saves a step during a rollback.

### 4. Verify against the live Worker

```
node .tools/folio-e2e.mjs
```

Expect `38 passed, 0 failed`.

The suite covers the free review, all four gated routes returning 401, a real magic link, single-use token enforcement, an interview through to a generated CV, PDF, Word and text downloads, save and reload, and a cross-account check that one signed-in user cannot read another's saved CV. It creates a throwaway account and deletes it afterwards.

### 5. Watch it, if anything looks wrong

```
node node_modules/wrangler/bin/wrangler.js tail --config dist/server/wrangler.json --format pretty
```

Leave it running in one terminal and use the site in a browser. Every request logs live with its error code. Do not pass `--status error`; it filters out the `console.error` lines that carry the actual reason.

## When it breaks

Every entry here happened during the port, described by the symptom you see first.

| Symptom | Cause | Fix |
|---|---|---|
| `provider_http_401` in the tail | The OpenRouter key in the Worker is wrong. A missing key throws a different error, so the key is set but rejected. | Re-push it from `.env` by piping, never by pasting into the masked prompt. That masking is how it went wrong the first time. |
| Every request fails in 0 ms, all database writes log `persistence_failed` | `neon()` threw on construction. The connection string is malformed, usually a stray `DATABASE_URL=` prefix or surrounding quotes. | The value should start `postgresql://`, end `sslmode=require`, contain `-pooler.` and be 147 characters. |
| Sign-in returns 502 but a token row appears in the database | The row is written before the email is sent, so Resend rejected the send. Almost always the `from` address. | HTTP 422 means `RESEND_FROM_EMAIL` is not email-shaped. Set it to `onboarding@resend.dev`. |
| Sign-in reports success but no email arrives | `onboarding@resend.dev` only delivers to the Resend account owner. Everyone else gets a 200 and silence. | Verify a domain in Resend and switch the sender. |
| Sign-in silently stops working for one address | Five magic links per email per hour. Over the limit it reports success and sends nothing, so the limit cannot be used to probe who has an account. | Wait an hour, or clear unused rows with `.tools/folio-cleanup.mjs`. |
| `fatal: Unable to create index.lock` | Two AI tools share this repository. Usually an orphaned lock rather than a live process. | Check `Get-Process git` first. If nothing is running, delete `.git/index.lock`. |
| `Another vinext dev server is already running` | vinext allows one instance per machine and ignores the port you ask for. | Use the server on port 3000, or stop the existing PID. Do not start a second one expecting a different port. |

## Getting back

```
node node_modules/wrangler/bin/wrangler.js rollback --config dist/server/wrangler.json
```

It prompts for which version to return to, which is why step 3 says to keep the ID.

A rollback reverts code only. Secrets and the database are untouched, so anything that changed the schema needs undoing separately. The Folio migration is additive with no drops, so rolling back code over it is safe.

## Known blocker

`onboarding@resend.dev` only delivers to the Resend account owner, so at present only bishoptewogbade@gmail.com can create a Folio account. Everyone else receives a success message and no email. Verifying a sending domain in Resend is the next step before Folio can be shown to anyone.

## Verification record

12 September 2026: 38 of 38 live checks passed against the deployed Worker, including a magic link that was delivered, clicked and redeemed. Telemetry for that run recorded roughly 0.004 USD for a full CV build and 0.0003 USD for a review.
