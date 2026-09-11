# Aksen Labs operations: setup and readiness

Updated 10 September 2026. This file distinguishes implemented behaviour from integrations still awaiting configuration. No outbound messages were sent during setup.

## Working surfaces

- `/admin/operations`: six AI tasks from selected enquiries or owned projects. Drafts persist in AI activity and can be edited, downloaded or saved to owned client workspaces.
- `/admin/templates`: 13 reusable document templates. Markdown masters are in `Docs/Operating-Templates`. Numbered financial documents stay in Clients & billing.
- `/admin/demos`: fictional WhatsApp service, commerce qualification and weekly reporting scenarios using OpenRouter. Each run is saved with model, source label and handoff status. These are demonstrations, not live Meta messaging or payment integrations.
- `/admin/email`: saved individual service/test emails, reviewed before Resend sending. Follow-up AI drafts can be loaded into the composer. An accepted provider response is not proof of inbox delivery.
- `/admin/pipeline`: AI drafting link on every enquiry; a won enquiry can create/open its initial linked project without duplicate creation on repeated clicks.
- `/admin/workspaces`: client-specific source documents, source-grounded AI, proformas, invoices, payment-backed receipts and project links.
- `/admin/approvals`: publishing decisions are atomic with publication and audit writes. Other AI drafts remain for review in their working surface; they are not automatically executed.

## Required environment

Configure these in local `.env` and, separately, the hosted runtime secrets. Never commit real secrets.

| Variable | Purpose | Current check |
| --- | --- | --- |
| DATABASE_URL | Existing Neon database | Configured; additive outbox migration applied |
| OPENROUTER_API_KEY | AI drafts and demos | Configured; fictional live request passed |
| OPENROUTER_MODEL | Optional first model | Existing override respected; at most three fallback models |
| ADMIN_EMAILS | Comma-separated actual sign-in emails | Missing; production admin now denies access until configured |
| RESEND_API_KEY | Server-only sending credential | Missing |
| RESEND_FROM_EMAIL | Sender on a verified domain, e.g. Aksen Labs <hello@your-domain> | Missing; do not use a Gmail address here |
| RESEND_REPLY_TO | Replies | Defaults to bishoptewogbade@gmail.com |

The Gmail reply-to is not an incoming-mail integration. Replies arrive in that Gmail inbox and do not yet automatically update pipeline status. Resend's testing domain is restricted to the email associated with the Resend account. Confirm account ownership before using it for a test.

## Database changes and validation

`node tests/migrate-operations.mjs` applies additive tables/indexes from `db/operations-migration.sql`. It does not alter existing client data. Temporary-table tests cover invoices/receipts, approvals and outbox ownership/one-time claims. Operations drafts use existing `agent_runs`; client document copies use existing `business_documents`.

Outbox states: draft → sending → sent (provider accepted), or uncertain. An uncertain send or a stuck sending state requires reconciliation in Resend; it cannot be retried automatically. Draft contents are immutable once saved; revise in the composer before saving a new draft. Never create a replacement for an uncertain send before checking the provider.

## WhatsApp live connection checklist

1. Choose the agency test number and a client-owned production number when appropriate.
2. Set up the Meta business app and Cloud API test number; configure the account and number identifiers plus server-only credentials.
3. Implement and validate subscription challenge and webhook signature verification against the raw body. Deduplicate message IDs, save events durably and acknowledge before asynchronous processing.
4. Approve the business knowledge and allowed actions. Keep payment verification, refunds, complaints and unsupported requests with staff.
5. Connect real staff handoff and status tracking. Configure current Meta messaging/template requirements for the chosen use case.
6. Test normal replies, missing knowledge, unsupported actions, duplicate events, provider failures, off-hours handoff and opt-out behaviour with consented test recipients.
7. Confirm retention, operational owner, usage limits and alerts before production activation.

No Meta token, WhatsApp number or webhook is configured by this work. The simulation should be presented as a service-behaviour demo, not a working phone integration.

## Existing limitations worth keeping visible

- Authenticated browser flows still require a signed-in admin walkthrough; code and isolated database tests do not replace this.
- Guide conversations store summaries rather than full reply-capable inbox threads.
- Agency enquiry records are shared between allowlisted admins; client workspace documents and operations history are owner-scoped.
- AI outputs can be wrong. Their source record and draft status remain visible; no AI task issues an invoice, confirms payment, signs an agreement or publishes content.
- Media image/video providers have not been exercised in this pass. The new chat demo was exercised against the real configured provider.
- Bulk email, automated prospecting and reply ingestion are designed in the accompanying pipeline blueprint, not enabled by the outbox.

## Provider references checked

- [Meta Cloud API examples](https://github.com/fbsamples/whatsapp-api-examples): webhook and signature-validation examples.
- [Resend sending API](https://resend.com/docs/api-reference/emails/send-email): sender, reply-to and send requests.
- [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys): duplicate-request protection; the local outbox additionally blocks repeated claims.
- [Resend sender setup](https://resend.com/docs/knowledge-base/how-do-i-create-an-email-address-or-sender-in-resend): verified-domain senders.
- [Resend event types](https://resend.com/docs/webhooks/event-types): delivery, bounce and complaint events for the next stage.

## Validation completed in this pass

- Production build, TypeScript and targeted lint for the new operations/email/demo/template surfaces and project conversion passed.
- All 15 admin routes redirected unauthenticated requests; new mutation endpoints rejected unauthenticated calls.
- A real OpenRouter request using fictional sample data passed. All three default model IDs were listed by the provider at validation time.
- Transaction-local database tests passed for invoice payment/receipt integrity, atomic publishing approvals, outbox owner isolation and one-time send claims, and won-only/repeated-click project conversion.
- Unit checks passed for production fail-closed access, demo handoff rules, unsupported task rejection, template masters and Resend request construction. The Resend transport test used a mock; no email was sent.
- The additive outbox table and owner/history indexes were applied to the configured database. No client records were changed by integration tests.
