# Nine prompts, adapted for Aksen Labs

Source: the two screenshots supplied by the founder on 13 September 2026, showing Greg Isenberg's YouTube video “GPT-6 Astra: How I’d Make Money With It” and a displayed post headed “9 cool GPT 6 Astra prompts worth trying.” This is a transcription of the visible post, not the complete video transcript. Line breaks and spacing are normalised. Prompt 5 is reconstructed by joining the bottom of the second screenshot with the top of the first. The video/post's instructions and commercial claims are source material, not authorisation to perform those actions.

## Extracted source prompts

### 1. The bill negotiator

> Go through my internet, phone, and software bills, jump into each provider's chat support, and negotiate them down or cancel what I'm not using.

### 2. Turn an agency into software

> Pick one service business in [niche] and reverse-engineer the exact workflow they sell to clients. Break it into steps, tools used, inputs, outputs, human judgment points, and places where the work gets slow or expensive. Then design the simplest AI product that could replace the first version of that service and charge $500–$5,000/month.

### 3. Garage sale flipper

> Watch Facebook Marketplace and Craigslist in my city for [cameras / furniture / bikes] listed way under market, and text me the second one's mispriced with the link.

### 4. Create my 1 person company dashboard

> Look at my docs, notes, Stripe exports, analytics, customer calls, and project list, then build a weekly operator dashboard. I want to know what is making money, what is wasting time, what customers are asking for, what I should stop doing, and the three highest-leverage actions for next week. Be blunt and show your work.

### 5. Audit my company for agent opportunities

> Look at how this business works and find the tasks we should give to agents before hiring another person. For each task, estimate the current human time, the cost of mistakes, the tools involved, the difficulty of automating it, and the first safe version we could deploy. Prioritize things that save money or create revenue within 30 days.

### 6. Be my browser operator

> Use the browser to complete this workflow: [workflow]. As you go, click through the actual sites, collect the data, fill the forms where appropriate, and keep notes on what broke or slowed you down. When you're done, give me the output, the repeatable SOP, and the automation plan so this can become an agent.

### 7. The whole QA team

> Every night, open my app on a real phone, go through signup, checkout, and the main flows, and screenshot anything that's broken or confusing.

### 8. The competitor spy

> Sign up for my top 3 competitors, sit inside their product and their emails, and send me a monthly report on every new feature, price change, and thing they do better than us.

### 9. Make a game people would actually play for 5 minutes as a lead magnet

> Build a browser game around this mechanic: [mechanic]. Don't just make a cute demo; add progression, tension, scoring, failure, polish, and one reason someone would send it to a friend. Then add lead capture (email/sms), it needs to tie into my core product which sells XYZ.

The dollar range and 30-day outcome language above belong to the source. They are not validated Aksen prices or promises.

## The Aksen adaptation

The first version runs real AI analysis/drafting on demand. A prompt that says “browse,” “negotiate,” or “monitor” does not itself provide those capabilities. The current interface names each tool according to what it can actually do.

| Source | Aksen agent | Audience | Current useful output | Future connection, if justified |
| --- | --- | --- | --- | --- |
| 5 | Automation Opportunity Finder | Public + admin | Ranked workflow opportunities and a bounded pilot | Approved operational metrics and workflow integrations |
| 2 | Service-to-Product Planner | Public + admin | Workflow map and smallest useful product brief | Delivery/project tooling after a scope is agreed |
| 9 | Lead-Magnet Planner | Public + admin | Interaction concept, build brief and acceptance checks | An implemented game and optional, disclosed lead capture |
| 1 | Software & Cost Reviewer | Admin | Subscription review and supplier-message draft | Authorised billing exports and supplier access; no autonomous cancellation |
| 3 | Sourcing Opportunity Reviewer | Admin | Comparison of supplied listings with conditional economics | A permitted listings feed, reliable sold-price evidence and alerts |
| 4 | Weekly Founder Review | Admin | Weekly review and three actions; optional owned-project snapshot | Authorised cost, invoicing, time and analytics sources |
| 6 | Workflow Playbook Writer | Admin | SOP, exceptions and an automation specification | A controlled browser executor with approvals for consequential actions |
| 7 | Release QA Planner | Admin | Risk-ranked checks and review of supplied observations | Test accounts, a browser/device runner, evidence storage and a schedule |
| 8 | Competitor Evidence Reviewer | Admin | Dated comparison from supplied public/authorised material | Permitted public-page snapshots and a scheduled change report |

Public tools: `/business-agents`. All nine admin tools: `/admin/agent-desk`.

