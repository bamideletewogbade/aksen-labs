# Multi agent strategy and business opportunities for Aksen Labs

Aksen should develop a reusable operating system for delivering digital transformation, beginning with its own customer support, discovery, proposal and delivery work. The strongest near-term commercial direction is a connected sales-and-operations service for businesses with custom orders. Tender preparation is a promising second product hypothesis. Both need customer validation before they become major product commitments.

The evidence supports selective use of multiple agents inside controlled workflows. A capable model does not remove the need for accurate records, reliable integrations, clear permissions and measurable customer outcomes. Aksen can remain a broad transformation agency while standardising a small number of repeatable solutions underneath its services.

This report evaluates evidence available on 10 September 2026. Company case studies are identified as company-reported evidence; research benchmarks are not treated as guarantees of business performance. Proposed products, targets and economics below are analytical recommendations, not established market demand or current Aksen capabilities.

## What leading organisations actually implement

| Organisation and evidence | Implementation pattern | Implication for Aksen |
| --- | --- | --- |
| Anthropic Research; engineering account, June 2025 | A lead agent delegates independent research to specialists and synthesises their findings. Its internal evaluation reported a 90.2% improvement over the particular single-agent baseline, alongside substantially higher token use. [1] | Use parallel workers for distinct research questions, not every chat reply. |
| OpenAI; current official SDK documentation | Distinguishes handoffs, where a specialist owns the next response, from specialists used as tools under a manager. Recommends splitting only when responsibilities or policies justify it. [26] | Keep one owner of the customer answer; delegate bounded work behind it. This is documented capability, not a customer ROI claim. |
| Google Research; 180-configuration study, January 2026 | Compared single-agent, independent, centralised, decentralised and hybrid systems. Benefits depended on task structure; sequential tasks could deteriorate with coordination overhead. [2] | Benchmark a single-agent baseline before adding agents. |
| Salesforce; retailer production engineering account | Moved order branching and rule interpretation into deterministic code; consolidated model calls. Separate brand agents shared a common foundation. Reported 75% lower end-to-end latency. [3] | Reuse the platform, isolate client configuration and keep pricing/payment rules in code. Multiple deployed agents do not necessarily mean a conversational swarm. |
| ServiceNow; internal deployment account | Specialists coordinate software licence assignment and recovery. Other workflows combine operational records, monitoring and human escalation. [4] | Build a work queue with state and exceptions, rather than a collection of disconnected chat windows. |
| Capita and Microsoft; customer story, September 2025 | Describes agents and Copilot across service delivery, including email handling and operational assessments. Reports 60% shorter email response times. [5] | An agency can improve its own delivery process, then offer the same bounded workflow to customers. These are reported results, not Aksen projections. |
| Rakuten and Anthropic; evolving customer case study | Describes sustained coding tasks and specialist business agents producing deliverables in sandboxed environments. [6] | Give engineering agents isolated workspaces, tests and reviewable deliverables. Code-generation speed alone is not a delivery metric. |
| McKinsey Lilli; internal knowledge platform account | Grounds synthesis in institutional knowledge. Reported adoption and search/synthesis savings illustrate the value of maintained company context. This source does not establish a multi-agent production topology. [7] | Aksen’s first advantage is a reliable library of scopes, decisions and templates. |
| Google Cloud forecasting example; technical implementation | Demonstrates decomposition of business forecasting into specialised work using its agent tooling. It is not independent proof of SME willingness to pay. [8] | Combine statistical calculations with interpretation; require historical data and backtesting before selling forecasting accuracy. |
| AWS; platform documentation | Supports supervisor/specialist orchestration, tools and observability. Current documentation says Bedrock Agents Classic stopped accepting new customers on 30 July 2026 and directs new implementations toward AgentCore. [9] | Reuse the architecture lesson without choosing a superseded service from an older tutorial. |

The comparison is global but intentionally selective. It includes frontier labs, enterprise software suppliers, professional services and an Asian technology group. Public information is much richer on architectures and vendor-reported outcomes than on failure rates, total operating cost or independent ROI. There is no defensible basis here for a universal claim that a particular agent framework is best.

Anthropic’s reported multi-agent token consumption was approximately 15 times ordinary chat in its setting. This is a warning about economic fit, not a universal multiplier. Google’s results reinforce the same practical decision: deploy extra agents when independent work or context separation improves a measured outcome. Do not equate agent count with intelligence. [1][2]

