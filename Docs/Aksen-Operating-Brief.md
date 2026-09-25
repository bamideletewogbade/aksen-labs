# Aksen Labs operating brief

**This is the internal source of truth for the business.** It replaces "Aksen Labs: A Friend's Guide" (15 September 2026), which was written to be shown to one person and is now retired as a shareable artefact. Everything in that document that was true is here, plus the parts that were left out because a friend did not need them.

It exists so that the founder and any AI agent working on this business start from the same facts, do not re-derive them, and do not invent the ones they cannot find.

---

## 0. How to use this document

**Read section 2 before writing any public copy, quoting any price, or describing anything Aksen has done.** That section is where the expensive mistakes live.

**When a fact changes, change it here first**, then in the code or the copy. A fact that lives only in a commit message is a fact the next session will not have.

**Section 4 is dated on purpose.** If the date is more than two weeks old, treat its numbers as stale and check before repeating them.

**Do not delete history.** Move superseded entries to section 9 with the date they stopped being true. A record of what we believed and when is worth more than a tidy document.

**For agents specifically:** this document tells you what is true. It does not authorise you to act. Publishing, sending, pricing and promising still go through a person. See section 2.

---

## 1. The business in one page

| | |
| --- | --- |
| **Name** | Aksen Labs |
| **Category** | Digital transformation agency |
| **Mission** | Help African businesses prosper through the effective use of technology |
| **Public promise** | Technology that helps your business grow |
| **Base** | Ghana. Open to Nigeria, the rest of Africa and beyond, subject to actual delivery ability |
| **Run by** | Bishop (founder, and currently the entire delivery team) |
| **Revenue to date** | None |
| **Paying customers** | None |

**What we sell.** Four capability areas, defined in `platform/lib/agency-content.ts` and rendered on the homepage and `/solutions`:

1. **Customer experience & commerce**: websites, shops, booking, payments. Clearest buying trigger, the only one with a genuine entry price.
2. **Business systems & operations**: records, admin tools, approvals, integrations. Highest margin, hardest to scope from a website.
3. **Data & business insight**: reporting and decision support. Rarely a first purchase.
4. **Digital products & new services**: discovery, prototypes, custom applications. Riskiest to sell; fixed price on a new product is where small agencies lose money.

**The first campaign.** One recognisable problem, not four capabilities: *an owner-led business selling on WhatsApp loses orders in the message backlog.* An agent answers, takes the order with the details complete, and writes it where the team can see it. A person keeps price, payment and promises. This is what the homepage now argues, end to end, and what the launch film says in nine lines.

**AI's role.** A multiplier across the work, not the company's identity. It prepares, organises and explains. It does not decide.

---

## 2. Hard rules

These are not style preferences. Each one exists because breaking it costs money, a client, or the ability to say anything credible later.

### Claims

- **Never claim a customer outcome we do not have.** We have none. Not "trusted by", not "businesses like yours", not a logo wall, not a testimonial, not a percentage.
- **Never use The Frame Shop (TFS) as public proof.** No signed scope, no approved price, no verified payment, no client acceptance. It is a proposal with implementation started ahead of alignment. It becomes a case study only with written permission and confirmed facts.
- **Banned absolutes:** never misses an order, replaces your staff, guaranteed growth, leading across Africa, any fixed revenue multiplier. Prefer "helps organise" over "sorts every".
- **Describe products by their actual maturity.** CV Forge is built and has no public address. The free tools work. The demonstrations are demonstrations and say so.
- **Do not claim offices, coverage, team members or clients that do not exist.** The stock photography on the site shows *the kind of business we build for*, never our team and never our clients.

### Client data

- **Client records never go into public assets.** The first admin capture for the homepage showed a named prospect and the state of an open negotiation. It was deleted. `video/scripts/capture-site.mjs` now captures control screens only, and says why in a comment.
- **If a records screen is ever needed publicly, seed fictional data and capture that.** Do not capture the real one and check it afterwards.

### What AI is not allowed to do

This is the argument the company turns on, so it has to be true inside our own product as well as in the pitch:

- It does not set a price, take a payment, or promise a date.
- It does not confirm a payment, sign an agreement, publish content, contact a prospect, or make a promise on the founder's behalf.
- In the feedback board, triage reads and recommends. It cannot publish, cannot move a status, cannot write a changelog entry.
- Enforced by the system, not by instructions. If a new feature would let an agent cross one of these lines, that is a design bug.