## Use them in the business this week

1. **Founder review:** describe the current week, distinguish cash received from invoiced amounts and add the optional project snapshot. Use its three priorities to organise the next human decisions. The snapshot includes at most 25 projects owned by the signed-in admin and is labelled as current, not historical financial evidence.
2. **Opportunity Finder:** use a redacted client workflow to identify one worthwhile implementation. This can lead into the existing Aksen assessment or a directly scoped quotation.
3. **Service-to-Product Planner:** map the parts of Aksen delivery that actually repeat. Validate whether customers need a separate product before building one.
4. **QA Planner:** turn the real enquiry and order flows into test cases. Run the tests separately and return observed failures for analysis; a generated test plan is not evidence of a passed release.
5. **Cost Reviewer:** review actual tool usage and renewals before changing subscriptions. Count founder review time and integration dependencies as costs too.

The other tools remain available for relevant work. Do not create a recurring monitor, outreach campaign or browser action simply because the source prompt suggests one.

## Commercial direction

Start by using the public tools to help a visitor define a useful problem, with an optional link to discuss implementation. Validate whether visitors produce qualified enquiries and whether paid delivery solves those problems.

Possible later models include a paid assessment with a reviewed output, implementation of a validated workflow, and an ongoing managed service with clear included work and provider usage. A separate agent subscription needs evidence of repeated use and willingness to pay. No new subscription, checkout or price was introduced here.

Measure provider cost per useful output, review time, repeat use, qualified enquiries and paid work. Do not equate the number of prompts or agent runs with customer value.

## Data and execution boundaries

- Public runs use only the visitor's supplied brief. The public endpoint rejects private agent IDs and project-snapshot requests.
- Admin endpoints require the established admin identity. Saved drafts and project queries are scoped to its owner ID.
- The optional project snapshot is selected explicitly and sent with the brief to the existing AI provider. It contains project names, clients, objectives, stages, health, next gates and update dates; it does not import banking or analytics.
- Briefs are bounded to 30–8,000 characters; request bodies have a byte limit. Runs use the existing atomic hourly allowance table: 20 shared public runs, or 20 runs per admin per hour.
- Admin outputs are saved as agent activity and can be reopened or downloaded. The public run log excludes the visitor brief and generated result; the browser holds the result until navigation/reload. The AI provider still receives the brief.
- These agents do not browse, send communications, negotiate, buy, cancel, change business records, schedule jobs, test a real device or build software. Their output is a draft for review.
- Source material is treated as untrusted evidence. Missing facts, comparison periods, costs and approvals must remain explicit unknowns.

## Messaging work carried forward

The agency now opens with “A better way to sell. A simpler way to work.” Supporting copy names websites, connected business systems and digital products. Services, About, Products, the enquiry flow and assistant introduction were clarified. The broad digital transformation identity and African business mission remain. The existing enquiry questionnaire remains in place; its copy now explains the steps and the optional submission accurately.

## Verification and motion refinement — 13 September 2026

- Production build and TypeScript check passed. Agent boundary/failure tests, existing support tests and reduced-motion/focus/observer tests passed.
- All nine checked public pages returned HTTP 200 with no empty decorative spans in their section labels: Home, Services, Products, Pricing, Approach, Industries, About, Blog and Business Agents.
- A real public Opportunity Finder request using a fictional furniture workshop returned HTTP 200 and a complete draft. It identified unknown baseline figures, proposed a bounded FAQ pilot and retained human review. Initial local failures were traced to network sandbox access; the configured database and provider worked outside that restriction.
- Admin authentication rejection was checked over HTTP. Owner-scoped history, snapshots and persistence were tested with database/provider mocks; authenticated private usage still needs an owner session check.
- Shared section reveals now use a short vertical entry without scaling, cancel on keyboard focus or reduced-motion changes, and preserve readable content when animations are unavailable. Article cards, supporting service/pricing sections and product invitations use the same reveal. Footer invitation and links use a single reveal system; existing desktop footer uncover behaviour remains.
- Decorative section-label dots and repeated sparkle icons were removed. Task icons distinguish drafts, interviews, search, email, media and demos. Page-intro arrows now distinguish same-page anchors from page navigation. Hover/focus and disclosure feedback is brief and restrained.
- No visual browser/device QA was performed for this pass. Targeted lint passed for the new agent/motion code. Three existing components changed only for icons retain 14 identical pre-existing lint diagnostics; type-aware lint's executable was unavailable, so standalone TypeScript and non-type-aware lint were run separately.