## The architecture Aksen should use

Use a durable workflow as the coordinator. Let models interpret language, retrieve evidence and draft work. Let application code decide permissions, calculate money, enforce transitions and apply approved actions. The founder should see one job with evidence, costs and decisions, even when several specialists contribute.

A typical job would follow this sequence:

1. Receive an enquiry, document, message or approved scheduled trigger.
2. Identify the client and check the permitted scope before retrieving records.
3. Create a job with a budget, deadline, workflow version and expected output.
4. Gather approved evidence, preserving source IDs and document versions.
5. Run one specialist by default; add parallel specialists for independent research or assessment.
6. Validate output using schemas, evidence checks and deterministic business rules.
7. Present proposed external actions and material commitments for approval.
8. Execute through a narrowly scoped tool, persist the result and reconcile ambiguous outcomes.
9. Measure the business result and record corrections for future evaluation.

The first agent roles should be Support, Discovery, Proposal Preparation, Delivery Planning and Quality Review. These are responsibilities, not five permanently running processes. A support FAQ should typically take one answer-generation step. A discovery assessment may justify independent reviews of the customer journey, operational process and measurement plan, followed by a consolidated recommendation.

Keep client facts in the database and approved document store. Store a structured claim with its source, owner, review date and validity period. Conversation summaries are useful working memory but should not silently become verified business knowledge. A customer saying that an invoice is paid is an assertion to verify, not an accounting event.

LangGraph documents persistent state and resumable human-review interruptions. Cloudflare Workflows documents durable steps, retries and waits for approvals. Either could supply useful machinery; Aksen should prototype the smallest compatible option before committing. The current application targets Workers, but a managed Sites deployment may not expose every binding needed for a Workflow. Confirm that deployment capability first. A separate worker is an option if the application’s host cannot supply it. [10][11]

Do not introduce A2A merely to connect functions inside one application. MCP standardises access to tools and context; A2A addresses communication between agents. They become useful at different boundaries. Aksen can first expose typed internal tools such as lookup_product, prepare_quote, create_support_note and prepare_email, and later add protocol adapters where a partner integration requires them. Neither protocol replaces authorisation. [12][13]

## OpenRouter and current multimodal capabilities

Keep OpenRouter as the existing text-model gateway, but separate model routing from workflow orchestration. Auto routing chooses a model for a request. It does not plan the business process, enforce approvals, persist a job or make an email safe to retry.

OpenRouter’s current documentation provides model restrictions and cost tiers, and returns the actual selected model. A cost tier is a price band, not a monetary spending ceiling. Set workflow and tenant budgets independently. Use a tested candidate list for production work; reevaluate it when models or providers change. Preserve the current fixed-default path for predictable diagnostics rather than assuming Auto always chooses that model. [14]

| Modality | Useful capability now | Aksen application | What must be checked |
| --- | --- | --- | --- |
| Text and structured data | Retrieval, extraction, reasoning, classification and drafting | Support, qualification, scope preparation and weekly operating summaries | Source fidelity, schema validity, unsupported promises and task cost |
| Images and scanned documents | Visual understanding and OCR with compatible models or document parsing | Read supplier sheets, review a photographed brief, identify a product for lookup | Blur, units, amounts, handwriting and whether an image supports the claim |
| Recorded audio | Transcription and subsequent interpretation | Turn a voice note into a structured enquiry or meeting action list | Names, quantities, accents, code-switching and consent for recording |
| Live audio | Low-latency conversation with interruption and tool support on specialised APIs | Inbound reception, qualification and assisted scheduling | Telephony integration, latency, language accuracy and human transfer |
| Video understanding | Summarise visual/audio content and locate events | Review a workshop walkthrough or prepare an operating procedure | Sampling can miss brief events; a video summary is not a safety inspection |
| Image and video generation | Create campaign concepts and controlled asset variants | Marketing production connected to real products and campaign goals | Product fidelity, editing time, rights and whether assets improve results |
| Code and computer interaction | Build software, operate tools and assist integration work | Delivery preparation, tests, content migration and repetitive admin work | Sandboxing, access scope, irreversible actions and integration tests |