### Voice

- No em dashes. No AI-stock phrasing ("delve", "leverage", "in today's fast-paced world", "it's not just X, it's Y").
- Plain words a shop owner uses. "Digital transformation" is the category we sell into, not a phrase to open with.

---

## 3. What exists today

| Thing | What it is | Status | Where |
| --- | --- | --- | --- |
| Public site | Agency site: services, pricing, approach, about, blog, products | Built, running locally | `platform/app` |
| Business agents | Three assistants that turn a brief into a draft | **Free, working, no account** | `/business-agents` |
| Order walkthrough | Fictional enquiry through spec, quote, payment check, handover | Demonstration | `/order-demo` |
| Support assistant | Answers from approved information, hands over rather than guessing | Demonstration | `/support-demo` |
| Workspace | Document assistant prepares, a person reviews | Demonstration | `/workspace-demo` |
| Admin workspace | Pipeline, projects, clients, invoices, agent desk, approvals, audit, content, social, media, feedback | Built, in real use | `/admin` |
| Lead Scout | Staged prospect research with evidence checks, rejects unsupported contacts | Built | `/admin/prospects` |
| Feedback board | Public suggestions, AI triage that recommends but cannot publish | Built | `/feedback` |
| CV Forge | Job-search product: CV, roles, applications, outcomes | **Built, no public address** | `2ndGenCVInsight` on the founder's machine |
| Video pipeline | Remotion renders the launch film from code; Playwright captures real screens | Built | `video/` |
| Launch film | Nine-line problem-to-proof arc, three formats | Rendered | `video/out/` |

**Clients and prospects**

| Who | State |
| --- | --- |
| The Frame Shop (TFS) | Only live project. Marked *In delivery* because implementation started. Awaiting client reply on WhatsApp. No signed scope, price, date, payment or acceptance. |
| Efe Organics | Founder brief written 6 September. Alberta's cosmetics brand, sells through a reseller, no owned channel. |
| Ope's TFS group | Three Lagos decor brands, one WhatsApp number, no website. |

---

## 4. Where the business actually stands

*As at 22 September 2026. The two numbers were re-checked on that date and had not moved.*

- **The founder is now full-time on Aksen.** The role at AIC ended. This is the largest change since this brief was written, and section 5 has been updated for it. It removes the capacity ceiling and removes the last external excuse for the two numbers below.
- **Seven days passed between the daily operating system being set up and this check, with no entries in `Docs/Daily-Log.md`.** In the same period the Media Studio shipped with six supporting documents, plus avatar, voice and distribution work, and a further session went into admin test tooling. The log's own last line on 15 September reads "Tomorrow starts with S-01, a message to an actual client, before anything else gets built." That did not happen.
- **An external strategic review arrived 22 September**, written by Kevin from the platform and the public material without access to this brief. It reached the same four conclusions as section 7: human in the loop is the strongest asset, the company is pre-proof, internal tool building must stop, and one narrow offer should lead. It proposes a different wedge from the one in section 1. The comparison, the market data behind it and the open decisions are in the Business Alignment doc.

