# The queue

Pre-decided work, so no morning is spent choosing. `/today` takes the top unticked item from each lane. `/weekly` refills to at least five per lane and splits anything carried three days running.

**Current phase: 0, close the loop.** BUILD items come only from Phase 0. Phase 1 build work is listed below the line and is not available yet.

Everything here fits in 25 minutes. Anything that does not is a project and gets split.

---

## SELL

Always first. Never optional.

- [ ] **S-01** Send the TFS alignment message (≈15m). Drafted since 11 September in `Docs/TFS-Client-Alignment-Draft-2026-09-11.md`, never sent. Read it, fix the mojibake, put the client's name in, send it. This is the cheapest blocked revenue in the business.
- [ ] **S-02** Message Ope about the three Lagos decor brands (≈10m). One WhatsApp number, no website, exactly the core offer. Ask for a twenty-minute call, do not pitch in the message.
- [ ] **S-03** Message the Efe Organics founder (≈10m). No owned channel, all sales through a reseller. Ask what happens when a customer messages her directly.
- [ ] **S-04** Write the twenty-minute diagnostic script (≈20m). The five Friend's Guide questions, asked before explaining anything. Save to `Docs/Owner-Conversations.md`.
- [ ] **S-05** Write the one-page assessment offer note (≈25m). GHS 2,500, one process, what they get, what it does not include. R-001 cannot be sold without it.
- [ ] **S-06** List ten Accra businesses that sell over WhatsApp with no order system (≈20m). Owner-led retail or made-to-order. Lead Scout exists for this.
- [ ] **S-07** List ten more (≈20m)
- [ ] **S-08** Book one conversation from the list (≈15m)
- [ ] **S-09** Hold one conversation (≈25m). Ask before explaining, record it the same day
- [ ] **S-10** Add the pricing question to the script (≈10m). *"GHS 10,000 once plus GHS 4,000 a month, or GHS 1,200 a month with nothing today: which, and why?"* This answers R-005, which changes R-002.

## BUILD: Phase 0 only

Exit test: submit an enquiry from a phone, on mobile data, as a stranger. A notification arrives. A reply is sent. Both visible in the pipeline.

**The code is finished. What is left is configuration and a deployment.** The 12 September review found the loop missing and it was built afterwards; the queue said otherwise for a day because it was written from the review rather than from the code. Checked against the source on 15 September.

- [ ] **B-13** Put `RESEND_API_KEY` and `RESEND_FROM_EMAIL` in `.env` (≈10m). **This is the whole blocker.** Every message queues correctly and nothing can leave without them. `node scripts/check-intake.mjs` says so out loud.
- [ ] **B-14** Verify a sending domain in Resend (≈20m). Until then the shared sandbox sender delivers only to the account owner, so the founder notice works and the visitor's acknowledgement is deliberately withheld rather than promised and lost.
- [ ] **B-15** Set `AUTOMATION_TICK_URL` and `AUTOMATION_SECRET` as GitHub secrets (≈10m). The heartbeat drains the outbox every ten minutes and calls nothing without them.
- [ ] **B-09** Make direct contact the primary path (≈25m). Name, reply address, one free-text box. The guided mapper becomes optional help rather than the gate
- [ ] **B-10** Deploy the current build to the hosted release (≈25m). The registered site was at version 2, last updated 3 September, owner-restricted
- [ ] **B-11** Open the audience and check as a stranger on mobile data (≈15m). Not on the dev machine, not signed in
- [ ] **B-12** Run the exit test and record the result (≈20m)

## COMPOUND

- [ ] **C-01** Create `Docs/Owner-Conversations.md` with a per-conversation template (≈15m). Date, business, what they sell, their words for the problem, what they use now, who decides, what they said about price
- [ ] **C-02** Start the delivery hours log (≈10m). One file, date / task / minutes. The GHS 120/hour floor is a guess until this has real rows in it, and every quote is a guess with it
- [ ] **C-03** Give CV Forge a URL (≈25m). `2ndGenCVInsight`, already carries a `vercel.json`. Park it live, then leave it alone per R-010
- [ ] **C-04** Write one public build note (≈25m). Why a customer's claim to have paid is kept separate from a verified payment. Shows judgement without claiming a customer
- [ ] **C-05** Record this week's two numbers (≈5m). Conversations with owners, cedis invoiced
- [ ] **C-06** Write down the hours actually available per week (≈10m). The pricing guide's arithmetic says the working case does not fit at fifteen. Plan against the real number
- [ ] **C-07** Add the three homepage screenshots to the capture routine after any redesign (≈10m). `cd video && node scripts/capture-site.mjs`

---

## Not available yet

Parked here so they are not forgotten and not started. These unlock when Phase 0's exit test passes.

**Phase 1 build work**
- A follow-up sequence from a captured address to the assessment offer (R-003)
- Fill the pipeline with the forty-business list
- A delivery panel in the admin showing queued, failed and abandoned messages. `outboxHealth()` in `lib/outbox.ts` already returns it; until there is a screen, `node scripts/check-intake.mjs` answers the same question

**Phase 3 and later**
- Delivery hours reporting in the admin
- Anything in `Docs/Revenue-Ledger.md` marked Parked

---

## Done

Ticked items move here at the weekly review, newest first, with the date. A record of what was actually finished is the only honest answer to "has this week been productive".

- 2026-09-15: **B-01 to B-08 verified already built.** Founder notification, visitor acknowledgement, per-visitor and hourly rate limits, 8KB body cap, privacy page and the footer separator were all done before the queue was written. Checked against the source, not the review.
- 2026-09-15: **B-05 done properly.** `intake_key` on `opportunities` with a partial unique index, so a retried submission returns the lead it already made instead of a duplicate. Tested: same id, `duplicate: true`.
- 2026-09-15: **Durable outbox.** `message_outbox`, `lib/outbox.ts`, migration and `scripts/migrate-outbox.mjs`. Messages queue during the request and the heartbeat delivers them with backoff over about thirteen hours, then abandons. A provider outage no longer loses an enquiry.
- 2026-09-15: **One intake for every source.** `lib/lead-intake.ts`. The enquiry form and the free tools now capture, audit, own and notify identically, tagged by `source`.
- 2026-09-15: **The pipe, and the button.** `POST /api/lead-capture` plus "Send this to yourself" under every free agent draft, shown only after the draft is on screen. It sends them the actual draft, not a generic acknowledgement, and the confirmation wording follows whether delivery can really happen. Tested end to end in the browser: 201, lead tagged `business_agent`, two messages queued, rate limit refused the sixth attempt. Test data cleaned up.
- 2026-09-15: Heartbeat moved from hourly to every ten minutes, so an acknowledgement is not an hour behind the enquiry.
- 2026-09-15: `scripts/check-intake.mjs`, one read-only command that answers whether the loop is working and whether anything is stuck.
- 2026-09-15: `video/scripts/assets.mjs`, the generated assets and what they cost, read back from the manifest. Total spend to date: $0.80.
- 2026-09-15: Homepage rebuilt as one nine-section argument; hero headline fixed; admin captures taken and screened for client data
- 2026-09-15: `Docs/Aksen-Operating-Brief.md` and root `CLAUDE.md` written
- 2026-09-15: This system
