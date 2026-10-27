# Aksen Labs application overhaul proposal

10 October 2026. Company-wide proposal, followed by an initial local implementation of the founder's selected priority.

## Purpose

Make Aksen easier to understand, buy from and run. Every screen must help someone make a decision, complete work, understand a commitment or find useful evidence.

This review covers the local Aksen Labs application and its company records. It does not establish the current condition of the deployed website, connected providers or the separate education and product applications. Existing uncommitted workspace consolidation is part of the starting point and must be preserved.

The requested landing-page phrase “BUILT IN GHANA” has been removed from the hero source. After reviewing the proposal, the founder selected simpler daily work across sales, delivery, money and follow-up as the first priority.

## What Aksen is

The current operating brief records Aksen Labs as the parent company for three branches:

1. Client services: help businesses sell, serve customers and run their work using websites, connected systems and useful technology.
2. Education: learnwithbishop helps people learn and apply practical skills.
3. Focused products: software that solves a specific recurring job, including the Dinero-Yard and Aksen Careers work.

Sales, finance, marketing and reusable technology support these branches. AI supports work throughout the company. Each branch can have its own customer experience while the parent workspace keeps track of commitments, money and priorities.

Proposed public explanation: **We build useful technology for businesses and help people learn to use it.** Supporting text can name websites, business systems, practical learning and focused products. This is draft wording to test with the founder and intended audience.

## What the source review found

| Finding | Why it matters | Proposed response |
| --- | --- | --- |
| The operating brief now describes a parent company; older messaging still centres the agency. | Different pages can explain different companies. | Reconcile the company story before rewriting page copy. |
| The homepage has a hero plus six sections, several dedicated to the WhatsApp order scenario. | One service example occupies much of the explanation of the whole business. | Give the parent promise first, then clear paths for services, learning and products. Move detailed demonstrations to their own pages. |
| The homepage ends with an assessment invitation and the shared footer adds another large invitation. | Repetition adds scrolling without answering a new question. | Use one closing action and a compact footer on pages that already close with it. |
| The main contact action opens the goals/markets/tools mapper. WhatsApp is an alternative. | A visitor ready to explain a need has extra steps before submitting a normal enquiry. | Make a short contact form the default; offer the guided assessment as optional help. |
| Recent local work groups the admin sidebar into ten destinations. | Useful consolidation already exists. | Build on it and test whether six work areas make everyday journeys clearer. Keep redirects and contextual access for existing routes. |
| The dashboard includes a media suggestion whenever there were no episodes in seven days. | Tool activity can become a priority without a commercial reason. | Recommend work tied to a real enquiry, deadline, agreement or chosen campaign. |
| Projects, documents and financial records already exist, with links between several of them. | A new CRM or invoice system would duplicate substantial functionality. | Strengthen the existing client journey and make the connected record easy to navigate. |
| The inspected financial model covers proformas, invoices and receipts. | Money collected alone does not show delivery cost or profit. | First define the smallest useful way to record project costs and time; do not display profit without the required inputs. |
| Guide summaries and the email desk are separate functions. | Calling them a complete shared inbox would overstate what they do. | Keep precise labels and show actual message states. Add channels only for a proven workflow need. |
| The product catalogue labels Aksen Careers live and contains an address; the operating brief still says CV Forge has no public address. | Product availability can drift across copy, documents and cards. | Verify the destination, then reconcile name, status and public claims in a maintained product record. An address alone does not establish availability. |
| The company page describes branches mostly through static text. | It explains the structure but offers limited help in deciding what to work on next. | Keep brief branch summaries, a real next milestone and links to the applications that own their records. |

Source anchors: `platform/app/page.tsx`, `platform/components/hero-animations.tsx`, `platform/components/site-chrome.tsx`, `platform/app/agent-mapper/page.tsx`, `platform/lib/admin-navigation.ts`, `platform/app/admin/page.tsx`, `platform/app/admin/products/page.tsx`, `platform/components/business-workspace.tsx`, `platform/db/schema.ts`, `platform/lib/product-catalog.ts`, `Docs/Aksen-Operating-Brief.md`, and `Docs/Workspace-Flow-Review-2026-10-10.md`.