- **Cedis invoiced: 0. Cedis collected: 0. Paying customers: 0.**
- **Sales pipeline: empty.** The admin pipeline screen reads "Nothing in the pipeline yet."
- **Live projects: 1**, stalled on a client reply.
- **Recorded owner conversations: none.** There is no file in this repo containing what a business owner said about their own problem in their own words.
- **Hosted release: behind local.** The registered Sites project was at version 2, last updated 3 September, owner-restricted. Local work runs well ahead of it.
- **The enquiry loop is built and switched off.** The 12 September review found it missing; it was built afterwards and the code is now complete: founder notification, visitor acknowledgement, rate limits, body cap, idempotent capture, a durable outbox with retries, a privacy page, and one intake path shared by the enquiry form and the free tools. Nothing can leave, because `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are not set. Every message queues and waits, which is recoverable in full the moment they are. `cd platform && node scripts/check-intake.mjs` reports the state.

**The honest summary:** the platform is strong and the business has not started. Everything built so far is capability. None of it is evidence.

---

## 5. The numbers that govern decisions

From the pricing and profitability guide, 10 September.

**The ladder**

| Stage | Price | Job it does |
| --- | --- | --- |
| Assess | GHS 2,500 fixed, one agreed process | Converts curiosity into paid work; stops you quoting blind |
| Build | From GHS 6,500, quoted *after* assessment | The revenue event |
| Operate | From GHS 900/mo website care; managed operations GHS 4,000–18,000/mo | The compounding part; the reason the business is worth owning |

**Cost floor.** Placeholder loaded delivery cost **GHS 120/hour** until real timesheets exist. Founder time is a cost even when no salary is drawn.

`floor = estimated delivery cost / (1 − target contribution margin)`

At 50%: a 36-hour build costs GHS 4,320, so the floor is about **GHS 9,240**.

**The line that matters most:** rework destroys roughly two thirds of project contribution; unbounded support destroys five sixths of care contribution. **Profitability is a scope-control problem, not a pricing problem.**

**Qualifying rule.** Monthly gross benefit minus care and usage cost must be positive, and simple payback should clear roughly six months, using the client's own numbers rather than ours.

**The binding constraint was capacity. As of 22 September 2026 it is demand.** The "working case" (8 builds, 36 care months, GHS 204,000) needs about 648 delivery hours. At 25 hours a week over 46 weeks with 35% reserved for sales and admin, roughly 747 hours remain. At 15 hours a week it does not fit at all, which was the governing number while the founder held a full-time role elsewhere.

That role ended. Aksen Labs is now the founder's main work with no fixed hour ceiling, so the working case is arithmetically reachable and the cautious case is no longer the only honest plan.

**This is a smaller change than it looks.** Hours were never the scarce thing. The scarce things are conversations with owners and cedis invoiced, and both are still zero. More available hours spent building makes that imbalance worse, not better. Read the new capacity as permission to sell harder, never as permission to build more. Still write down the hours actually available per week and check any plan against them; the number has changed, the discipline has not.

**Ghana comparators** (4 September, vendor offers not willingness to pay): Coriable website chatbots GHS 8,000–18,000, WhatsApp assistants GHS 15,000–40,000, workflow automation GHS 20,000–120,000. AutomateGhana's Kasabot GHS 800–1,500/mo, no setup fee. BVM Digital audit GHS 1,500, full-stack GHS 12,000–25,000.

---

## 6. Roadmap

Each phase has an exit test. A phase is not done because work happened in it; it is done when the test passes. Phases overlap where noted, but a later phase never starts to avoid an earlier one.

### Phase 0: Close the loop (days, not weeks)

Nothing else matters while a stranger cannot reach you and get an answer. Every hour of acquisition spent before this is wasted.

The code is done as of 15 September. What remains is configuration, a button and a deployment.

- [x] Founder notification on every enquiry, and an acknowledgement to the sender
- [x] Rate limit, body-size limit and idempotent capture on the public enquiry endpoint
- [x] Privacy notice, and the footer separator
- [x] A durable outbox so a provider outage delays a message rather than losing it
- [x] One intake path for every lead source, tagged by `source`
- [ ] Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL`, and verify a sending domain
- [ ] Set `AUTOMATION_TICK_URL` and `AUTOMATION_SECRET` so the heartbeat drains the queue
- [ ] Add the "send this to yourself" control after a business agent's draft
- [ ] Direct contact first: name, reply address, one free-text box. The guided mapper becomes optional help, not the gate
- [ ] Identify the intended hosted release; deploy the current build to it
- [ ] Verify access as an unauthenticated visitor on mobile data, not on the dev machine

**Exit test:** submit a test enquiry from a phone, on mobile data, as a stranger. A notification arrives. A reply is sent. Both are visible in the pipeline.

### Phase 1: Find out whether anyone wants it (weeks 1–4)

The goal is evidence, not a sale.

- [ ] Build a list of 40 owner-led retail and made-to-order businesses in Accra that sell over WhatsApp and have no order system. Lead Scout exists for exactly this
- [ ] Hold **20 conversations**. Ask before explaining, using the Friend's Guide questions: *In your own words, what does Aksen do? Which part feels most useful? What feels confusing? What would make you get in touch? What would you need to see before trusting us with real work?*
- [ ] Log every one in the pipeline. The pipeline being empty is the single clearest sign the business has not started
- [ ] Record the pain in the owner's own words, verbatim, in `Docs/Owner-Conversations.md`