OpenRouter documents image, PDF, audio and video inputs for compatible routes, plus separate speech and asynchronous video-generation interfaces. This does not mean every model accepts every modality, or that the current Aksen chat implementation already does. Add media upload, storage, parsing and retention deliberately. Discover supported models and parameters from current provider metadata instead of scattering model names throughout product code. [15][16]

OpenAI’s Realtime documentation and Gemini Live documentation provide options for live audio applications. A native real-time transport may be appropriate alongside OpenRouter for text and asynchronous work; one gateway need not carry every medium. Account access and a specific deployment’s language quality still require verification. [17][18]

Gemini’s video documentation notes default visual sampling at one frame per second in the described path, which can miss rapid changes. For a workshop demonstration, ask for a timestamped procedure summary and let the operator verify the steps. Do not sell continuous safety assurance from a general-purpose video model. [19]

A recent AfriSwitch preprint evaluates code-switched African speech and reports substantial recognition errors across the systems tested. It is one benchmark, not a verdict on all speech models, but it directly challenges the assumption that nominal language support guarantees usable local speech. Build a consented test set with Ghanaian and Nigerian English, relevant local languages, background noise, names, measurements and prices. Confirm critical extracted details back to the customer. [20]

## Ghana as a starting market and expansion beyond it

Ghana offers proximity to customers and the ability to observe their real processes. Use that access to discover a repeatable workflow. Expansion should follow similar business needs and viable delivery arrangements, rather than a country count target.

GSMA’s 2025 Ghana findings describe a substantial gap between mobile coverage and actual internet use. That evidence favours lightweight interfaces, concise messages, resumable forms and optional voice-note input. It does not establish that every prospect prefers WhatsApp or will pay for an assistant. Validate channel preference with the actual business and its customers. [21]

Keep currency, timezone, payment provider, tax configuration, language, message templates and business hours configurable by client. A Nigerian rollout should not be a blind copy of a Ghanaian payment workflow. Use the provider’s authoritative payment status, not a screenshot or model inference. Treat country-specific messaging, data and payment requirements as implementation checks before launch; this report is not a legal compliance determination.

Arkesel’s current product is KOVA IQ. Its product and VoiceConnect pages describe a unified messaging inbox/CRM with connected calling capabilities. This is useful competitive and potential integration context. Aksen should avoid assuming that another generic inbox is an unoccupied market. A more differentiated offer is completing the operational work after an enquiry: specifications, a correct quote, verified payment, a production handoff and follow-up. Arkesel could be an integration candidate, subject to technical and commercial checks; no partnership is established. [22][23]

## Commercial opportunities and order of attack

The rankings below are judgments based on Aksen’s existing work and the evidence above. They are not measured market-size estimates. The highest-priority opportunity is the one for which Aksen can obtain real workflow access, demonstrate a paid result and repeat delivery with less founder effort.

| Opportunity | Buyer and recurring problem | Offer and revenue hypothesis | Priority and validation |
| --- | --- | --- | --- |
| Connected order operations | Custom furniture, framing, signage and similar businesses losing context between enquiries, quotes and fulfilment | Implementation fee plus bounded care and usage; reusable workflow configuration | First external pilot. Validate with observed quote and handoff errors. |
| Agency operating workspace | Aksen itself, then small service firms with scattered briefs and inconsistent follow-up | Internal efficiency first; later a packaged implementation or subscription | Build internally now; productise only after repeat usage. |
| Tender preparation assistant | Suppliers repeatedly interpreting bid documents and assembling evidence | Per-pack pilot, then workspace subscription with document limits | Second hypothesis. Interview suppliers and use actual historical tender packs. |
| Voice-note enquiry assistant | Businesses receiving unstructured spoken requirements | Add-on to an existing support/order system | Add after text workflow works; validate critical-field accuracy locally. |
| Managed business reporting | Firms with usable transaction and operational data but little decision support | Setup plus recurring reporting/review service | Sell when data exists and a manager owns the decisions. |
| Folio for institutions | Training providers and career programmes serving cohorts | Partner-funded or cohort-based CV review and coaching workflow | Test distribution before a broad consumer subscription launch. |
| Campaign production assistant | Businesses with regular product launches and approved asset libraries | Bounded content service with review and performance measurement | Useful service add-on; weaker standalone differentiation. |
| Agent-ready supplier catalogue | Suppliers whose product data must serve multiple channels and future buying agents | Catalogue cleanup, structured availability and integration service | Later option after order operations produces a reliable data model. |

