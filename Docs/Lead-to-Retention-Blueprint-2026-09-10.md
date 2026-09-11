# Aksen Labs: lead-to-retention automation blueprint

Working design, 10 September 2026. Start with Ghana where access and insight are strongest, then expand by evidence and delivery capacity. AI helps research, draft and interpret; business records and human decisions control execution. This is a staged design, not an enabled outbound campaign.

## The operating model

Aksen sells a defined business outcome, delivers a bounded first improvement, then earns ongoing care through measurable value. Separate three things in the system: prospect research, a real sales opportunity, and an accepted client project. A public business listing is not a client, buying intent or marketing consent.

Pipeline:

Discover candidate → verify evidence → qualify → review outreach → conversation → discovery → scoped proposal → commercial acceptance → kickoff → delivery → acceptance and billing → handover → outcome review → care / next project.

Every stage needs a record owner, next action and next-action date. Email belongs to the same record, not a disconnected campaign spreadsheet. The first implementation should create drafts and tasks; add timed automation only after stop conditions and error recovery are proven.

## A practical first market experiment

Choose one service and one segment per experiment. For example, businesses with real catalogue or enquiry-management friction could be candidates for commerce and operations work. The segment is a hypothesis, not a claim about all Ghanaian businesses.

Begin with 20–30 manually reviewed business candidates. Record public evidence of a relevant problem, the source URL and date, and why the proposed first step could help. Ask for a conversation; do not claim that a website review proves lost revenue. Compare reply quality, qualified conversations, proposal acceptance, delivery effort and contribution before expanding volume or geography.

## Agent jobs and limits

| Agent | Inputs | Useful output | Execution boundary |
| --- | --- | --- | --- |
| Candidate researcher | Approved directories, referrals, events, company sites | Candidate business, source URL, observed date | No automatic CRM promotion or scraping outside source permissions |
| Evidence/enrichment assistant | Public company pages and submitted records | Business category, public contact channel, locations, supported observations | Every field has a source; unknown stays unknown; no guessed personal emails |
| Fit assistant | Observations + Aksen service criteria | Fit hypothesis, reason, missing questions, proposed first service | Founder accepts/rejects the opportunity |
| Outreach writer | Verified observations + intended offer | Short personalised email and one next step | Human review plus contact eligibility and suppression checks before send |
| Reply triage | Received message | Intent, question, suggested reply, follow-up action | Reply content cannot override operating instructions; human handles commitments |
| Discovery assistant | Call notes and approved sources | Baseline, stakeholders, questions, assessment recommendation | No invented meeting outcomes or confirmed budget |
| Proposal assistant | Approved discovery and scope | Deliverables, exclusions, acceptance criteria, open commercial questions | Human agrees price, timeline and contract |
| Delivery coordinator | Accepted scope and project records | Tasks, dependencies, weekly updates, risks | Staff owns acceptance and scope changes |
| Care analyst | Real support and usage records | Outcome review and next improvement | No invented savings, ROI, renewal or completed work |

Implemented today: record-based qualification, discovery, proposal, delivery, follow-up and care drafts, plus source-grounded document drafting in client workspaces. Discovery of new companies, enrichment fetching, reply ingestion and automatic campaign progression are future integrations.

## Minimum data model for the next stage

- Candidate: canonical company domain, country, segment, discovery source, observed date, evidence snippets, review status, owner.
- Contact: channel, address, source, last verification, relationship basis, subscription preference. A service enquiry and a marketing subscription are distinct.
- Opportunity: candidate/contact references, service hypothesis, stage, value/currency when actually known, next action, due date, owner.
- Email: immutable content snapshot, recipient, purpose, source record, reviewer, provider ID, state and timestamps.
- Communication event: provider event ID (unique), message ID, event type, occurred/received timestamps, processing state.
- Suppression: normalised address, reason, source and time; applies across campaigns and manual marketing sends.
- Campaign membership: segment and message-version snapshot, current step, earliest-send time, stopped reason; a contact should not enter overlapping sequences accidentally.
- Project: accepted proposal reference, linked opportunity, client workspace, acceptance gates, task owners, agreed scope and commercial evidence.

