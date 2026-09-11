# Admin readiness and Lead Scout

Reviewed 11 September 2026 against the local Aksen platform and its configured Neon database.

## Operational assessment

The platform supports a supervised agency workflow: capture or research a lead, review fit, prepare discovery and proposal drafts, manage an opportunity, create a project after it is won, maintain client documents and financial records, prepare follow-up and care drafts, and review activity. It is not yet an unattended sales-and-delivery business. Email sending configuration, live client channel integrations and production access configuration remain incomplete.

| Area | Evidence checked | Practical limit |
| --- | --- | --- |
| Admin navigation | All 17 current static admin pages returned HTTP 200 under the supported local admin sign-in | This is render/route validation, not browser interaction or visual QA |
| Admin data | Operations, email, workspaces, readiness and prospects GET APIs returned 200 | Projects API is write-only; its GET correctly returned 405, while the Projects page loaded |
| Access | All admin API source files use the existing admin authorization helpers; new prospect tests reject unauthenticated calls before database access | Production ADMIN_EMAILS is unset, so production admin access is closed; local development uses the Sites local account |
| Request safeguards | Shared wrapper now rejects cross-origin/cross-site admin writes and marks admin responses private, no-store | Origin checks supplement authorization; they do not replace it |
| AI routing | Central auto/default gateway regressions passed; discovery and enrichment ran through OpenRouter | Model choice can change; key presence alone is not a successful provider test |
| Lead conversion | Temporary-table tests exercised shortlist-only promotion, owner isolation, repeat-click safety and atomic audit insertion | Prospects are not buyers; public contact details do not establish consent |
| Projects | Temporary-table tests confirmed won-only project creation, repeat reuse and owner isolation | Implementation and release remain human-managed work |
| Email | Payload, missing configuration, idempotency key, owner isolation, one-time send claim and uncertain-send lock were tested without sending | Resend sender/key are not configured. Bulk marketing, unsubscribe processing and delivery webhooks are not implemented |
| Financial records | Exact-money tests and temporary-table partial/full payment, receipt, overpayment, wrong-business, duplicate-reference and rollback tests passed | Recorded receipts are business records, not a live payment-provider verification integration |
| Publishing approvals | Temporary-table approval, rejection, duplicate decision, missing draft and audit rollback tests passed | No content was published in this review |
| Templates and support | Thirteen operating template masters validated; support knowledge, formatting, handoff and fallback regressions passed | Templates require client-specific facts and agreements |
| Media and client channels | Existing media routes were checked for admin authorization; demo boundaries reviewed | No paid image/video generation, live WhatsApp, voice, booking or production fulfilment was tested or enabled |

The general agency enquiry pipeline is shared by authorized agency admins; the new prospecting records and existing client workspaces use owner scoping. This is an agency workspace, not a tenant-isolated customer portal. Establish a separate client-access model before inviting clients into admin areas.

## Lead Scout workflow

Open `/admin/prospects` from the sidebar. Save the target market, then run discovery. Each run asks for at most five businesses. The initial saved target is independent furniture/custom-order businesses in Ghana with official websites; users can change the target before subsequent searches.

The workflow uses OpenRouter's current web-search server tool with Exa, at most two search calls and ten total search results per model request. Search access is included through the existing OpenRouter account and incurs usage charges in addition to model inference. Configuration follows the [official web-search documentation](https://openrouter.ai/docs/guides/features/server-tools/web-search). This is a beta provider capability and may need maintenance as the API evolves.

The gateway returns provider source annotations alongside the answer. The application accepts company records only when the proposed website appears in the annotated source URL or excerpt. It accepts email/phone details only when supported by the returned excerpt, and social links only when supported by an annotated URL or excerpt. LinkedIn links are limited to company pages. Private personal profiles and guessed email patterns are excluded. Lack of an excerpt means contact information remains unknown, even if the model suggests a plausible value.

This evidence matching reduces unsupported data; it does not independently certify the source, association or freshness. Review company identity, geographic fit, phone ownership and contact purpose before outreach. The business description and suggested service fit remain model-generated research, with fit explicitly presented as a hypothesis.

Records retain source URLs, excerpts and check dates. Review states are New, Shortlisted, Dismissed and Promoted. Domain deduplication is enforced per owner in the database. It cannot perfectly merge businesses that use several domains. Dismissed records remain excluded from repeat insertion; searches do not silently reopen or promote them.

