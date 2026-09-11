# Ask Aksen support and backend tracking

Updated 10 September 2026.

## Support knowledge and behaviour

Ask Aksen is grounded through retrieval from a versioned knowledge catalogue, not model fine-tuning. `lib/support-knowledge.ts` builds its entries from the published service, approach, product and pricing modules and adds explicit support and demonstration boundaries. Changing the source catalogue updates those facts on the next build. Increment the knowledge version and run evaluations when changing business facts.

The public assistant covers services, GHS pricing, assessment terms, care, delivery conditions, products, geography, examples and getting started. It reads up to six recent conversation messages for continuity, but these are untrusted input. The application selects reference articles; model-generated URLs are not used as navigation. Reference pages provide further reading, not a guarantee that every sentence has been independently verified.

No private account, payment, order, project, calendar or email action tool is available to this public assistant. Requests for human assistance and sensitive account work receive a controlled handoff. A new server-generated record ID prevents a visitor from choosing an existing conversation ID to overwrite. Each handoff is a separate note, not a full persisted chat transcript. Visitors must use the enquiry form to provide a reply address. The UI distinguishes a successfully saved note from a failed save; neither claims a guaranteed response time.

A shared atomic database allowance permits at most 100 model attempts per UTC hour across public support and support demos. It does not replace per-user abuse controls or provider spending limits. Database or provider failures fall back to approved information. Input is limited to 12 KB actual streamed bytes and a 700-character question. Cross-origin browser calls are rejected. Origin validation is not authentication or bot protection.

## Demonstrations and admin review

- `/support-demo`: custom-order and booking scenarios using fictional Cedar Home / Cedar Studio facts. Switching scenarios clears the conversation. No real messages, reservations, orders or payments are created.
- `/admin/support/knowledge`: authenticated review of the current knowledge catalogue and reference pages.
- `/admin/support`: existing support-note queue receives public handoffs. Fictional demos do not create support notes.
- `/admin/audit`: filter by API requests, AI requests, failures or request reference.

Voice notes, live telephony, image upload and live WhatsApp are future integrations; this assistant currently accepts text only. Its output has been tested on representative questions, but retrieval plus instructions do not eliminate hallucinations. Continue adding observed failure cases to the evaluation set.

## Response presentation

`lib/ai-text.ts` removes common Markdown headings, emphasis and code fences from prose, preserves meaningful references and numbers, and normalises simple lists. The gateway applies it to text and JSON string values. `ResponseText` renders escaped React text as paragraphs and lists. It never injects model-provided HTML. Existing operation/document editors retain editable content, with reading previews where added. This is a prose formatter, not a full Markdown interpreter; complex tables and mathematical notation need specialised presentation.

Do not use formatting cleanup to remove uncertainty, fictional-demo labels, evidence limitations or required human approvals. Internal AI source/trace metadata remains available.

## Tracking coverage

All current API route handlers are wrapped with request lifecycle logging. Each response exposes `X-Request-ID`, connecting request start/completion/failure events with gateway AI activity through asynchronous request context. `X-Log-Status` reports whether the request's start and finish records were persisted; it is not a guarantee that every downstream domain record succeeded.

Text gateway events record an operation ID, actual model, routing mode, profile, provider request ID, duration, token counts and cost when supplied. Known exception categories are recorded without raw exception text. Existing agent runs carry request correlation. Conversation and agent-run persistence failures now emit explicit logging failure events.

Diagnostics use an allowlist of metadata fields; request bodies, prompts, response bodies, email addresses, credentials and headers are not included by the generic logger. Existing business records may retain authorised task/draft content, and support notes retain the visitor's question. These remain behind admin access.

The logger writes structured runtime output and attempts an audit-table insert with a two-second wait bound. Persistence failures are visible in runtime logs. It does not provide immutable audit storage, delivery guarantees, retention automation, background retries, process-crash recovery or a durable multi-agent job queue. The Activity log currently shows the newest 100 matching events. Image/video routes receive API lifecycle tracking and their existing operation logs; the new detailed gateway lifecycle applies to text completions.

## Validation commands

- `node tests/support-and-tracking.mjs`: formatter, metadata allowlist, concurrent correlation, safe exceptions, degraded logging, knowledge selection, payload/origin handling, handoff and demo isolation, invalid model-output fallback.
- `node tests/support-and-tracking.mjs --live`: four synthetic provider checks covering assessment terms, managed operations, TFS/Folio status and a false-payment instruction in the demo. Database and operation persistence are mocked in this evaluation; no customer data is sent.
- `node tests/openrouter-routing.mjs`: existing routing and gateway output regression checks with updated dependency mocks.
- TypeScript, targeted lint and production build must pass before release.

The live support checks passed on 10 September 2026: the model correctly described the separate assessment fee, managed operations at GHS 4,000–18,000 per month with defined support, TFS as illustrative, Folio as in development, and refused to confirm a fictional payment or production order. This is a small behavioural check, not comprehensive certification.

## Final local verification — 11 September 2026

TypeScript and the production build passed after the final support UI changes. The focused support/tracking and routing tests and targeted lint passed. Broader lint still reports pre-existing issues in the business workspace component and admin workspace route; this is not a claim that repository-wide lint is clean.

The local support demo returned HTTP 200. An invalid chat request returned the expected HTTP 400 with a request reference. With database network access enabled, a subsequent request returned `X-Log-Status: recorded`; a direct, narrowly scoped database query verified its `request.started` and `request.failed` audit rows. The initial database connection exceeded the logger's two-second bound and honestly returned `degraded`. Cold-start latency can therefore produce degraded status even when a late insert eventually succeeds; the header describes bounded acknowledgement, not guaranteed absence of a row.

No browser visual review, production deployment, live WhatsApp integration or outbound customer message was performed in this pass.