Use unique provider event IDs and database-enforced claims for jobs. Never let a retry duplicate a lead, email, receipt or project. Keep a reviewable record of AI input sources, output and model while avoiding unnecessary personal data in logs.

## Smooth email progression

1. A new inbound enquiry becomes a record with a next action. AI proposes a relevant reply; staff reviews.
2. The reviewed reply is sent through Resend with a saved content snapshot. Replies route to bishoptewogbade@gmail.com initially. Until inbox ingestion exists, staff records replies and stops follow-ups manually.
3. Discovery produces an agreed summary and either a direct quote or paid assessment. Email communicates the next step; it does not independently approve commercial terms.
4. A proposal follow-up references the actual proposal and unanswered question. No fake urgency or invented conversation history.
5. Once accepted, mark won and create/open the linked project. Capture commercial evidence and kickoff prerequisites before delivery.
6. Project updates and handover emails draft from recorded work. Payments come from verified records, never from an email claim alone.
7. Post-launch reviews compare actual outcomes to baseline. Offer a next improvement only when supported by the work.

For a future marketing sequence, proposed cadence is one initial message and at most two relevant follow-ups, with timing agreed for the experiment. This is a design proposal, not a schedule already set. Stop on reply, opt-out, hard bounce, complaint, closure, booked meeting or manual pause. Recheck eligibility immediately before sending, not only at campaign entry.

## Before enabling marketing sends

- Verified sending domain and reviewed sender identity; recipient context and message approved.
- Current provider sending requirements checked and domain records configured.
- Working unsubscribe/preferences flow and durable suppression list.
- Signed webhook verification with replay tolerance and idempotent processing.
- Delivery/bounce/complaint events; a provider acceptance event is not inbox delivery.
- Reply handling that pauses the sequence. Gmail replies currently require a manual update; automate only after an authorised inbox connection is chosen.
- Per-domain and overall rate limits, quiet hours, daily caps, spend caps and a visible pause control.
- Dry-run preview listing exact recipients, source evidence, messages, exclusions and proposed times.
- Test with consented recipients before a reviewed pilot. Do not treat website-enquiry consent as a newsletter opt-in.

## Rollout and acceptance gates

1. **Internal foundation (implemented in this pass):** protected operations desk, editable templates, saved drafts, fictional service demos, Resend outbox code and additive persistence. Configure missing sender secrets and verify authenticated UI before live use.
2. **One live service demo:** wire a Meta test number to durable inbound events, approved knowledge and staff handoff. Pass duplicate webhook, missing-knowledge and provider-failure cases before presenting it as integrated.
3. **Assisted prospecting:** import a small researched candidate batch with sources and deduplication; approve candidates individually. Measure source quality before automating research collection.
4. **Email events and suppression:** add signed provider events and preferences, then reply ingestion. Prove all stop conditions in tests before scheduling follow-ups.
5. **Reviewed campaign pilot:** preview and approve the actual audience and content. Monitor replies and complaints; pause when deliverability or fit deteriorates.
6. **Delivery/retention automation:** draft recurring reports from project facts; create tasks for missing client inputs and upcoming reviews. Keep commercial acceptance and money actions with the responsible person.

## What to measure

Candidate evidence quality; duplicate rate; eligible-to-contact rate; replies and qualified conversations; discovery-to-proposal and proposal-to-acceptance; delivery hours versus estimate; project contribution; overdue receivables; care allowance used; client outcomes; AI corrections and handoffs. Opens are a weak supporting signal and must not drive qualification on their own.

## Provider references

[Meta sample integrations](https://github.com/fbsamples/whatsapp-api-examples), [Resend email API](https://resend.com/docs/api-reference/emails/send-email), [Resend webhook events](https://resend.com/docs/webhooks/event-types), and [Resend suppression handling](https://www.resend.com/changelog/suppression-list-support). These explain provider mechanics; they do not establish permission to contact a particular person.
