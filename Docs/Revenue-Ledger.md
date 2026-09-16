# Revenue ledger

Every way this business could actually make money, as a pipeline. Stages and rules are in `Docs/Business-OS.md`.

**Standing rule: at most two items in Testing at once.** Currently **1**.

| Stage | Count |
| --- | --- |
| Earning | 0 |
| Testing | 1 |
| Sized | 4 |
| Noticed | 3 |
| Parked | 2 |
| Killed | 1 |

*Last reviewed 15 September 2026.*

**The pricing principle, since it now applies to more than one item.** Price the entry low enough that nobody needs a meeting to say yes, and put the margin in what costs us nothing to repeat. A first cut at GHS 450 and a recut at GHS 150 is not a discount ladder; it is charging for the thing that is genuinely expensive once, then charging again for a command. Any mechanism where the second unit costs us the same as the first should be priced the normal way instead.

---

## Testing

### R-006 · Warm network conversion
**Thesis.** The first paying customer comes from someone who already knows the founder, not from the website.

**Mechanism.** A named contact pays for an assessment or a bounded build. One-off, GHS 2,500 to GHS 15,000, with care quoted after.

**Live names.** The Frame Shop (implementation started, alignment message *drafted and unsent*). Ope's Lagos group: three decor brands, one WhatsApp number, no website, the closest match to the core offer anywhere in the pipeline. Efe Organics: no owned channel, sells entirely through a reseller.

**For.** Three real businesses with the exact problem the offer addresses. No acquisition cost. TFS already has work in progress.

**Against.** Warm contacts are the worst possible test of whether the offer sells, because they buy the person. Zero of the three have agreed a price. TFS started implementation before alignment, which is the position with the least negotiating room available.

**Cost to test.** Hours only.

**Exit criterion.** One of the three pays an invoice by **13 October 2026**. Not agrees, not signs. Pays.

**Next action.** Send the TFS alignment message. It has been written since 11 September and sitting unsent, which is the cheapest blocked revenue in the business.

---

## Sized

### R-001 · Standalone paid assessment
**Thesis.** The fastest route to the first cedi is selling a diagnosis, because it requires nothing to be built first.

**Mechanism.** An owner pays **GHS 2,500** for one agreed process: mapped, where it stalls identified, the smallest worthwhile fix recommended. One-off, repeatable, delivered in roughly four to six hours. Additional to any build and never automatically credited.

**For.** Priced and published. The operating templates already contain discovery and qualification. It converts curiosity into paid work and stops us quoting blind. Contribution is high because delivery is analysis, not engineering.

**Against.** GHS 2,500 is a real decision for a small Ghanaian retailer with no prior relationship. Competitor BVM advertises an audit at GHS 1,500, which sets an anchor below ours.

**Cost to test.** Zero cedis. Roughly two hours to prepare the offer note and the delivery template.

**Fastest test.** Offer it to every qualified conversation in Phase 1. Precede it with a free twenty-minute diagnostic call ("bring me one process that annoys you") and convert on the call.

**Exit criterion.** Three assessments invoiced and collected by **10 November 2026**.

**Next action.** Write the one-page assessment offer note: what they get, what it costs, what it does not include.

---

### R-002 · WhatsApp order agent, build and care
**Thesis.** The core offer. The story the whole site and the launch film now tell.

**Mechanism.** Build from **GHS 9,240** (the 50% floor on a 36-hour estimate), quoted only after an assessment. Then managed operations at **GHS 4,000–18,000/month**. The build pays this month's bills; the care is the asset.

**For.** Recognisable problem, concrete demonstration, working boundaries. Mobile-money merchant payments grew 42% to $155bn globally in 2025, which supports connecting payments to the work around orders.

**Against.** No one has paid for it. Delivery hours are unmeasured, so the floor is a guess. Rework destroys roughly two thirds of contribution and there is no delivered project to calibrate against. Competitor pricing for WhatsApp assistants runs GHS 15,000–40,000, which is above us, but see **R-005**.

**Cost to test.** One delivery. Roughly 36–45 hours plus provider costs.

**Exit criterion.** One build accepted against written criteria, invoice paid, hours logged, actual contribution at or above 45%.

**Next action.** Nothing until R-001 produces a paying assessment. Quoting a build before an assessment is the failure this ladder exists to prevent.

