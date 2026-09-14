# Aksen Decision Ledger

This is the single source of truth for decisions made while building Aksen. It exists to stop good ideas from becoming forgotten conversations and to make changes deliberate rather than accidental.

## Status guide

- **Proposed**: A strong recommendation that still needs founder approval.
- **Accepted**: The current direction. Product and commercial work should follow it.
- **Testing**: A decision being validated with customers or market evidence.
- **Superseded**: Replaced by a newer decision. Keep it for context; do not delete it.

## How decisions are made

Every meaningful choice should answer:

1. What customer or business problem are we solving?
2. What is the smallest useful version?
3. What evidence supports this direction?
4. What are we choosing not to do?
5. What would make us revisit the decision?

## Current decisions

### D-001 — Company name

- **Date:** 2026-09-03
- **Status:** Testing
- **Decision:** Use **Aksen Labs** as the working company name.
- **Why:** It is short, ownable in tone, and broad enough to hold products, implementation services, and research.
- **Implication:** Continue using the name in prototypes, but complete naming, domain, and trademark checks before a major public launch.
- **Revisit when:** Customer interviews reveal confusion or a legal/domain conflict appears.

### D-002 — Company category

- **Date:** 2026-09-03
- **Status:** Accepted
- **Decision:** Aksen designs and operates AI-powered workflows for growing businesses, beginning with customer-facing and operational work.
- **Why:** Customers buy faster responses, fewer missed opportunities, and completed work—not “multi-agent architecture.”
- **Implication:** Lead with business outcomes. Explain the technology only after the value is understood.
- **Revisit when:** A repeatable product category becomes clearer from paid deployments.

### D-003 — ServiceNow inspiration boundary

- **Date:** 2026-09-03
- **Status:** Accepted
- **Decision:** Borrow ServiceNow's platform mechanics, editorial clarity, evidence-led pages, and expansion model without copying its page structure, exact visual assets, copy, or brand expression.
- **Why:** The useful advantage is the reasoning behind the experience, not a surface-level clone. A direct imitation would weaken differentiation and create brand and intellectual-property risk.
- **Implication:** Build an original Aksen design system using calm editorial layouts, black and white foundations, and signal green as an accent.
- **Revisit when:** The founder approves the new messaging and art direction.

### D-004 — Core data platform

- **Date:** 2026-09-03
- **Status:** Accepted
- **Decision:** Use Neon PostgreSQL as Aksen's system of record, with pgvector where semantic retrieval is genuinely useful.
- **Why:** PostgreSQL gives us durable relational records and a credible path to retrieval without introducing a separate database too early.
- **Implication:** Core business objects and agent activity must be auditable in PostgreSQL.
- **Revisit when:** Scale, compliance, or workload evidence requires a different component.

### D-005 — Administration and access

- **Date:** 2026-09-03
- **Status:** Accepted
- **Decision:** Start with a founder-controlled administration workspace and role-based access for future collaborators.
- **Why:** The internal operating system will contain sensitive prospect, client, project, content, and agent data.
- **Implication:** Public visitors and authenticated operators remain clearly separated.
- **Revisit when:** The first client or employee needs scoped access.

### D-006 — Initial market wedge

- **Date:** 2026-09-03
- **Status:** Accepted
- **Decision:** Validate Aksen through property and service-business workflows during the first 90 days.
- **Why:** Aksen already has a relevant property demonstration and a concrete set of customer-support, qualification, booking, and follow-up workflows.
- **Implication:** Do not build equally deep products for every industry at launch.
- **Revisit when:** Three paid pilots point to a stronger repeatable wedge.

### D-007 — Content governance

- **Date:** 2026-09-03
- **Status:** Accepted
- **Decision:** AI may research and draft content; the founder approves publication.
- **Why:** Automation should increase output without outsourcing judgment or reputation.
- **Implication:** The content workflow requires draft, review, approval, publication, and measurement states.
- **Revisit when:** Editorial roles expand.

### D-008 — Lead enrichment boundary

- **Date:** 2026-09-03
- **Status:** Accepted
- **Decision:** Enrich company and domain information automatically; use personal contact data only when intentionally provided or legitimately sourced for the workflow.
- **Why:** This balances sales usefulness with trust, accuracy, and responsible data handling.
- **Implication:** Store sources and confidence for enriched fields.
- **Revisit when:** A formal data-protection and outbound-sales policy is approved.

### D-009 — Product sequence

- **Date:** 2026-09-03
- **Status:** Accepted
- **Decision:** Build the internal Aksen operating system before a generalized client portal.
- **Why:** Running Aksen on its own product exposes real workflow needs and creates credible evidence before productizing access for others.
- **Implication:** Internal lead, project, content, support, and agent operations come before broad self-service features.
- **Revisit when:** A paying client needs shared visibility.

### D-010 — “ServiceNow for Africa” positioning

- **Date:** 2026-09-03
- **Status:** Accepted
- **Decision:** Use **“ServiceNow mechanics, made accessible and locally relevant for African businesses”** as an internal strategic shorthand—not the primary public headline.
- **Why:** A public “ServiceNow for Africa” claim implies enterprise breadth and maturity that Aksen has not yet earned, invites feature-by-feature comparison, and makes the offer sound more technical.
- **Implication:** The public promise stays concrete: Aksen helps customer requests and business work move from message to completed action.
- **Revisit when:** Aksen has several connected workflow products and credible customer proof.

### D-011 — Shared primitives and industry packs