### Connected order operations

Use the TFS proposal as a design reference, not as a delivered success story. The first paid pilot should cover one product family and one enquiry channel. Capture customer requirements, flag missing dimensions, retrieve approved product facts and prepare a quote for a person. After the customer accepts, a separate verified payment event may unlock the production handoff.

A prototype can use three roles: an enquiry interpreter, a product/specification checker and a handoff preparer. Money and eligibility calculations belong in code. Agents should not debate stock levels or negotiate discounts with each other. The demo should show an ambiguous dimension, an unavailable lead time and an unverified payment screenshot, alongside the happy path.

Measure time to a complete quote, corrections per quote, accepted quotes, repeated data entry and fulfilment errors. Do not attribute all sales changes to the assistant. Interview the staff who use the system; founder enthusiasm is not evidence of adoption. Require a paid continuation decision after the pilot.

### Tender preparation

GHANEPS already provides tender discovery, notifications and procurement workflows. Therefore a new listing aggregator alone has limited differentiation. The stronger hypothesis is a requirements matrix connected to the supplier’s own evidence library: what is required, where supporting evidence exists, what is missing and who must supply it. [24]

Separate opportunity research, requirements extraction, evidence matching and draft preparation. Require page-level references and preserve contradictions for human review. Do not fabricate credentials, certify eligibility or submit a bid automatically. Start with supplier-provided files and permitted public sources; do not assume a bulk-data API exists.

The first experiment should compare preparation time and missed requirements on a few historical tenders. Continue only if suppliers pay for the improvement. Expand into an evidence workspace once repeated document reuse is established. This is a business-support product hypothesis, not legal procurement advice or a promise of contract wins.

### Folio and adjacent products

Folio can reuse document extraction, evidence tracking and clean response presentation. Its value should be clearer experience descriptions, honest gap identification and useful revision. Do not promise that a score guarantees ATS acceptance or employment. Institutional distribution may produce more repeatable demand than individually acquiring jobseekers, but this remains untested.

Avoid launching all proposed products together. Aksen’s agency services can discover demand and fund development. A product should emerge when the same outcome, data model and onboarding process repeat across customers. Custom work should be priced explicitly rather than hidden inside a nominal subscription.

## An end to end agency workflow

Prospecting starts with an approved target profile and permitted sources. A research specialist gathers business facts and records their dates and URLs. A qualification step distinguishes observed facts from inferred pain points. An enrichment service must return provenance and confidence; missing contact details should remain missing rather than be invented.

The founder reviews the target and proposed outreach. The email system needs an approved sender, appropriate recipient basis, suppression handling and delivery events before campaigns become live. Resend sending is a transport capability; it does not by itself create a complete inbound mailbox, CRM or compliant marketing programme. Keep discovery and drafting separate from actual contact.

After a reply, the system prepares a discovery brief, missing-information checklist and suggested scope. The proposal references approved commercial terms and the source brief. Acceptance creates a project through a controlled state transition. Delivery agents prepare implementation tasks and test evidence. A person approves release and client-facing commitments.

After handover, a care workflow collects service events, usage and customer feedback, then drafts a monthly report. Renewal and expansion recommendations should identify specific evidence, such as recurring manual tasks or usage beyond the agreed allowance. Avoid a generic automated upsell sequence unrelated to customer outcomes.

## Reliability and operating economics

Track job ID, parent job, client/tenant, actor, workflow version, prompt version, source versions, model selected, provider request ID, elapsed time, tokens/cost, tool calls, approval decisions and external action receipts. Record concise decision reasons and evidence, not private model chain-of-thought. General diagnostic logs should exclude credentials and unnecessary personal content; restricted business records can retain the documents necessary to perform the work under an agreed policy.

The logging changes being added to Aksen provide a useful request/AI-event foundation, but they do not yet constitute durable orchestration, complete tool tracing, immutable audit storage or automatic replay. A database insert with a timeout can fail. Production operations need a reliable event sink, retention rules and alerts for missing telemetry. Logging is evidence about a workflow, not the workflow state itself.

Use a transactional outbox for external actions and a unique action key for idempotency. After a timeout, reconcile the provider result before retrying. Cloudflare Queues documents at-least-once delivery; duplicates must therefore be expected in consumers. A retry that sends a second email or creates another payment request is a business defect even if the model’s text is excellent. [25]

