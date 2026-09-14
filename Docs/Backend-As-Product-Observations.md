# The workspace as a product: running observations

Started 14 September 2026. A log of evidence, not a plan. The idea is that the
Aksen admin backend — pipeline, projects, Lead Scout, agent desk, approvals,
audit — is worth selling to other businesses, either deployed for them or run
as a hosted service from our platform.

Nothing here commits to building it. The point is to notice, while doing other
work, which parts of the system already point that way and which would have to
change, and to write it down at the moment it is observed rather than
reconstructed later from memory.

## Why it is plausible

The pieces a small agency or studio actually needs are already built and in
use: enquiries with a visible pipeline, projects with tasks, deliverables,
decisions and risks, a lead interaction log across WhatsApp, call, email and
meeting, an approvals queue, an audit trail, an outbox, and AI agents that do
research rather than only chat. That combination is not common at the small end
of the market, and it is built around how the work is genuinely done rather
than around a CRM vendor's idea of it.

It is also being used for real work, which is the part most products of this
kind lack at this stage.

## Already tenant-shaped

These are observations from working in the code, each one a thing that would
otherwise have to be retrofitted.

- **Every admin query filters on `owner_id`.** The data model is already scoped
  per workspace. This is the expensive thing to add later and it is present.
- **Rate limits are already keyed per owner.** The Lead Scout allowance uses a
  `scout-<ownerId>-<date>` bucket, so per-tenant metering has a natural home.
- **Usage is already counted in the database** (`workspace_demo_usage`) rather
  than held in memory. That table is the seed of per-tenant billing.
- **The AI layer is gateway-agnostic through OpenRouter**, so a tenant could in
  principle bring a key, and cost per run is already measured and logged.
- **Audit events already record actor, action, entity and request id**, which
  is most of what a business customer asks for in a compliance conversation.

## What blocks it today

- **`ADMIN_OWNER_ID` deliberately collapses everything into one workspace.**
  It exists so that records created through ChatGPT sign-in and through the
  password fallback belong to the same place. It is the single biggest
  assumption to unpick, and it is documented in `app/chatgpt-auth.ts` as a
  choice rather than an accident, which makes it tractable.
- **Authentication is one password hash plus an email allowlist.** There are no
  accounts, roles, invitations or per-user sessions beyond the single admin.
- **Secrets are per Worker.** `DATABASE_URL` and `OPENROUTER_API_KEY` are set
  on the deployment, which is fine for deploying an instance per client and
  wrong for a hosted service where tenants must not share a key or a database
  connection they can exhaust.
- **PBKDF2 is capped at 100,000 iterations by the Workers runtime.** Acceptable
  for one administrator behind a rate limit. It would need revisiting before
  holding other companies' credentials.
- **No billing, plans, or usage limits per tenant** beyond the research cap.

## The two shapes, and which looks nearer

**Deploy an instance per client.** Little has to change: the single-workspace
assumption stops being a problem when each client has their own deployment and
their own database. It suits an agency selling a system alongside the work, and
it can be sold now. It scales through effort rather than through software.

**Hosted, multi-tenant.** Needs accounts, roles, per-tenant secrets and billing,
and a much stronger story about isolation. Larger, and the one worth being
honest about: it is a different business from the agency, with different
obligations.

The first is reachable from where the code already is. The second is a
decision, not a refactor.

## Log

**14 Sep 2026.** Recorded the idea. Noted that the owner-scoped data model,
per-owner rate limiting and database-backed usage counting already exist, which
are the parts that are painful to add after the fact. Noted `ADMIN_OWNER_ID` as
the deliberate single-workspace choice that would have to be unpicked first.