- **Date:** 2026-09-03
- **Status:** Proposed
- **Decision:** Build one shared work model, then add industry vocabulary, rules, tools, and templates as vertical packs.
- **Why:** Customer service, sales follow-up, project delivery, and content operations reuse the same fundamental objects.
- **Core primitives:** Person, organization, request, work item, knowledge, decision, approval, outcome, and agent run.
- **Implication:** Avoid separate disconnected products for each industry.
- **Revisit when:** An industry workflow cannot be expressed cleanly through the shared model.

### D-012 — Commercial model

- **Date:** 2026-09-03
- **Status:** Proposed
- **Decision:** Begin with paid workflow discovery and implementation, then charge a recurring platform and managed-operations fee with included usage. Avoid seat-based pricing as the main model.
- **Why:** Aksen improves work performed by teams and agents, so value tracks workflows and outcomes better than login counts.
- **Implication:** Package an entry workflow, expansion packs, and a managed optimization service.
- **Revisit when:** Pilot economics reveal the real cost and value drivers.

### D-013 — Design and messaging direction

- **Date:** 2026-09-03
- **Status:** Accepted
- **Decision:** Use an original, editorial visual system: warm black and white foundations, signal green accents, large direct headlines, generous space, human workflow stories, product evidence, and restrained motion.
- **Why:** It communicates confidence and clarity without overwhelming nontechnical buyers.
- **Implication:** Pages should show one important idea per section and translate architecture into familiar work.
- **Revisit when:** Five target buyers have reacted to the revised homepage.

### D-014 — Initial customer size

- **Date:** 2026-09-03
- **Status:** Accepted
- **Decision:** Focus initial sales and product learning on owner-led businesses with roughly 10–100 employees.
- **Why:** The pain is real, the decision chain is shorter, and Aksen can combine software with guided implementation without a long enterprise procurement cycle.
- **Implication:** Use direct language for founders and operators, and make time to first value more important than enterprise feature breadth.
- **Revisit when:** Larger organizations begin pulling Aksen into paid departmental pilots.

### D-015 — Homepage narrative

- **Date:** 2026-09-03
- **Status:** Accepted
- **Decision:** Lead the homepage with one customer request moving from message to completed action, then reveal the wider platform and industry potential.
- **Why:** A concrete story is easier to understand and remember than an abstract operating-system claim.
- **Implication:** The hero, motion, and first sections must demonstrate movement and outcome before discussing architecture.
- **Revisit when:** Target-buyer testing shows a different entry story converts more strongly.

### D-016 — Mobile-first customer experience

- **Date:** 2026-09-03
- **Status:** Accepted
- **Decision:** Treat mobile as the primary customer-facing canvas across the marketing experience and all public interactions.
- **Why:** Buyers and customers increasingly discover, discuss, and respond through mobile channels, especially WhatsApp-linked journeys.
- **Implication:** Design navigation, copy hierarchy, interactions, forms, motion, cards, and calls to action for small screens before desktop expansion.
- **Revisit when:** Usage evidence identifies a route with a clearly desktop-dominant job.

### D-017 — Agent gallery and use-case proof

- **Date:** 2026-09-03
- **Status:** Accepted
- **Decision:** Present reusable Aksen agents through a filterable gallery, with each agent linked to a concrete use case and relevant working demonstration.
- **Why:** Buyers understand recognizable jobs and outcomes faster than a generic list of platform capabilities.
- **Implication:** Every agent needs a defined moment, scope of work, human-control boundary, expected outcome, and proof link when available.
- **Revisit when:** Customer research shows that workflow or industry-first navigation is clearer than agent-first navigation.

### D-018 — Ambient hero motion

- **Date:** 2026-09-03
- **Status:** Accepted
- **Decision:** Use quiet, low-contrast video as an ambient hero layer while the interactive request-to-result story remains the main evidence.
- **Why:** Motion adds energy and polish, but the message and working interaction must remain readable and useful.
- **Implication:** Hero videos must be muted, nonessential, mobile-conscious, and disabled when reduced motion is requested.
- **Revisit when:** Performance or comprehension testing shows that the video distracts or delays the first screen.

### D-019 — Aksen Guide

- **Date:** 2026-09-03
- **Status:** Accepted
- **Decision:** Add a persistent conversational Aksen Guide that answers simple questions and directs visitors to agents, use cases, and the workflow mapper.
- **Why:** The company should demonstrate conversational assistance within its own buying journey.
- **Implication:** The guide must use plain language, stay within verified Aksen information, provide graceful fallback responses, and never pretend that an opportunity has been reviewed by a person before submission.
- **Revisit when:** Real visitor questions reveal a better role for the guide.

## Decision queue

These are the next decisions that materially change the product or go-to-market direction:

1. **Primary customer size:** owner-led companies with 10–100 staff, or departments in organizations with 100–1,000 staff?
2. **Homepage wedge:** “customer requests to completed action” or the broader “operating system for work” story?
3. **Commercial entry point:** fixed-price workflow pilot, monthly managed service, or a hybrid?
4. **Brand status:** retain Aksen Labs after formal name, domain, and trademark validation?
5. **First vertical pack after property:** hospitality, professional services, retail, or healthcare?

## Decision record template

### D-XXX — Short decision name

- **Date:** YYYY-MM-DD
- **Status:** Proposed | Accepted | Testing | Superseded
- **Decision:** What we decided in one sentence.
- **Why:** The first-principles reason and supporting evidence.
- **Alternatives:** What else was considered.
- **Implication:** What product, design, commercial, or operating work changes.
- **Owner:** Who is accountable.
- **Revisit when:** A measurable condition that should reopen the decision.
