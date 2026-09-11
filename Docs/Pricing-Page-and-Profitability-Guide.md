# Pricing page and profitability guide

Recorded 2026-09-10. Two parts: a review of the four services as things the site can render and sell, and an operating guide for turning the published pricing into a profitable business. Historical figures come from the September 4 launch strategy, the Services & Pricing Guide and the decision ledger. The September 10 website revision below supersedes earlier public-pricing recommendations; financial scenarios remain illustrative. Nothing here is a validated market price or a commitment to a client.

## Part 1 — Do the four services make sense to render?

`lib/agency-content.ts` defines four services, rendered on the homepage (`ServiceList`) and `/solutions`. They match D-002 and the September 7 positioning, and they are grouped the way an owner-led business recognises its own problems rather than by technology. As a public taxonomy they hold up.

| Service | Renders as | Verdict |
| --- | --- | --- |
| `commerce` — Customer experience & commerce | Homepage list, /solutions, /pricing | Sound. Clearest buying trigger and the only one with a genuine entry price. |
| `operations` — Business systems & operations | Homepage list, /solutions, /pricing | Sound and the highest-margin area, but the hardest to scope from a website. |
| `insight` — Data & business insight | Homepage list, /solutions, /pricing | Sound as a capability. Rarely a first purchase; depends on the other two existing first. |
| `products` — Digital products & new services | Homepage list, /solutions, /pricing | Sound but the riskiest to sell. Fixed price on a new product is where agencies lose money. |

### Problems found in the current data

1. **Dead fields.** `description`, `buyerExplanation`, `question`, `deliverable` and `exampleScope` are defined on `ServiceItem` and populated for all four services, but nothing renders them. Only `id`, `number`, `title`, `short`, `capabilities` and `image` reach a page. That is five unused fields per service carrying copy nobody has reviewed against current messaging.
2. **`buyerExplanation` duplicates `short`.** For all four services it is `short` minus the full stop. One of them should go.
3. **`image` is set but unused by the service pages.** Each service names a PNG (all four exist in `public/`), yet `/solutions` renders no service imagery — it passes a separate hero image to `PageIntro`.
4. **No price anchor existed until now.** Four capability areas with no figures gave a visitor no way to self-qualify. That is what the new `/pricing` page fixes.

### Recommendation

Keep the four services exactly as they are publicly. Separately, either render the unused fields or delete them — `question` and `deliverable` in particular are good sales copy currently invisible. I have not touched them in this change.

## Part 2 — Turning this into a profitable business

### The core mechanic

Three stages, which is how `/pricing` is now structured:

- **Assess** (GHS 2,500 fixed) — sells a diagnosis, not a build. Its job is to convert curiosity into paid work and to stop you quoting blind.
- **Build** (from GHS 6,500) — the revenue event. Fixed quotation *after* the assessment, never before.
- **Operate** (from GHS 900/mo) — the compounding part. This is what makes the business worth owning.

Implementation revenue pays this month's bills. Care revenue is the asset. Per D-012, charge for operating work rather than seats.

### Know your cost floor before you quote

Use a placeholder loaded delivery cost of **GHS 120/hour** until real timesheets exist. Founder time is a cost even when no salary is drawn.

Cost floor = estimated delivery cost / (1 − target contribution margin)

At a 50% target: a build estimated at 36 hours costs GHS 4,320 plus incidentals, so the floor is roughly **GHS 9,240**. This is why a GHS 9,000 pilot is a deliberate validation price slightly below target, not a sustainable list price. Quote GHS 9,500+ for the same estimate once you are past validation.

| Scenario | Estimated cost | Contribution |
| --- | --- | --- |
| GHS 9,000 build, controlled scope, 36h | GHS 4,620 | GHS 4,380 / 48.7% |
| Same build with rework, 60h | GHS 7,500 | GHS 1,500 / 16.7% |
| GHS 3,000/mo care, 8h | GHS 1,260 | GHS 1,740 / 58.0% |
| Same care, heavy support, 20h | GHS 2,700 | GHS 300 / 10.0% |

**The single most important line above:** rework destroys roughly two thirds of project contribution, and unbounded support destroys five sixths of care contribution. Profitability is a scope-control problem far more than a pricing problem.

### The five disciplines that decide whether this is profitable

1. **Scope before quoting.** Use a separate paid assessment when the workflow is unclear or complex. A clear, straightforward brief can proceed directly to a quotation. Declining an assessment is not evidence that a prospect will reject scope boundaries.
2. **Agree review limits before starting.** The proposal specifies review rounds and the written change process; the website does not promise a universal number.
3. **Separate third-party usage from your fee.** Model, WhatsApp, voice, storage and hosting costs must sit outside the price or inside an approved allowance with cost alerts. Otherwise a usage spike silently converts a profitable project into a loss.
4. **Log every delivery hour from the first project.** Without this, the GHS 120/hour figure never becomes real and every quote stays a guess.
5. **Decline work below the floor.** Reduce scope instead of price. A GHS 6,500 campaign site delivered as a GHS 18,000 business website is the most common way a small agency fails while looking busy.