## Ask why before keeping or adding anything

For every feature, section, field and metric:

1. Who needs this?
2. What are they trying to do?
3. Why is the current way insufficient?
4. What action or decision does this information change?
5. What is the simplest reliable way to support that action?

Then ask: what evidence would show that the change helped? If an item has no useful answer, remove it from the default page, merge it into a relevant task or retire its interface. Historical client, financial and audit records remain available where needed. Removing visual clutter is not permission to erase business history.

Example: why show an invoice total on Today? Because a payment needs attention. Why does it need attention? Its agreed due date has passed. Therefore show the client, balance, date and a review action. A large total with no action belongs in Money, not in the daily priority list.

## Proposed main features

| Area | Main question | Essential features | First implementation priority |
| --- | --- | --- | --- |
| Today | What needs my attention? | Up to three immediate priorities; due follow-ups; delivery blockers; payments needing review; links to their records. | Replace generic activity prompts and repeated summaries with evidence-backed actions. |
| Sales | Who needs help, and what happens next? | Enquiries, contacts, conversation notes, qualification, optional assessment, proposals, next action and follow-up date. Lead Scout is a tool within Sales. | Verify enquiry capture and handoff, then connect the existing prospect-to-project flow. |
| Work | What have we promised, and what remains? | Clients, projects, agreed scope, milestones, files, decisions, changes, acceptance, handover and care. | One connected client record with a clear next step. Keep build completion, payment and acceptance distinct. |
| Money | What was billed, collected, spent and remains due? | Existing invoice and receipt workflow, payment evidence, balances and due dates; simple project costs and time when needed. | Make existing financial states clear; identify unknown balances explicitly. |
| Marketing | What are we saying, to whom, and why? | Campaign purpose, articles, social posts, reusable assets and review before publishing. | Put current content/media tools behind one work area; link a campaign to its enquiry source where evidence exists. |
| Company | What are our branches building, and what deserves attention? | Services, education and product portfolio; verified maturity; current milestone; responsible person; useful links and branch attribution. | A concise portfolio that links to the branch systems without copying their databases. |

Settings, access, provider configuration, AI costs and activity history are supporting utilities. Approvals appear beside the affected work and can surface on Today when a decision is needed.

These are proposed navigation areas, not six new applications or six new backend services.

## Three connected experiences

### Public website

Its job is to help a visitor understand Aksen, find the relevant offer and take a useful next step.

Aim for four purposeful homepage blocks:

1. Clear promise, one short explanation and a visible “Discuss your business” action.
2. Three routes: help for a business, practical learning and useful products. Keep client services visually prominent while showing the company structure.
3. A small selection of relevant work or examples, with honest status and permission for client material. Link to details instead of putting walkthroughs on the homepage.
4. A short contact invitation that explains what happens next.

Proposed top navigation: Services, Products, Learn, About, plus the contact action. Keep useful pricing information close to Services. Keep articles accessible without requiring a separate primary navigation item. Validate destinations before linking; do not add empty pages to complete the navigation.

Retain Ghana as factual company information where useful, such as About or contact details. The founder specifically requested removal of the hero badge, not deletion of the company's location from all records.

### Internal workspace

Its job is to carry work through one connected chain:

Enquiry → conversation → assessment → agreed scope → project → delivery → acceptance → care.

Invoices and collections attach to the relevant client/project at the actual agreed stage; this sequence does not require payment to wait until delivery. Existing clients and projects can enter midway with clear source notes.

The same client context should follow the work. Do not require the founder to retype a business name, needs or scope across the pipeline, project and invoice screens. Each page has one main job, one clear main action and details available when needed.

### Client access, introduced after the internal flow works

A small secure project page could let a client review progress, provide a missing file, comment on a deliverable and approve a specific version. It should reduce actual back-and-forth before growing into a full portal. First prove the flow internally, then validate it with one client. Existing emails and documents can support the initial version.