---

### R-003 · Free tools to paid assessment
**Thesis.** There is a funnel on the site with no pipe attached to it. Someone runs a business agent, receives a genuinely useful draft, and disappears without leaving a trace.

**Mechanism.** Indirect. Capture an address at the point the draft is delivered, follow up with the assessment offer. Revenue arrives through R-001.

**For.** The tools work, are free, need no account, and produce something worth having. Whoever ran one has already described their own business in writing, which makes them the best-qualified prospect the site can produce. It is the cheapest high-return fix available anywhere in this list.

**Against.** No traffic yet, so a perfect funnel converts nothing. Asking for an address at the wrong moment removes the "no account, nothing to hand over" claim that makes the tools worth running at all.

**Cost to test.** Roughly four hours. Zero cedis.

**Fastest test.** Offer the capture *after* the draft is shown, never before, and frame it as "send this to yourself".

**Exit criterion.** Ten addresses captured and five follow-ups sent, from whatever traffic exists, by **10 November 2026**.

**Built 15 September.** "Send this to yourself" appears under every free agent draft, after the draft is on screen and never before. It sends them the draft itself, captures the brief they wrote as a lead tagged `business_agent`, and queues the founder a copy of what they said about their business. The mechanism is live and untested by real traffic.

**Next action.** Nothing to build. This now needs two things that are not code: delivery configured, and somebody to visit. The follow-up sequence from a captured address to the assessment offer is Phase 1 work and is not written yet.

---

### R-007 · Video production from code
*Moved Noticed → Sized, 15 September 2026, on the founder's instruction to price it cheap now and scale it. The Phase 4 caution below still stands and is his to overrule, which he has.*

**Thesis.** Cheap to start, and the things that cost us nothing are the things a customer values most. That is not a discount, it is a different cost structure.

**The number that decides it.** Every generated asset behind the three-format launch film cost **$0.80 in total, about GHS 10**, once. Measured, not estimated: the pipeline writes `costUsd` per asset and `node scripts/assets.mjs` reads it back. A second format, a different hook, another language or a seasonal recut reuses all of it and costs **one command**.

An editor's second cut costs them another day, so they must charge for it. Ours does not. That gap is the entire business.

**Mechanism.** A ladder that starts low enough to be an impulse and climbs on volume, not on scope.

| Tier | Price | What they get | Our direct cost |
| --- | --- | --- | --- |
| **One cut** | GHS 450 | A single vertical film from their own words, in one format | ~GHS 10 of generation, plus our time |
| **The set** | GHS 900 | The same film in vertical, square and wide | ~GHS 10. The extra two are re-renders |
| **Four a month** | GHS 1,800/mo | One cut a week, each in all three formats | ~GHS 40/mo |
| **Recut** | GHS 150 | A new hook, a new language, a seasonal edit, on an existing film | ~GHS 0 |
| **Included** |, | A monthly allowance folded into managed operations (R-002) | ~GHS 0 |

**Where the intelligence is.** The upsell is the part with no marginal cost. A shop that buys one cut at GHS 450 discovers the second format is GHS 150 rather than another GHS 450, and takes it, and the recut before Christmas, and the Twi version. Every one of those is a re-render at ~100% margin. The entry price is low enough to say yes to without a meeting; the margin arrives afterwards and keeps arriving.

**For.** Built, and it has already produced three formats of a real film. Marketing video is a budget line businesses already have. GHS 450 is below the threshold where a Ghanaian SME needs to think about it, and is still roughly 40x the direct cost.

**Against.** Different buyer and different sales motion from the core offer, so it dilutes the one-campaign rule. **The Remotion free licence stops at three people**, which is free at one person and a licensing cost the day this needs a team. Founder time, not generation cost, is the real constraint: at GHS 450 a cut, this only works if a cut takes under two hours, and the first one for a new client will not.

**Cost to test.** Roughly three hours to template one shop-shaped film and write the offer. Generation for the first customer, about GHS 10.

**Fastest test.** Make one cut for a business already in R-006 for free, unasked, from their own WhatsApp copy. Send it. Charge for the second format.

**Exit criterion.** Two businesses pay for a cut, and at least one of them buys a recut or a second format, by **15 December 2026**. The second half is the real test: if nobody upgrades, this is a GHS 450 job and not a business.

