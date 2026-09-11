# Connected order operations: first pilot

## What is ready

The `/order-demo` walkthrough demonstrates one fictional Cedar Home shelf order, from enquiry to quote review, simulated acceptance, simulated verified payment, workshop release and collection. It is linked from the admin Service demo lab. It uses no TFS customer records and is not evidence of a delivered TFS project.

The enquiry interpreter and handoff preparer are separate, on-demand OpenRouter roles. A deterministic specification checker sits between them. The same central model-routing configuration applies to both. This is a controlled workflow with specialist drafting, not autonomous agents delegating to one another.

The approved fictional catalogue is deliberately small: 80 × 30 cm shelves, oak or black, GHS 450 each, quantities 1–10, collection only. These are demo assumptions, not Aksen service prices or client commercial terms. Amounts are calculated in integer pesewas. Missing units, bespoke sizes and unavailable dates remain questions. A payment claim cannot advance the workflow.

AI is optional in the walkthrough. If the provider or shared hourly allowance is unavailable, the order controls still work. AI drafts are advisory and cannot mutate specifications, payment status or order stages. Changing a scenario resets progress and drafts. Specifications lock at quote review; restarting invalidates the previous simulated quote.

## Demonstration script

1. Choose **A complete enquiry**. Review two 80 × 30 cm oak shelves. Generate an enquiry draft, check the GHS 900 illustrative total and prepare the quote. Simulate customer acceptance, verified payment and human workshop release. Generate the handoff checklist and simulate collection.
2. Choose **Unclear dimensions**. Explain why “80 by 30” has no confirmed unit. The quote must remain blocked. Enter 80 cm width and 30 cm depth only as a demonstration of receiving clarification. Show that tomorrow's production date remains unconfirmed.
3. Choose **A payment claim**. The quoted total remains unchanged. A customer screenshot does not change the payment state. Explain where the real provider verification or authorised reconciliation would sit.
4. Review the draft for unsupported promises. Use its request reference in the admin Activity log. Demonstrate that drafting does not send a message or create a workshop order.

The order decision trail lives in browser memory and resets on reload. AI requests are tracked by the existing backend logger and agent-run records. The demo is not a durable order database, payment integration, stock system or document-signing service. Do not adapt its public simulation controls directly into live payment endpoints.

## First discovery session

Interview the person who receives enquiries and the person who fulfils orders. Use a recent, authorised example; avoid collecting unrelated customer information.

- Which product family repeats often enough to standardise?
- Which channel generates most suitable enquiries?
- What facts must be present before a quote is safe to issue?
- Who owns the catalogue, discounts, production dates and price revisions?
- What counts as customer acceptance, and where is it recorded?
- Which system verifies payment, including mismatched amounts and reversals?
- What causes rework or repeated data entry today?
- Who will use this daily and approve a paid continuation?

Record three baseline measures before changing the workflow: median staff minutes to a complete quote; corrections required before approval; and fulfilment errors attributable to missing or inconsistent information. Also record time spent reviewing AI drafts and monthly provider costs. Measure actual usage rather than attributing all sales changes to AI.

## Scope template for one paid pilot

Client and accountable owner: to be agreed.

Product family and enquiry channel: one each, to be agreed.

Included: approved catalogue import, requirements capture, missing-information checklist, quote draft, human approval, verified payment event integration, workshop brief, activity records and an agreed follow-up draft.

Excluded until separately scoped: autonomous discounts, unreviewed outreach, a full ERP replacement, inferred payment verification, unapproved stock promises, automatic refunds and new channels.

Commercial terms: use Aksen's published pricing as guidance, then issue a client-specific proposal. Do not substitute the fictional shelf prices for agency fees. Document scope, support allowance, payment milestones and delivery starting conditions in the accepted proposal.

Client dependencies: authorised systems access, an approved catalogue, named reviewers, a payment test environment, representative examples and a daily workflow owner. Delivery timing starts only after the proposal's required inputs and conditions are met.

Acceptance evidence: blocked incomplete specifications; correct approved-price calculation; no production release from a payment claim; duplicate provider events cannot create duplicate releases; traceable human approvals; successful recovery from provider outages; and no cross-client access.

Continuation decision: compare baseline and pilot measures with the daily user, identify remaining manual review effort and agree whether paid ongoing use is justified.

## Production implementation sequence

1. Confirm the client, channel and authoritative catalogue. Define tenant access and retention with the client.
2. Introduce durable order, quote-version, approval and payment-event records. Enforce transitions on the server with optimistic concurrency and append-only business events.
3. Integrate the selected payment provider using verified events, amount/currency/order matching, unique provider event IDs and reversal handling. Reconcile ambiguous results before retrying.
4. Add an outbox for authorised external actions, idempotency keys and delivery receipts. Connect email or WhatsApp only after the sender/channel configuration and intended messages are approved.
5. Evaluate representative happy-path and exception cases. Train staff on approval and correction flows. Start with a restricted pilot and review results before expanding.

No interviews, customer contact, payment-provider setup or paid pilot launch has been performed by creating this demo.

## Verification on 11 September 2026

TypeScript, targeted lint, the final production build and `tests/order-demo.mjs` passed. The focused tests cover deterministic amounts, incomplete and unsupported specifications, forbidden and repeated transitions, invalid tasks/scenarios, oversized payloads, cross-origin calls, quota exhaustion and provider failure. The page returned HTTP 200. Live OpenRouter requests for both specialist roles returned HTTP 200 with tracking recorded. Reviewed outputs retained GHS 900 for two demo shelves, unverified payment, unknown capacity and human release approval. An initial enquiry response mixed in workshop content; role instructions were tightened and the live enquiry check repeated successfully. These are representative checks, not a complete model evaluation.

Responsive layout and reduced-motion rules are implemented; browser interaction and visual testing were not performed. No production deployment or customer outreach occurred.
