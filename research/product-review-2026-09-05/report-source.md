# Aksen Labs: product direction and the next useful build

Prepared for Tewogbade Olusegun Bamidele. Research checked 5 September 2026; implementation review updated 6 September 2026. Scope: current Aksen code, public journey, internal operating model and near-term product priorities. Ghana-first, founder-led launch. Past paid work is founder-reported; recurring clients, warm pipeline, weekly hours and cash budget are not established.

## 1 Direction: useful foundation, incomplete operating workflow

**We are building in a sensible direction, but the product is spreading across more surfaces than it can yet connect.** The public site explains a service, while the admin workspace is beginning to support running that service. Those are useful, distinct jobs. The next investment should join one real enquiry to an agreed scope, a delivered project and a follow-up, rather than add another general-purpose AI tool.

The existing business assessment of **6.5/10 remains a provisional judgment**, not a validated market score. Public evidence of the founder's BVM affiliation strengthens the credibility story. It does not establish Aksen's recurring revenue, acquisition economics or customer outcomes. Those are still the uncertainties that matter most.

Working business profile: **Aksen Labs helps growing service businesses connect recurring requests, information and everyday tools into practical AI workflows. It scopes and implements one workflow, trains the team, and offers ongoing monitoring and improvement where there is a continuing need.** This is proposed positioning, not a claim that every integration is already available in the portal.

The current site name is retained. A new name will not compensate for an unclear first offer, and no new name clearance was performed in this review. The earlier naming and pricing options remain hypotheses.

Good instincts in the founder's proposal: tie examples to their explanation; make the page a journey; make responsibilities visible; keep capabilities modular; run Aksen using the approach it sells. The necessary pushback: broad relevance does not mean launching for every industry at once, and a department label does not require an autonomous agent.