**Next action.** Do not build the template until R-001 has produced a paying assessment. This is an upsell to a customer, and there is no customer yet.

---

## Noticed

### R-004 · Care on websites we did not build
**Thesis.** The fastest recurring revenue in this business does not require winning a build first.

**Mechanism.** **GHS 900/month** website care for small Ghanaian businesses whose site was built by someone who has since vanished. Updates, backups, uptime, small changes. Roughly 3–5 hours a month against a GHS 120/hour cost, so contribution holds above 50% if scope is controlled.

**For.** Recurring from month one. No build risk, no scoping risk, no bespoke engineering. Enormous supply: almost every SME site in Accra is unmaintained. It is a standing reason to be in a business owner's phone every month, which is where the build conversations come from. Published price already exists.

**Against.** Low ticket. Unbounded support destroys five sixths of care contribution, and inherited sites are exactly where unbounded support lives: you did not build it, so you do not know what is in it. Requires a hard "here is what care does not include".

**To size it.** Write the inclusion and exclusion list, and a triage rule for inherited codebases we refuse to take on.

---

### R-005 · Low-tier productised agent
**Thesis.** Our pricing may be structurally unsellable to the bottom of the market, and that is worth knowing before Phase 2 rather than after.

**Mechanism.** A fixed monthly price with no setup fee, on a template rather than a bespoke build. Competitor benchmark: AutomateGhana's Kasabot at **GHS 800–1,500/month, no setup**.

**For.** A GHS 9,240 setup plus GHS 4,000/month is a different universe to GHS 1,000/month with nothing down. If owners are choosing on the monthly and ignoring the setup, our ladder loses every deal it enters and the assessment conversation never happens. A low tier is both a competitive answer and a cheap way to fill the pipeline.

**Against.** Templated delivery at GHS 1,000/month is a volume business, and volume needs staff we do not have. It undercuts R-002 directly. Capacity is already the binding constraint, and this is the mechanism most likely to consume it at the lowest margin.

**This is a strategic risk noted as an opportunity.** Do not build the tier. Use Phase 1 conversations to find out whether owners price on setup or on monthly. That answer changes R-002.

**To size it.** Add one question to the Phase 1 script: *"If two people offered you this, one at GHS 10,000 once and GHS 4,000 a month, one at GHS 1,200 a month with nothing to pay today, which would you pick and why?"*

---

### R-008 · Assessment findings as a paid written report
**Thesis.** The assessment already produces a document. A document is a product.

**Mechanism.** The same GHS 2,500 diagnosis delivered as a written report with no meeting, for owners who will not book a call. Lower delivery cost, wider reach, asynchronous.

**For.** Removes the calendar as an obstacle. Scales past the founder's hours, which is the binding constraint. The agent desk already drafts qualification and discovery from records.

**Against.** A report nobody discusses is a report nobody acts on, and an unactioned assessment produces no build. The meeting is where the build gets sold.

**To size it.** After three assessments have been delivered the normal way and there is something real to templatise.

---

## Parked

### R-009 · The workspace as a product
Phase 6 of the roadmap. Already tenant-shaped: every admin query filters on `owner_id`, rate limits are keyed per owner, usage is counted in the database. Evidence accumulates in `Docs/Backend-As-Product-Observations.md`.

**Parked until:** Phase 5 passes. Until an agency has been run profitably on it, it is a CRM with no customers, and there is no shortage of those.

**Reconsider:** 1 March 2027, or earlier if a client asks to buy the workspace they were shown.

---

### R-010 · CV Forge
Built, working, used by us, no public address. Jobseeker buyer, not the business-owner buyer, so every hour spent selling it is an hour not spent on the campaign.

**Parked until:** Phase 4 passes. Give it a URL, because it is built and parking it live costs nothing, then leave it alone. No marketing, no launch, no landing page.

**Reconsider:** when the agency has a paid case study, or if it starts acquiring users on its own without being pushed.

---

## Killed

### R-011 · Charging for the business agents
**Killed 15 September 2026.** The three free agents are the only thing on the site a stranger can use without trusting us first, and "free, no account, nothing to hand over" is the entire reason anyone tries them. Charging would collect trivial revenue and destroy the top of the funnel that R-003 depends on.

**Would only reopen if:** the tools are costing more in model spend than the pipeline they produce is worth, measured, not assumed.
