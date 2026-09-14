# Scope: WhatsApp as the end of the funnel

Written 14 September 2026. Scope and constraints, not a commitment to build.
The argument for doing this at all is in `Social-Strategy-Foundations.md`
section 4: WhatsApp reaches 96.5% of Nigerian internet users and 93% of
Ghanaian ones, it is the commerce layer rather than a chat app, and our own
pitch is to meet customers where they already are.

## The timing that decides the order of work

Meta currently does not charge for service messages, meaning non-template
replies inside the 24 hour window that opens when a person messages us first.
**That changes on 1 October 2026**, when service and utility messages inside
that window become chargeable.

That is about two weeks from writing. It does not block anything, but it does
mean the cost model should be assumed to be "every message costs something"
rather than built around a free window that is about to close. Anything
designed to lean on free service messages would need reworking almost
immediately.

## What already exists

More than expected.

- `lead_interactions` already supports a `whatsapp` channel with inbound and
  outbound direction, a summary and what was shared. The logging half of this
  is built and in use.
- `opportunities` carries `source`, `channel` and `consent_status`, so
  provenance and permission have somewhere to live.
- The support and order demonstrations already model an agent answering from
  approved facts, asking for what is missing and handing off to a person. That
  is the conversation design, already written and reviewed.
- The enquiry pipeline, notification and audit trail all work.

## What does not exist

- **There is no WhatsApp link anywhere on the site.** Every mention of WhatsApp
  in the codebase is a demonstration using fictional businesses. Nothing points
  a real visitor at a real conversation.
- **`opportunities.email` is `NOT NULL`.** A lead arriving by WhatsApp may have
  a phone number and no email address, and there is currently nowhere to put
  them. This is the first real blocker and it is a schema change.
- No inbound webhook, no Meta app, no verified business number.

## Phase 0 — a link, not an integration

The smallest thing that is not a toy. A `wa.me` deep link on the site, opening
a conversation in whatever WhatsApp client the visitor already has, landing in
a WhatsApp Business app on a phone.

No Meta app, no API, no approval, no per-message cost, no webhook.

- Prefilled message text carrying the page it came from, which gives crude but
  real attribution with no tracking infrastructure.
- Placed as a secondary action beside the existing enquiry form rather than
  replacing it. Some buyers, particularly corporate and NGO, will still prefer
  email, and removing that option to make a point would cost real leads.
- Conversations logged by hand into `lead_interactions`, which already supports
  it.

**Effort: hours.** **Cost: nothing.** **Needs from you: the business number,
and a decision about publishing it.**

This is worth doing first regardless of whether the later phases ever happen,
because it tests the premise cheaply. If nobody uses the link, the rest of this
document is moot and we have lost an afternoon.

## Phase 1 — capture what arrives

Only worth doing once Phase 0 shows traffic.

- Make `opportunities.email` nullable, and require that at least one of email or
  phone is present. The constraint moves from "email exists" to "we can reach
  them somehow", which is the thing that was actually meant.
- Add `phone`, and extend `source` to distinguish a WhatsApp arrival.
- A quick-capture in the admin: paste a WhatsApp conversation, get a lead with
  the interaction already logged.

**Effort: a day or two.** **Risk: low, but it is a migration on a live table
holding real rows, so it needs the same care as the interactions migration.**

## Phase 2 — the agent answers first

This is where it becomes the product rather than a link.

Requirements, none of which are code:

- A Meta Business account with business verification.
- A phone number **not currently registered to a consumer WhatsApp account**.
  Migrating an existing number is possible but disruptive; a fresh line is
  cleaner.
- Display name approval, which Meta reviews and can refuse.
- Message templates approved in advance for anything we send first. Free-form
  replies only work inside the 24 hour window opened by the customer.

The code, in rough order of difficulty:

- A webhook endpoint. Cloudflare Workers handles this well, but it must verify
  `X-Hub-Signature-256` on every request and respond quickly, doing the real
  work after acknowledging. An unverified webhook is an open door to anyone who
  learns the URL.
- Reuse the support assistant's grounding: answer from approved facts, ask for
  what is missing, hand off to a person, never invent a price or a commitment.
  This already exists and is already careful about what it refuses to claim.
- Write every exchange into `lead_interactions` automatically, which is the
  point of the whole exercise.
- Spend control. The rate-limit pattern in `lib/rate-limit.ts` applies directly,
  and after 1 October every reply has a cost, so an unbounded loop is now a bill
  rather than an embarrassment.

**Effort: one to two weeks, most of it not code.** Verification and template
approval are calendar time controlled by Meta, not by us.

## Phase 3 — one inbox

Instagram and Facebook messaging alongside WhatsApp, in the admin, with the
same agent answering first. This is the monetisable product noted in
`Backend-As-Product-Observations.md`, and it should not be started until
Phase 2 has run long enough to know what the conversations actually look like.

## Risks worth stating plainly

- **Publishing a phone number is irreversible in practice.** It will receive
  spam, job applications and wrong numbers. Use a dedicated line, never a
  personal one.
- **An agent answering for us is answering as us.** The support assistant is
  already written to refuse commitments it cannot keep, which is why reusing it
  matters more than writing something new that is friendlier and looser.
- **Consent is not decoration.** WhatsApp has real opt-in rules, and a
  reply inside a conversation someone started is very different from us
  initiating. `consent_status` exists; it needs to be honestly maintained, not
  defaulted to `provided` because it is convenient.
- **Unqualified inbound has a cost.** Opening WhatsApp invites volume. A
  qualifying step will be needed sooner than feels necessary.
- **The 1 October change makes idle chat expensive.** Design for conversations
  that reach a conclusion, not for engagement.

## Recommendation

Do Phase 0 now, before 1 October, because it is hours of work, costs nothing,
and answers the only question that matters: will people actually use it. Hold
Phases 1 and 2 until it has.

The temptation is to build Phase 2 first because it is the interesting part.
That would mean a fortnight of verification and template approval for a channel
nobody has yet shown they want.

## Needed from the founder

- The business number, and agreement to publish it.
- Whether that is a dedicated line or an existing one.
- Who answers when the agent hands off, and how quickly.

## Sources

- [WhatsApp Business API pricing 2026](https://blueticks.co/blog/whatsapp-business-api-pricing-2026)
- [WhatsApp API pricing explained, Authgear](https://www.authgear.com/post/whatsapp-api-pricing/)
- [WhatsApp Business API per-message rates](https://setsmart.io/blog/whatsapp-business-api-pricing)