**Exit test:** 20 logged conversations, and you can quote the three sentences owners actually used to describe the problem. If those sentences do not match the homepage, the homepage changes.

### Phase 2: Sell three assessments (weeks 3–8, overlaps Phase 1)

- [ ] Offer the GHS 2,500 assessment on one agreed process to every qualified conversation
- [ ] Three paid and collected
- [ ] For each: estimate their current quoting and rework effort, the value of avoidable errors, implementation cost, recurring care and provider usage. Separate time saved from cash saved

**Exit test:** GHS 7,500 invoiced and in the account. Not promised. In the account.

### Phase 3: Deliver one build (weeks 6–14)

- [ ] One bounded build, priced at or above the floor, quoted only after the assessment
- [ ] Review rounds and the change process written into the proposal before work starts
- [ ] Third-party costs (model, WhatsApp, voice, storage, hosting) outside the fee or inside an approved allowance with alerts
- [ ] **Log every delivery hour from hour one.** Without this the GHS 120/hour stays a guess and every future quote stays a guess

**Exit test:** client acceptance against written criteria, invoice paid, hours logged, actual contribution calculated and compared to the estimate.

### Phase 4: Earn one case study (weeks 12–18)

- [ ] Baseline measured before the work, result measured after, both from the client's numbers
- [ ] Written permission to use their name and figures
- [ ] Published with scope, status and outcome stated accurately

**Exit test:** one public case study that a sceptical reader could verify by calling the client.

### Phase 5: Repeat, then productise (months 4–9)

- [ ] Five more of the same offer, same sector. Resist the new sector and the interesting exception
- [ ] At least one client on managed operations at GHS 4,000+/mo
- [ ] Day-90 decision from the pricing guide: expand only if outcomes were accepted, contribution held after logged hours, and at least one buyer pays for ongoing care

**Exit test:** exit MRR above GHS 8,000, contribution above 45% on logged hours, and the delivery playbook written down well enough for someone else to follow.

### Phase 6: The second bet (2027, gated)

The admin workspace as a sellable product. The observations file already notes it is tenant-shaped: every admin query filters on `owner_id`, rate limits are keyed per owner, usage is counted in the database.

**Gate:** phases 1–5 complete. Until an agency has been run profitably on it, it is a CRM with no customers, and there are a lot of those.

### What is not being done until Phase 4 passes

Written down so it has to be argued with rather than drifted past:

- No new admin modules
- No new AI agents
- No new free tools or demonstrations
- No new sectors, no Nigeria expansion
- No CV Forge marketing (give it a URL, because it is built and parking it costs nothing, then leave it alone)
- No editorial agent, no new social tooling, no further video work beyond using what is rendered

---

## 7. If I were running this

Asked for directly, so this is a straight answer rather than a balanced one.

**1. The build-to-sell ratio is the whole problem.** In roughly two weeks this business produced an admin workspace with about twenty modules, a prospect researcher, an editorial agent, a social hub, a media studio, a feedback board with AI triage, a code-rendered video pipeline and a launch film. In the same period it produced zero conversations with business owners and zero cedis. That is not a resourcing problem or a market problem. It is a building habit standing in for a selling habit, because building is the part that is enjoyable and always works.

**2. The advice was already given and not taken.** The 12 September review ended with: *"Do not add more internal tooling merely to feel launch-ready."* On 15 September the social hub shipped, and the same day a video workspace. I would treat that sentence as the most important line in the archive, and I would put a freeze on the platform until someone has paid.

**3. Close the loop this week, then stop touching the product.** The enquiry endpoint still does not tell you when somebody writes in. That is perhaps two days of work and it is the difference between a website and a business. Everything in Phase 0, then hands off the code.

**4. Sell one thing.** "We help African businesses prosper through technology" is true and unbuyable. "Your customers message at night, the orders get taken properly, and you approve them in the morning" is buyable. Keep the agency breadth on `/solutions` for the people who ask, and lead with the one story everywhere else. The homepage and the film now both do this; the calendar should too.

**5. The free tools are a funnel with no pipe attached.** Someone runs a business agent, gets a useful draft, and vanishes. No capture, no follow-up, nothing. That is the cheapest high-return fix available and it is not on anyone's list.