Evaluate a representative set of tasks against both a single-agent baseline and the proposed multi-agent workflow. Include prompt injection, stale prices, contradictory documents, unavailable providers, malformed outputs, cross-client access attempts and duplicate events. Measure accepted outcomes, correction time and escaped errors. A second model reviewing the first is one check, not independent proof of correctness.

The essential economic equation is monthly revenue minus inference, channel charges, hosting, specialist tools, support labour and rework. Count founder hours at an explicit internal rate. A workflow that saves model tokens but creates ten minutes of review on every request may still be uneconomic.

For illustration only, suppose a client pays GHS 2,000 per month. If infrastructure and usage cost GHS 400 and support requires four hours at an internal GHS 150 hourly cost, contribution before overhead is GHS 1,000, or 50%. These are hypothetical inputs, not recommended published prices or observed Aksen costs. Improve contribution by reducing exceptions and onboarding effort, not by hiding support work.

A billion-dollar outcome would require repeatable distribution, customer retention and a product that scales beyond bespoke founder delivery. Agent count does not establish that path. Preserve the ambition, but make the immediate objective a paid workflow that customers keep using and that becomes cheaper to deliver correctly over time.

## A practical ninety day sequence

| Stage | Build and learn | Exit evidence |
| --- | --- | --- |
| Days 1–14 | Complete grounded Ask Aksen support, fictional demonstrations, formatting, request tracking and a support evaluation set. Document the knowledge owner and edit process. | Correct pricing/product boundaries, visible fallback, working handoff recording and no unsupported external actions. |
| Days 15–30 | Run Aksen discovery and proposal preparation on real authorised internal work. Instrument review effort. Interview prospective custom-order businesses and suppliers. | Repeated use, fewer corrections, and a clearly scoped paid pilot opportunity. |
| Days 31–60 | Deliver one connected-order pilot with limited integrations, explicit approvals and baseline measurements. Prototype tender extraction on provided sample files. | Customer accepts the outcome; evidence shows improvement worth paying for. |
| Days 61–90 | Standardise the successful workflow, onboarding checklist, evaluation suite, limits and monthly care. Try a second comparable customer before adding a new vertical. | Repeatable delivery, a paid continuation and measured support economics. |

These are planning stages rather than promises. Customer access, approvals and integration setup determine the actual schedule. A reasonable initial success target is two paid pilots, a repeatable operating workflow and a measurable reduction in founder intervention. Treat that target as a decision aid, not a market forecast.

## Decisions and open questions

Proceed with a grounded support assistant and a reusable internal workflow foundation. Prioritise custom-order operations for customer discovery. Keep tender preparation as the next product experiment, with Folio continuing as a separate validation track only if distribution becomes available.

Still unverified are willingness to pay, the number of reachable customers with the same workflow, partner/API terms, real speech accuracy for target users, hosted orchestration bindings and total support burden. No current evidence justifies an unsupervised agent company, automatic cold outreach or public claims of completed client transformations.

## Sources