Enrichment researches one selected new/shortlisted business and replaces its research only when the returned domain matches. It cannot update another owner's lead. Review status remains intact. Review the new check date and sources after enrichment; currently no historical version archive of replaced research is provided.

Promotion requires a shortlist action. One SQL statement inserts an opportunity, records an audit event and marks the prospect promoted. Repeating the action cannot duplicate the opportunity. The opportunity's contact consent remains `unknown`, and its next action directs the owner to review evidence and the basis for contact. No outreach is drafted or sent by promotion itself.

## First real run

Five source-supported business records were saved to the local workspace review queue:

- Dansah Made It (DMI Limited)
- 44 Wood
- Aducraft Furniture
- Neewoody Custom Woodwork
- Bonobo Concept Store

The initial results included source-supported business email and phone details for two records. Remaining contacts were left unknown. A subsequent authenticated enrichment request updated Aducraft's research successfully. These are prospective businesses for review, not endorsements, verified buying intent or established client relationships. No business was contacted, shortlisted or promoted automatically.

## Daily automation and controls

The Codex automation **Aksen daily Lead Scout** is active for 09:00 Ghana time (UTC). It invokes `scripts/run-prospecting.mjs` for the saved campaign and respects the campaign's pause switch and next eligible run date. It is attached to this task and depends on the local workspace/runtime being available; it is not a deployed cloud cron worker.

The app permits six research runs per owner per UTC day, shared by discovery and enrichment. An atomic campaign lease prevents overlapping runs during normal execution. Interrupted runs are marked failed on a subsequent claimed run after the three-minute lease expires. Unique domains prevent duplicate inserts when a partial run is repeated. This is bounded request processing with saved run status, not a durable job queue with exactly-once execution.

A search that fails or returns insufficient evidence stays visible as a failed/empty run. AI activity records actual model, timing and available provider-reported usage/cost. Search results and contact details live in restricted prospect records; the generic diagnostics do not log them. Cost fields depend on what the provider reports and are not an independent billing reconciliation.

If the owner later changes from local Sites sign-in to a production identity, plan an explicit ownership migration. Do not broaden access or copy contacts into a different account implicitly.

## Setup still required before live agency operations

1. Configure the actual production admin identity in ADMIN_EMAILS and validate access on the deployed host.
2. Configure RESEND_API_KEY and a verified RESEND_FROM_EMAIL. Keep the agreed reply-to address, bishoptewogbade@gmail.com, unless changed by the owner. Validate delivery with an authorized test before client messages.
3. Design marketing separately from service email: contact basis, suppression/unsubscribe storage, campaign limits, delivery/bounce events and approval of outreach content and recipients. Public availability is not automatic marketing consent.
4. Select the first pilot and implement its authoritative catalogue, channel, payment verification and durable order transitions. The connected-order demo is a specification aid, not a live order backend.
5. Before multi-user or larger-scale operation, add retention rules, research version history, global budget controls, production alerting, backups/recovery validation and a hosted scheduler/queue.

## Validation and maintenance

- `node scripts/migrate-prospecting.mjs`: additive prospecting tables and indexes. Applied successfully to the configured database; existing business records preserved.
- `node tests/prospecting.mjs`: citation support, contact rejection, private-profile exclusion, safe URLs, auth, origin and payload limits.
- `node tests/prospecting.integration.mjs`: temporary-table promotion, owner isolation and atomic audit checks.
- `node tests/openrouter-routing.mjs`: routing regression plus search tool budgets and citation extraction.
- `node tests/support-and-tracking.mjs`: support/formatting/tracking plus shared admin write-origin and no-store checks.
- `node tests/lead-project.integration.mjs`, `node tests/operations-outbox.integration.mjs`, `node tests/approval-decision.integration.mjs`, `node tests/workspace-financials.mjs --database`: temporary-table lifecycle checks.
- `node tests/operations.mjs`: admin policy, template catalogue and mocked email transport.
- `node tests/order-demo.mjs`: connected-order regression checks.

TypeScript and the production build passed. Targeted lint and focused tests are run for this change; existing unrelated repository-wide lint issues are not claimed resolved. No production deployment, browser visual review or outbound customer messages were performed.