**6. Twenty conversations, not one deal.** TFS is a single stalled negotiation being treated as a pipeline. One deal that goes quiet takes the whole company's morale with it. Twenty conversations makes any single silence uninteresting, and it is the only way to find out whether the offer is wrong before building more of it.

**7. Charge for the pilot, even if it feels early.** The GHS 2,500 assessment exists. Free work produces a case study nobody respects, a client who does not turn up to meetings, and no information about willingness to pay, which is the one thing that is still unknown.

**8. Be honest about hours.** *Rewritten 22 September 2026; the original is in section 9.* This item used to say that fifteen hours a week alongside another job made the working case impossible, and to plan the cautious case instead. The other job has gone and the hours are now full-time, so that arithmetic no longer binds.

The honesty this item was asking for still applies, pointed at a different number. The question is no longer "how many hours are there" but "how many of them went into selling". A full-time week that produces forty hours of building and no conversations is a worse outcome than the fifteen-hour week was, because it burns more of the founder's life to reach the same zero. Count the hours that went into SELL, weekly, and treat a week with none as a failed week however much shipped. It is also still worth having thought about the overlap with BVM Digital before a prospect raises it.

**9. Track two numbers, weekly, in public.** *Conversations with owners this week.* *Cedis invoiced this month.* Not features shipped, not tests passing, not pages redesigned. If both are zero for three weeks running, the strategy is wrong and no amount of building will fix it.

**10. The thing that is genuinely good here, and should be protected.** The "where the line is" argument (AI prepares, a person decides, enforced by the system) is a real differentiator in a market full of people promising autonomous agents. It is defensible, it is demonstrable in the product, it is the right answer for a business owner who is frightened of this technology, and it is already true inside the software. Lead with it, and do not build anything that makes it a lie.

---

## 8. Sources

| Source | What it holds |
| --- | --- |
| Business Alignment doc | Shared record with Kevin: the two readings compared, sourced Ghana market figures, the open wedge decision, and a dated log of what was said against when it shipped. Lives as a document at `claude.ai/code/artifact/31bd5b6c-226c-4e1f-93a4-c8b8b3e3fc19`, not in this repository, because it is edited by two people. 22 September. |
| `Docs/Business-OS.md` | How the business is run daily: the three lanes, the scoreboard, the ledger stages. |
| `Docs/Revenue-Ledger.md` | Every money-making mechanism, as a pipeline from Noticed to Earning. |
| `Docs/Queue.md` | Pre-decided daily work, nothing over 25 minutes. |
| `Docs/Daily-Log.md` | Append-only record, the streak, the two numbers. |
| `Docs/Aksen-Labs-Messaging.md` | Category, mission, approved copy, claim discipline. 7 September. |
| `Docs/Business-and-Launch-Review-2026-09-12.md` | The gap analysis this brief's roadmap is built on. |
| `Docs/Pricing-Page-and-Profitability-Guide.md` | The ladder, the cost floor, the capacity arithmetic. |
| `Docs/Product-Direction-2026-09-14.md` | Products run elsewhere; the site describes and links out. |
| `Docs/Backend-As-Product-Observations.md` | Running evidence for the Phase 6 bet. |
| `Docs/TFS-Client-Alignment-Draft-2026-09-11.md` | The state of the only live deal. |
| `Docs/Operating-Templates/` | Discovery, qualification, proposal, scope, kickoff, UAT, handover, care, billing, change. |
| `video/src/compositions/LaunchFilm.tsx` | The nine-line story arc. The captions are the script. |
| `platform/app/page.tsx` | The homepage, which tells the same story in nine sections. |

**Retired:** "Aksen Labs: A Friend's Guide", 15 September 2026. Written to be shown to one person. Its content is carried here. Do not send the original again; it links to an owner-restricted product and names an admin address.

---

## 9. Decision log

Newest first. One line each: what was decided, when, and why.

