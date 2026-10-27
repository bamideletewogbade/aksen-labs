# Vercel AI Gateway verification, 27 October 2026

## Account and credits

Vercel CLI authenticated as `bamideletewogbade`. The listed team is
`olusegun-tewogbades-projects`, on Hobby. The key already configured in
`platform/.env` returned HTTP 200 from the Gateway credit endpoint.
Starting balance: USD 4.95460218, total used USD 0.04539782.
After the conversation, structured-output, decision and search probes:
USD 4.94352060 remaining. A subsequent writer probe reported USD 0.000128.
Balances are snapshots, shared with other uses of the same team.

Current policy: USD 5/month on the free tier, a subset of eligible models,
and lower per-model rate limits. Buying credits transitions the team to paid
and removes the recurring free credit. No purchase or billing change was made.
Source: https://vercel.com/docs/ai-gateway/pricing

## Existing integration and this change

The checkout already routed text, search, decisions and the Front Desk agent
through Vercel first. This work preserves that implementation and unrelated
uncommitted work. It corrects operations demos to use the separate Gateway
writer list instead of forwarding the OpenRouter list (whose first model is
outside the free tier). Admin settings now show the live team credit balance
and expose the existing small AI connection test. Missing, malformed or timed
out balance responses are explicitly unavailable, never reported as zero.

Image and video generation still use OpenRouter. Their availability and billing
are separate; this work does not claim they run on free Gateway credit.
The application remains a Vinext/Cloudflare Sites application. Vercel is the
AI provider gateway, not a migration of the website's hosting.

## Verification

- `pnpm exec tsc --noEmit`: passed.
- Targeted oxlint: passed.
- `pnpm build`: passed all five Vinext build stages.
- Existing routing, Gateway tools and Front Desk unit checks: passed.
- Gateway credit tests: passed, including zero balance, invalid data and failures.
- Operations tests: 3/3 passed (integration uses transaction-local temp tables).
- `node tests/openrouter-routing.mjs --live`: three synthetic calls passed,
  actual model `google/gemini-2.5-flash`, including parsed JSON output.
- `node scripts/check-ai-gateway.mjs --live`: decision model `liquid/d1-ultra`
  passed; search returned five citations with source text via Gemini 2.5 Flash.
  This probe disables fallback keys so success proves the Gateway path.
- Synthetic writer call: `openai/gpt-4.1` answered correctly through Gateway.
- `node tests/e2e/gateway-settings.mjs`: authenticated settings passed at 1440,
  375 and 320 pixels, including balance rendering and no overflow/page errors.
  Its temporary auth session was removed. No business records were edited.

## Publication boundary

Hosted Site identity was checked: `appgprj_6a98b5c11bd88191bf6d0b575e82e52d`,
owner-private, existing live version 5. No audience change was made.
The Sites source helper's remote fetch stalled; no new version was published
in this verification. Local checks and provider success do not establish that
the hosted environment has the same source or Gateway secret.

Read credits without spending tokens:
`node scripts/check-ai-gateway.mjs`

The `--live` option spends a small amount on synthetic provider checks and web
search; it does not run Lead Scout, create prospects or send outreach.