### Qualify on payback, not enthusiasm

Monthly gross benefit minus care and usage cost must be positive, and simple payback should clear a screening target of roughly six months. A GHS 12,000 build producing GHS 5,000/month of verified benefit, against GHS 3,000 care and GHS 500 usage, pays back in eight months — that deal should be reshaped or declined. Illustrates the method only; the benefit figure must come from the client's own numbers.

### Illustrative first-year shapes (not forecasts)

| Scenario | Builds delivered | Active care months | Year-end care clients | Fee revenue | Exit MRR |
| --- | --- | --- | --- | --- | --- |
| Cautious | 4 × GHS 9,000 | 18 × GHS 2,500 | 3 | GHS 81,000 | GHS 7,500 |
| Working case | 8 × GHS 12,000 | 36 × GHS 3,000 | 6 | GHS 204,000 | GHS 18,000 |
| Expansion | 12 × GHS 18,000 | 60 × GHS 4,000 | 10 | GHS 456,000 | GHS 40,000 |

**Capacity is the binding constraint, not demand.** The working case needs about 648 delivery hours (8 × 45h builds + 36 × 8h care months). At 25 hours/week over 46 weeks with 35% reserved for sales and admin, roughly 747 hours remain — about 100 hours of buffer, and peak months can still break it. At 15 hours/week the working case does not fit at all. The expansion case needs about 1,320 hours and requires trained help, lower measured effort, or slower growth.

Revenue is not profit. Subtract founder sales time, overhead and tax before deciding to hire.

### Sequence

One useful workflow → repeat it for similar businesses → maintain it profitably → add adjacent workflows → productize what recurs. Expansion beyond Ghana should follow demand and delivery readiness.

**Day-90 decision:** expand only if the work produced accepted outcomes, contribution held after logged hours, and at least one buyer pays for ongoing care. If not, revise the segment, the scope or the service model. A one-off implementation business is still valid if recurring care is not yet justified.

### Competitive context

Publicly advertised Ghana comparators, checked 4 September 2026: Coriable lists website chatbots at GHS 8,000–18,000, WhatsApp assistants at GHS 15,000–40,000 and workflow automation at GHS 20,000–120,000. AutomateGhana's Kasabot is GHS 800–1,500/month with no setup fee. BVM Digital advertises an audit at GHS 1,500 and full-stack work at GHS 12,000–25,000 — treat this as founder-associated pricing context, not independent validation.

The published `/pricing` figures sit inside these bands. These are vendor offers, not evidence of willingness to pay. Quote by defined work and your own economics.

### Before this page goes public

- [ ] Replace contact placeholders and confirm the Aksen Labs name, domain and registry position (D-001 is still `Testing`).
- [x] September 10 implementation uses GHS 4,000–18,000/month as the public managed-operations range. The GHS 3,000 figures above remain historical modelling assumptions, not current public pricing.
- [x] Website states fees exclude applicable taxes; quotations must itemise the actual treatment without assuming a tax rate.
- [ ] Do not use The Frame Shop as public proof; acceptance and delivery remain unconfirmed.


## Website revision — 10 September 2026

Implemented following the request to resolve the pricing review. Existing service ranges are indicative planning budgets; final commercial terms belong in the written quotation. Managed operations now starts at GHS 4,000/month, replacing the historical test floor of GHS 3,000/month.

Assessment: GHS 2,500 for one agreed process, separately commissioned and additional to the build. No automatic credit; any negotiated credit is explicit in the proposal. Clients may stop after assessment. Clear straightforward briefs can be quoted without a paid assessment.

Payment milestones, review rounds, acceptance criteria and defect-support periods are proposal-specific. Care proposals define hours/tasks, support channels, coverage hours, response targets, rollover and extra-work rates. No unlimited development or implied 24/7 coverage. Delivery ranges begin at agreed kickoff with sign-off, required content/access/data and agreed initial payment in place; dependency delays and scope changes can move dates.

The pricing page now has its own quotation-inspired hero, collapsible service groups, individual package and care-plan enquiry links, and a compact FAQ. The server validates the package against the pricing catalogue and saves its name and indicative price in the enquiry summary; arbitrary URL or payload labels are not accepted as catalogue selections. Visitors can remove the selection before submitting. No subscription pricing is implied for Folio or Workspace.