| Date | Decision |
| --- | --- |
| 2026-09-22 | Founder full-time on Aksen Labs; the AIC role ended. Section 5's capacity arithmetic updated: the binding constraint moves from capacity to demand. Section 7 item 8 rewritten; its original text is preserved below. The working case (8 builds, GHS 204,000) is now arithmetically reachable, which is permission to sell harder and not permission to build more. |
| 2026-09-22 | External strategic review received from Kevin, written without access to this brief. Independently reached section 7's conclusions on human in the loop, pre-proof status, stopping internal tooling and leading with one narrow offer. Logged as agreement, not as a new decision. |
| 2026-09-22 | Wedge decision opened, not closed. The review proposes productised ops and support drafting sold to professional services; section 1 says owner-led retail losing WhatsApp orders. Recommendation on file is to lead with order capture and hold professional services as the second offer, on the grounds that the public argument for it is already built and the professional services vertical already has purpose-built competitors selling into Ghana. Awaiting Kevin's agreement before this becomes a decision. |
| 2026-09-22 | Business alignment kept as a document, not an admin module, following the 15 September precedent below. Market figures researched and cited there rather than repeated here. |
| 2026-09-16 | Nigeria referral test through friends, against the section 6 "no Nigeria expansion" line, by founder decision. Entry prices in naira (free call, Lead Pack ₦29,900, Business Check ₦49,900, Starter Page ₦99,000, Order Desk ₦149,000, Bookings ₦179,000, custom from ₦450,000, care from ₦19,900/mo), fixed scope and hour-capped. No ads budget, no sector pages. Kit in `marketing/nigeria-kit/`, reasoning in `Docs/Nigeria-Friends-Kit-and-Pricing-2026-09-16.md`. Public link for now: aksen-labs.bishoptewogbade.workers.dev. |
| 2026-09-16 | Admin review: every screen checked with fictional seed data and a text-contrast script. Long screens split into tabs (Lead Scout, Social Hub, Articles, AI usage, Pipeline) with one shared `AdminTabs` component; invisible dark-theme text fixed in `admin-light.css`. No new modules. |
| 2026-09-15 | Outbound messages go through one durable outbox (`lib/outbox.ts`), and every lead through one intake (`lib/lead-intake.ts`) tagged by source. A second channel later is a new `channel` value, not a second delivery path. Heartbeat moved to every ten minutes so an acknowledgement is not an hour behind the enquiry. |
| 2026-09-15 | R-007 priced: GHS 450 for one cut, GHS 150 for a recut. The entry is low enough to need no meeting and the margin sits in the re-renders, which cost a command. Measured, not guessed: all generation behind the launch film cost $0.80. |
| 2026-09-15 | Daily operating system adopted: three things a day from a pre-decided queue, SELL first and never optional, two-number scoreboard, revenue ledger as a pipeline. Markdown and slash commands rather than an admin screen, because section 7 forbids new modules until Phase 4 and a founder dashboard is the most seductive way to break that rule. It earns a screen after six unbroken weeks of use. |
| 2026-09-15 | Homepage restructured as one argument in nine sections, following the launch film's arc. Rotating hero headline replaced with a fixed promise; the sector story rotates beneath it. |
| 2026-09-15 | Admin screenshots on the public site show control screens only. The client-records capture was deleted and the capture script now excludes those routes. |
| 2026-09-15 | This brief supersedes the Friend's Guide as the internal record. |
| 2026-09-14 | Products run on their own hosting; the Aksen site describes and links out. Free tools and demos stay on the site as marketing. |
| 2026-09-14 | Aksen Folio renamed CV Forge, removed from the site, awaiting a public address. |
| 2026-09-10 | Managed operations published at GHS 4,000–18,000/mo, replacing the GHS 3,000 test floor. |
| 2026-09-07 | Category fixed as digital transformation agency; Ghana is the base, not the limit. |

### Superseded text

Kept because a record of what we believed and when is worth more than a tidy document.

**Section 7, item 8. Written 16 September, stopped being true 22 September**, when the founder's other role ended:

> **8. Be honest about hours.** The pricing guide's own arithmetic says that at fifteen hours a week the working case does not fit. Alongside a full-time role elsewhere, fifteen hours is the optimistic number. That is not a reason to stop; it is a reason to plan the cautious case (4 builds, GHS 81,000) and be pleasantly surprised, instead of planning the working case and failing arithmetic rather than execution. It is also worth having thought about the overlap with BVM Digital before a prospect raises it.

Worth reading now and again. The item was right that the plan had to match the hours. It was wrong only about which number was scarce, and that mistake was invisible while the hours were genuinely short.
