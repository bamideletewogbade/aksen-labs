# Aksen Labs workspace: modules and flows

Reviewed 10 October 2026. Aksen Labs is the parent company. This review updates its existing workspace, not a separate CRM or dashboard.

## Company structure

| Branch | Work it owns | Current examples |
| --- | --- | --- |
| Client services | Discovery, websites, commerce, business systems, delivery and care | notjustlines and existing client engagements |
| Education | Practical learning, resources and applied exercises | learnwithbishop, its Library and learning platform |
| Vertical products and AI solutions | Focused software for a specific operating job | Dinero-Yard/Susu and Aksen Careers |
| Shared operations | Sales, money, marketing/media and reusable technology | Aksen workspace and its supporting tools |

These are operating branches, not claims of incorporated subsidiaries or dedicated teams. A client implementation can inform a reusable product; that does not make its one-off fee recurring product revenue.

## Navigation decisions

The sidebar is reduced from 21 destinations to 10. Supporting screens keep their routes and records and are reached through contextual navigation.

| Group | Main destination | Included work |
| --- | --- | --- |
| Aksen Labs | Home | Priorities and current operating totals |
| Aksen Labs | Branches & products | Company portfolio, public catalogue, product interest, feedback, demos |
| Sales | Lead Scout | Search, evidence review, import, automation/history; links to pipeline, AI costs and provider settings |
| Sales | Pipeline & assessment | Enquiries, qualification, next action, follow-up, business assessment |
| Sales | Conversations | Guide summaries, email desk, Guide answers |
| Client work | Projects & delivery | Project steps, delivery gates, client drafts, templates |
| Client work | Client records & money | Client documents, invoices, receipts and source-based drafts |
| Marketing | Articles | Drafting and publishing approvals |
| Marketing | Social & media | Planning and media creation |
| Manage | Settings & activity | Configuration, AI usage/costs and activity history |

Removed from the permanent sidebar: standalone assessment, waitlist, email, client drafts, document templates, feature requests, demos, media creation, AI usage, activity history and help answers. Each now belongs to a visible parent workflow. Nothing was deleted from the database.

## Sales, one flow at a time

1. **Find a business.** Write a research brief or import known businesses in Lead Scout. A saved result is public research, not confirmed interest. The latest three stored runs failed; a visible notice now points to run history and AI diagnostics before another run is started. No paid search was triggered in this review.
2. **Review evidence.** Inspect sources and contacts, shortlist a genuine fit, then explicitly promote it into the pipeline. Promotion does not authorize sending a message. Search, review, import and scheduling stay together.
3. **Qualify an enquiry.** Pipeline holds the stage, desired outcome, next action and follow-up date. Business assessment sits alongside it as a scoping step, rather than another unrelated destination. A researched prospect and an inbound enquiry retain their different provenance.
4. **Have the conversation.** Guide summaries preserve visitor handoffs. They are not a full inbox and cannot imply a sent reply. Email desk prepares reviewed outbound messages. Guide answers belong beside these conversations because they shape the visitor's answers.
5. **Win and deliver.** The existing lead-to-project path hands work into delivery. Project tasks, decisions, deliverables and risks give the next action somewhere to live. Client drafts and templates support that same record.
6. **Record money and hand over.** Link documents and receipts to the project. Payment can precede a formal invoice: an unknown total shows “Payment recorded”; explicit full settlement can show “Paid”. A payment does not automatically mark client acceptance.

## Product interest

The live waitlist contained zero signups at review. It has no reason to occupy a permanent sales destination. It now lives under Branches & products as **Product interest**.

The old “Owed an email” label asserted a delivery state the database does not track. The screen now says **Recorded interest** when products have listed addresses and explains the manual review step. A product address is not proof of live availability, and a signup is not automatically a qualified service lead or a general marketing subscription.

## Client reconciliation

| Client | Recorded collection | Delivery state | Next gate |
| --- | --- | --- | --- |
| Seth / Dinero-Yard | GHS 600 cash, full settlement, 10 October evening | Founder reports build complete; 100% build progress, delivery stage retained | Susu operator walkthrough, handover and formal acceptance |
| notjustlines | GHS 1,500 cash received; GHS interpreted from context | Existing website project and feedback state retained | Feedback, total fee/balance confirmation, acceptance and handover |

Both have linked client workspaces, source-attributed notes, project steps and internal receipts. No invoices or customer messages were created. The exact notjustlines payment date is left blank because only the reporting date is known. No bank/provider verification is implied.

The reconciliation script previews by default, writes in one transaction with a unique audit marker, and safely skips repeated execution. Verification found exactly two receipts totaling 210,000 minor units (GHS 2,100) and no invoices. The existing Ope/TFS records were retained.

## Recommended working sequence

Start with **Seth's Susu handover**, using the saved project steps: saver → contribution → history/calendar → withdrawal/early money taken → month-end payout or rollover. Then close notjustlines feedback and reconcile its fee. Next, review Lead Scout's failed run evidence and complete one real lead-to-assessment flow. Do not build a new branch dashboard to avoid these actions.

## Verification scope

The accompanying work checks source, type safety, regression tests, build output and local browser navigation. Database reconciliation is live and was read back. UI changes are local until deployment. Provider delivery, new research generation, client sends, public release, formal acceptance and real-money operation of Dinero-Yard were not exercised by this workspace review.

Verified during this change:

- All 36 regression test files passed, including the new distinction between partial/unknown cash collection and full settlement.
- TypeScript passed. Targeted lint passed on navigation, page, billing and review-test changes. Full repository lint still reports existing issues, including state updates in the client-workspace effects and unrelated media/payment components.
- All 23 admin routes passed the read-only browser smoke check, including server rendering and hydration.
- Browser clicks covered all 19 contextual page links and the four Lead Scout tabs. The Seth project link opened the correct client record and receipt; project badges showed Paid for Seth and Payment recorded for notjustlines.
- Six main workflows were checked at 320, 390, 768, 1024 and 1440 pixels (30 route/viewport combinations). All passed the final overflow check. The open menu now shows destination names on mobile/tablet, closes after navigation and supports Escape.
- The review found and fixed two existing responsive problems: intrinsic grid sizing expanded Lead Scout to 460px on a 320px screen; legacy sidebar CSS hid the mobile link labels.
- Screenshots are stored privately under `platform/outputs/workspace-review/`. They contain internal workspace information and are not public marketing assets.