## Useful improvements that compound

- **A next action with a reason.** “Review this invoice; the agreed due date passed” is useful. A suggestion to create content just because the studio was quiet is weaker.
- **A reusable project history.** Discovery, scope changes, delivery decisions and handover stay linked. AI can prepare drafts from that history; the person reviews commitments.
- **Results and publication permission.** Record a baseline, the agreed outcome, evidence after delivery and permission to share. Prepare a case study only when those records support one.
- **Service-to-product learning.** Repeated problems across client work can become candidates for a product. Capture the pattern before deciding to build another product.
- **Branch visibility without duplicated operations.** learnwithbishop owns learner and course records; product applications own their users and domain activity. Aksen can later receive limited summaries with a source and refresh date when a real decision needs them.

## Rules for shorter pages and simpler language

- Put the answer and main action first. Do not spend the first screen explaining how to read the page.
- Remove repeated introductions, decorative metrics and repeated calls to action.
- Use concise summaries and open full records on demand. Keep critical balances, deadlines, errors and approvals visible.
- Use tabs only for separate tasks within the same record; do not hide essential information to make a page appear short.
- Use a clear empty state with one useful action. Keep loading, unavailable and empty states distinct.
- Replace labels such as “Pipeline pulse”, “zero inference burn” and “UAT” with language appropriate to the user: “Sales”, “No AI costs recorded” and “Client review”.
- Let the homepage and primary workspace screens be brief. Longer records and explanations are acceptable where the task requires them.
- Test real phone widths, keyboard navigation and reduced motion. Animation must not delay understanding or reaching the main action.

## Implementation sequence and exit tests

1. **Agree the company and page map.** Reconcile current positioning and product-status conflicts. Produce a keep/merge/remove list for each route, based on purpose and evidence. Exit: every main page has a named user, job and next action.
2. **Simplify the public journey.** Homepage, navigation, services, product/learning routes and direct contact. Exit: a visitor can explain what Aksen does, find the relevant route and submit an enquiry from a phone; capture and delivery states are verified separately.
3. **Simplify Today and connect Sales to Work.** Reuse the existing modules and records. Exit: one enquiry becomes a scoped project without repeated entry, and the next action remains visible.
4. **Complete the delivery and money journey.** Review scope changes, balances, evidence, acceptance, handover and ongoing care. Exit: a real project record clearly shows what was promised, built, collected, accepted and still outstanding.
5. **Make Company and Marketing purposeful.** Concise branch records and campaign-driven content work. Exit: each summary has a source, a useful action and a current status; technical tools remain accessible in context.
6. **Add client access or integrations only where the previous flows show a need.** Exit: a client completes a useful review/handover task with less back-and-forth, with access boundaries tested.

During implementation, use targeted static checks and regression tests, then mobile/browser task checks. Test authentication and access separately. Distinguish local source, database state, provider delivery and deployed behavior in the report. Do not treat a build passing as proof that an enquiry reached the founder or a client accepted the work.

## Confirmed priority and first implementation

The founder selected: **Make daily work simpler: sales, delivery, money and follow-up.** Internal operations therefore lead the implementation sequence. The larger public-site, branch and client-access changes remain proposed follow-on work.

The first local implementation simplifies Today, gives the main work areas direct navigation, adds a company-wide view of recorded collections and unpaid invoices, opens specific enquiries/projects/financial records from action links, and moves project creation out of the default work list. Default enquiry and project lists are shorter, with more records available on demand.

Today derives suggestions from existing dates, stages, balances and delivery blockers. It does not infer that a payment or client acceptance happened. The Money view keeps currencies separate and labels receipt totals as all recorded collections, correcting the former dashboard's misleading monthly label.

Existing client and financial records remain the source. The initial pass introduces no new data model or payment action. Implementation validation and outstanding limitations are recorded separately in `Daily-Work-Implementation-2026-10-10.md`.