1. Anthropic. [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system). 13 June 2025. Architecture, internal evaluation and token overhead.
2. Yubin Kim and Xin Liu, Google Research. [Towards a science of scaling agent systems](https://research.google/blog/towards-a-science-of-scaling-agent-systems-when-and-why-agent-systems-work/). 28 January 2026. Controlled architecture comparison.
3. Salesforce Engineering. [How Agentforce achieved 3–5x faster response times](https://engineering.salesforce.com/how-agentforce-achieved-3-5x-faster-response-times-while-solving-enterprise-scale-architectural-complexity/). Publication date not confirmed from the retrieved extract; accessed 10 September 2026. Retailer architecture and reported latency improvement.
4. ServiceNow. [How is ServiceNow using AI agents](https://www.servicenow.com/uk/blogs/2026/how-is-servicenow-using-ai-agents). 2026; accessed 10 September 2026. Internal operational deployments, company reported.
5. Microsoft. [Capita uses Microsoft Copilot to transform service delivery for clients](https://www.microsoft.com/en/customers/story/25164-capita-microsoft-copilot-studio/). 10 September 2025. Customer-reported service examples.
6. Anthropic. [Rakuten accelerates development with Claude Code](https://claude.com/customers/rakuten). Living customer page, accessed 10 September 2026. Coding and specialist agent deployment claims.
7. McKinsey. [Rewiring the way McKinsey works with Lilli](https://www.mckinsey.com/capabilities/tech-and-ai/how-we-help-clients/rewiring-the-way-mckinsey-works-with-lilli). Accessed 10 September 2026; discusses rollout beginning July 2023. Institutional knowledge example.
8. Google Cloud. [How we built a multi-agent system for superior business forecasting](https://cloud.google.com/blog/products/ai-machine-learning/how-we-built-a-multi-agent-system-for-superior-business-forecasting). Accessed 10 September 2026. Technical example.
9. AWS. [Use multi-agent collaboration with Amazon Bedrock Agents](https://docs.aws.amazon.com/en_us/bedrock/latest/userguide/agents-multi-agent-collaboration.html). Current documentation, accessed 10 September 2026. Supervisor pattern and Agents Classic availability notice.
10. LangChain. [Persistence](https://docs.langchain.com/oss/javascript/langgraph/persistence) and [Interrupts](https://docs.langchain.com/oss/javascript/langgraph/interrupts). Current documentation, accessed 10 September 2026. State and resumable review.
11. Cloudflare. [Workflows overview](https://developers.cloudflare.com/workflows/). Updated 2 June 2026. Durable steps, retries and external events.
12. Model Context Protocol. [Introduction](https://modelcontextprotocol.io/docs/2026-07-28/getting-started/intro). Version 28 July 2026. Tool/context integration.
13. A2A Project. [What is A2A](https://a2a-protocol.org/latest/topics/what-is-a2a/). Current documentation, accessed 10 September 2026. Agent interoperability.
14. OpenRouter. [Auto Router](https://openrouter.ai/docs/guides/routing/routers/auto-router). Current documentation, accessed 10 September 2026. Model selection, restrictions and cost bands.
15. OpenRouter. [Multimodal capabilities](https://openrouter.ai/docs/guides/overview/multimodal/overview). Current documentation, accessed 10 September 2026. Modality and endpoint boundaries.
16. OpenRouter. [Video generation](https://openrouter.ai/docs/guides/overview/multimodal/video-generation). Current documentation, accessed 10 September 2026. Asynchronous media jobs.
17. OpenAI. [Realtime and audio](https://developers.openai.com/api/docs/guides/realtime). Current documentation, accessed 10 September 2026. Live audio capability.
18. Google AI for Developers. [Gemini Live API overview](https://ai.google.dev/gemini-api/docs/live-api). Current documentation, accessed 10 September 2026. Live multimodal capability.
19. Google AI for Developers. [Video understanding](https://ai.google.dev/gemini-api/docs/video-understanding). Current documentation, accessed 10 September 2026. Sampling limitations.
20. Gabrial Zencha Ashungafac, Busayo Awobade and Tobi Olatunji. [AfriSwitch](https://arxiv.org/abs/2608.26434). Preprint submitted 26 August 2026. Code-switched speech benchmark; not a universal model comparison.
21. GSMA. [Ghana digital transformation report announcement](https://www.gsma.com/newsroom/press-release/new-gsma-report-launches-at-digital-africa-summit-ghana-revealing-digital-transformation-could-add-20-billion-to-the-country/). 3 September 2025. Indexed primary-source extract; full-page retrieval failed during verification. Used only for the qualitative coverage/usage gap.
22. Arkesel. [KOVA IQ](https://arkesel.com/kova-iq/). Current product page, accessed 10 September 2026. Product positioning.
23. Arkesel. [VoiceConnect](https://arkesel.com/voice-connect/). Current product page, accessed 10 September 2026. CRM and calling integration claims.
24. GHANEPS. [Ghana Electronic Procurement System](https://www.ghaneps.gov.gh/epps/home.do). Page updated 10 September 2026. Existing discovery, notification and procurement functions.
25. Cloudflare. [Queues delivery guarantees](https://developers.cloudflare.com/queues/reference/delivery-guarantees/). Updated 21 April 2026. At-least-once delivery.

26. OpenAI. [Orchestration and handoffs](https://developers.openai.com/api/docs/guides/agents/orchestration). Current official documentation, accessed 10 September 2026. Manager and handoff patterns.