Sources: current checkout under Aksen-Labs/platform, inspected against baseline 12d82be and untracked additions. The working tree contains mixed uncommitted changes; individual authorship cannot be established from that state. BVM affiliation: [BVM company LinkedIn page](https://gh.linkedin.com/company/bold-vision-multitech), undated, checked 5 September 2026.

## 2 What the code actually adds

The additions are more than a visual dashboard, but they are not a complete business operating system. This assessment separates source-supported functions from unverified operational outcomes.

| Area | Present in the code | Important remaining gap |
|---|---|---|
| Public entry | Guide chat, industry examples, three-question mapper and enquiry save route | Mapper now calls the model with a fixed fallback. Only its title and answers are saved, not the full proposed pilot. |
| Sales and delivery | Enquiry list, project creation and project list | No connected enquiry-to-project conversion, editable pipeline workflow or delivery checklist in the inspected interface. |
| Content | Create articles, publish/unpublish and delete | Draft creation and publication approval are connected. No article-content editor or versioned approval snapshot yet. |
| Creative studio | Image/video generation interfaces, references, presets, saved media and prompt enhancement | Generated-media flows were not exercised with paid requests. Persistence errors can be hidden; completion and spend need stronger tracking. |
| Support | Conversation summaries and status changes | The saved summary is replaced on each turn; this is not full conversation history or a connected human reply channel. |
| Quality | Run logs, recorded costs and approval decisions | Latest 100 audit events are visible. Article approval executes publication; other action types still need executors. Some costs and events may be absent. |

**Corrections in this pass:** removed invented fallback prospects, projects and approvals; distinguished database failure from an empty list; corrected misleading counts and cost labels; added a six-function operating map; fixed missing mapper questions and the mismatch between displayed and saved suggestions; corrected a chat-history type error. The latest publication flow now blocks direct publish on creation as well as editing. Publication, decision and audit writes share one atomic SQL statement. Temporary-table regression tests passed for approval, rejection, repeat decisions, missing drafts and audit failure. Reviewers can read the draft before publishing, and failed content actions show an error.

The local database could be read successfully. The hosted configuration initially lacked DATABASE_URL. Its existing local value was added to the private site's runtime secrets; applying it requires deployment. This config correction does not prove the entire production write workflow.

Source evidence: app/admin/*, app/api/admin/*, app/api/opportunities/route.ts, app/api/chat/route.ts, app/api/recommendation/route.ts, components/standalone-mapper.tsx, lib/openrouter.ts, lib/conversations.ts, lib/agent-runs.ts and db/index.ts. No external customer results inferred from these files.

## 3 The public page should earn the next click

The page now follows this sequence: **recognise a useful example → recognise the everyday problem → understand the approach → explore another example → understand the small-pilot commitment → describe one task.** This is a design hypothesis to test with prospects, not a proven conversion improvement.

The hero's kicker, headline, explanation, image and example request share one selected industry. Desktop examples rotate every six seconds, with a pause control; selecting an example or focusing its content stops rotation. Phones and reduced-motion users get manual selection. New illustrative property and professional-services photographs replace the unrelated futuristic visuals. The desktop hero fits a 1280 by 720 viewport; mobile uses a natural vertical layout. Fitting every mobile hero element into one screen would sacrifice useful text and readable controls.

The problem framing is broader than customer chat: **“Too much of the day goes into keeping track of the work.”** Chasing updates, finding files, copying details and remembering replies are concrete entry points across sectors. The copy does not assume that every team already has a good process; discovery must also establish ownership, information quality and the rules of the task.

The closing action is **“Which task would you like to stop chasing?”** The mapper gives a starting suggestion before inviting contact details. It should ultimately feed a visible founder review with an owner and follow-up date. It does not send a message to the visitor's team, so that misleading button label has been replaced.

Keep a broad public explanation, but choose one delivery use case for the first sales experiment. Property remains a candidate because a demonstration exists; that does not establish that it is the best paying market. Compare it with another segment already identified in the launch plan using actual conversations and delivery economics.

The hero controls follow W3C guidance on user control and keyboard access. Tests can establish that the interface works; they cannot establish that the copy resonates. Ask a small set of target prospects to explain what Aksen does, identify the part relevant to them, and show what they would click next. Record confusion before rewriting again.

Source: [W3C WAI Carousels Tutorial](https://www.w3.org/WAI/tutorials/carousels/), updated 13 April 2017, retrieved 5 September 2026. Proposed journey and user-research exercise are recommendations.

## 4 Departments organise responsibility; workflows organise execution

For Aksen itself, start with six functions. The founder can own all six initially; these are not six immediate hires or six autonomous AI employees.

| Function | Useful AI assistance | Human accountability |
|---|---|---|
| Growth | Research summaries, content drafts, experiment analysis | Positioning, evidence and publication |
| Sales and scoping | Intake summary, discovery brief, scope draft | Qualification, prices and promises |
| Delivery | Configuration drafts, test cases, documentation | Architecture, access and acceptance |
| Customer success | Issue summaries, follow-up drafts | Relationships and escalation |
| Finance and administration | Organise records, draft invoice details | Contracts, accounts and payments |
| Quality and operations | Flag failed runs, prepare evaluation results | Release criteria and incident response |

For client software, reuse task capabilities such as intake, document collection, knowledge lookup and follow-up. One customer request may cross sales, operations and finance. Separate departmental agents with separate state could recreate the same handoff problem Aksen wants to solve.

Recommended layers: **shared business records; workflow state and assignment; bounded AI tasks; scoped tool connections; human decisions; event history and outcome measurement.** Keep these as clear interfaces in the current application first. There is no demonstrated need to split them into separate services or adopt a new orchestration platform now.

Each workflow needs a trigger, owner, permitted actions, required information, completion condition and exception path. An agent may classify, extract, retrieve or draft. A human still owns business commitments. “Approved”, “sent” and “completed” must describe different, verified states.

Anthropic distinguishes predefined workflows from autonomous agents and recommends complexity only where needed. LangGraph's interrupt pattern shows that a real approval must persist and resume the same execution, with attention to replayed side effects. These support the design recommendation; they do not prove local demand or require those vendors' products.

Sources: [Anthropic, Building effective agents](https://www.anthropic.com/engineering/building-effective-agents), 19 December 2024; [LangChain, LangGraph Interrupts](https://docs.langchain.com/oss/javascript/langgraph/interrupts), living documentation. Both checked 5 September 2026.

## 5 Build one complete operating loop next

**The next product slice should be enquiry → qualification → discovery summary → reviewed scope → accepted project → delivery checklist → follow-up.** Use real Aksen work; label synthetic test records explicitly. With no warm pipeline assumed, sales discovery must run alongside implementation.

| Order | Work to complete | Evidence needed before proceeding |
|---|---|---|
| 1. Trust the foundation | Verify hosted persistence; make admin access deny by default when its allowlist is missing; surface save failures. | Allowed and denied access checks, saved record read-back and a visible error path. |
| 2. Connect sales to delivery | Owner, qualification status, next action/date, reviewed scope and linked project conversion. | A real enquiry progresses without retyping or losing its source context. |
| 3. Make delivery inspectable | Tasks, acceptance criteria, baseline and client review. | A completed task has evidence and an accountable reviewer. |
| 4. Add bounded AI assistance | Draft the discovery summary and scope from approved records. | Human corrections are recorded; no unreviewed promises are sent. |
| 5. Add recurring care | Monitor failures, unresolved requests, usage and agreed service work. | A defined continuing responsibility that a client values enough to renew. |

Before wider access, also address duplicate submissions and state transitions, conversation identity/ownership, request and spend limits on paid endpoints, organization isolation, and durable audit records. The existing production admin allowlist is configured, but the code allows any signed-in user when that configuration is empty. This remains a design flaw, not a claim that unauthorized production access occurred.

Article approvals now enforce a pending-only decision and publish atomically with the audit events. Repeated decisions cannot republish. The request producer still uses a check-then-insert duplicate check, and approvals do not snapshot a draft version. Add database-backed duplicate prevention, a versioned proposed action and expiry before extending this pattern. Merely setting entity_type and entity_id does not implement a new action: each executor needs authorization, failure handling and tests.

Measure time to first useful response, enquiries with an owner/next action, completion time, failed or duplicate actions, human corrections and cost per completed workflow. Establish a baseline before claiming time saved. Anthropic's evaluation guidance explicitly distinguishes a successful-looking transcript from a real change in the environment.

Atomic SQL reference: [PostgreSQL data-modifying WITH statements](https://www.postgresql.org/docs/current/queries-with.html), checked 6 September 2026.

Source: [Anthropic, Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents), 9 January 2026, checked 5 September 2026. Sequence and acceptance criteria are proposed product decisions. No delivery dates are promised because weekly capacity and budget remain unknown.

## 6 BVM correction and commercial implications

The founder reports being BVM's technology and AI lead, building its products over roughly three to four years on an intermittent basis. Public records corroborate the affiliation: BVM's LinkedIn company page lists Olusegun Tewogbade, and his public profile identifies BVM Digital. The accessible records did not independently verify his exact current title, tenure or authorship of particular products.

BVM's own website describes BVM Digital as its digital arm and offers AI assessment, workflow mapping, training and implementation. The bvm-digital.com about page also describes the relationship and links the parent domain. These establish a public brand connection, not an independently checked corporate registration.

**Correct the earlier benchmark:** BVM's published pricing is founder-associated context, not independent market validation for Aksen. Advertised prices do not demonstrate actual sales, margin or willingness to pay. The previous proposed Aksen prices should remain testable offer hypotheses; this review supplies no evidence to increase or decrease them.

This relationship is both useful and strategically important. It can support an honest founder-experience story. It also means “AI implementation, training and support” alone does not distinguish Aksen from BVM's advertised offer. Aksen needs a repeatable workflow, clear service boundaries and measured delivery. Before using BVM logos, client names, product results or testimonials, establish which work can be attributed and presented. No BVM endorsement or transfer of its clients to Aksen is assumed.

The next research should accompany actual selling: document a recent workflow from a target buyer, the cost and frequency of its friction, the systems and people involved, what has already been tried, and the purchasing decision. Offer a bounded paid pilot with acceptance criteria, then track objections and delivery effort. Revisit pricing from that evidence, not from another agency's price list alone.

Sources: [BVM company LinkedIn page](https://gh.linkedin.com/company/bold-vision-multitech), [Olusegun Tewogbade's LinkedIn profile](https://gh.linkedin.com/in/bamidele-tewogbade), [BVM Digital on b-vm.com](https://b-vm.com/bvm-digital/), [BVM Digital about](https://bvm-digital.com/about), undated pages checked 5 September 2026. Direct access to the about page succeeded in the research lane but failed in the coordinator spot-check; the parent site's digital-arm description independently supports the relationship.

Limits: this is a bounded source and product review, not a penetration test, paid model benchmark, audited founder biography or Ghana demand study. No recurring revenue, customer outcome, staffing saving or conversion improvement was invented.
