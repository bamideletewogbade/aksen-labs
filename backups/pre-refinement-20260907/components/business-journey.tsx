'use client';
import { useState } from 'react';
import { ArrowRight, ArrowLeft, Check, ShoppingBag, ClipboardList, Lightbulb, Smartphone, ShieldCheck } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const journeys = [
  {
    id: 'retail',
    name: 'Retail & connected commerce',
    icon: ShoppingBag,
    description: 'Inspired by our connected proposal for The Frame Shop: from discovering a custom frame to MoMo checkout, workshop handoff, and repeat orders.',
    steps: [
      {
        label: 'Discover',
        title: 'Give interest somewhere clear to go.',
        customer: 'A customer discovers a custom frame or art print on your website.',
        system: 'A clear storefront brings the catalogue, custom dimensions, finishes, and live pricing together in one fast interface.',
        detail: 'Unified Product Catalogue',
        record: ['Dimensions, options & live availability', 'Transparent pricing in GHS / NGN', 'Direct option for bespoke enquiry'],
        connection: 'Digital Storefront + Shared Catalogue',
      },
      {
        label: 'Enquire',
        title: 'Assist customers without losing the personal touch.',
        customer: 'They ask about custom framing options for an odd-sized piece via web or WhatsApp.',
        system: 'AI assistant structures the dimensions and drafts options using verified catalog rules. Complex bespoke requests route straight to your team.',
        detail: 'Centralized Enquiry Record',
        record: ['Customer dimensions & preferences captured', 'Draft estimate prepared using workshop rules', 'Staff notification for custom review'],
        connection: 'Customer Service + AI Assistance + Team Inbox',
      },
      {
        label: 'Pay & Verify',
        title: 'Connect the order directly to the operation.',
        customer: 'They are ready to pay and approve the quote.',
        system: 'Integrated Mobile Money (MTN MoMo, Telecel Cash) and card checkout confirms payment instantly and generates an immutable order record.',
        detail: 'Verified Order & Payment Record',
        record: ['Payment verified via Paystack / MoMo API', 'Digital receipt sent via SMS & WhatsApp', 'Fulfillment owner automatically assigned'],
        connection: 'Checkout + MoMo/Cards + Operations Ledger',
      },
      {
        label: 'Fulfill & Care',
        title: 'Keep the team in sync and the customer informed.',
        customer: 'They want to know when their frame will be delivered.',
        system: 'Workshop tracks cutting, joining, and delivery status. The customer receives automated milestone updates, and sales reporting updates in real time.',
        detail: 'Team Production Workspace',
        record: ['Workshop production status visible to all', 'Automated SMS / WhatsApp dispatch alert', 'Customer lifetime record updated for care'],
        connection: 'Workshop Workspace + Tracking + Analytics',
      },
    ],
  },
  {
    id: 'services',
    name: 'Professional service firms',
    icon: ClipboardList,
    description: 'From a prospective client enquiry to a well-scoped proposal, signed agreement, and structured delivery.',
    steps: [
      {
        label: 'Enquire',
        title: 'Start with a structured, intelligent conversation.',
        customer: 'A business owner asks for help restructuring their sales operations.',
        system: 'Your website and intake process explain services clearly, capture the client’s actual market and currency, and gather key requirements.',
        detail: 'Project Opportunity Brief',
        record: ['Business goals, market & timeline logged', 'Initial budget & urgency indicators captured', 'Dedicated partner notified for review'],
        connection: 'Website + Structured Intake Mapper',
      },
      {
        label: 'Scope',
        title: 'Turn fragmented notes into an agreed brief.',
        customer: 'They want to understand the deliverables, milestones, and timeline.',
        system: 'Internal knowledge base and project templates assist the team in drafting a realistic, scoped proposal with clear dependencies.',
        detail: 'Scoped Proposal & Deliverables',
        record: ['Scope boundaries clearly delineated', 'Milestone dates & deliverables confirmed', 'Team capacity & resource plan checked'],
        connection: 'Team Knowledge + Scoping Tools',
      },
      {
        label: 'Agree',
        title: 'Make commitments transparent before work starts.',
        customer: 'They approve the scope and sign the engagement agreement.',
        system: 'Milestone-based invoicing and payment schedules are generated. Project setup initiates automatically upon payment verification.',
        detail: 'Signed Engagement & Deposit',
        record: ['Scope & milestone terms agreed in writing', 'Initial milestone invoice generated & tracked', 'Delivery workspace provisioned for client'],
        connection: 'Proposal + Invoicing + Workspace Setup',
      },
      {
        label: 'Deliver',
        title: 'Keep delivery transparent and accountable.',
        customer: 'They need dependability and consistent visibility.',
        system: 'Collaborative workspaces coordinate milestones, approvals, deliverables, and team handovers without lost email chains.',
        detail: 'Client Delivery Workspace',
        record: ['Milestone progress visible in real time', 'Approval gatekeeper tracks client sign-offs', 'Handover, training & support logged'],
        connection: 'Project Operations + Client Communications',
      },
    ],
  },
  {
    id: 'product',
    name: 'New digital products & portals',
    icon: Lightbulb,
    description: 'From a validated market problem to a clickable prototype, production build, and continuous user-driven iteration.',
    steps: [
      {
        label: 'Explore',
        title: 'Identify the problem truly worth solving.',
        customer: 'You spot an unserved operational gap in your African market.',
        system: 'Discovery interviews, competitor audit, and target user journeys test commercial viability before writing code.',
        detail: 'Opportunity & Requirements Brief',
        record: ['Target user persona & workflow mapped', 'Core problem validated with real stakeholders', 'Success criteria & MVP boundary defined'],
        connection: 'Business Strategy + User Research',
      },
      {
        label: 'Prototype',
        title: 'Make the software concept tangible.',
        customer: 'You want your leadership and pilot users to test the concept.',
        system: 'High-fidelity interactive prototype created to test usability, feedback, and edge cases in the real African operating environment.',
        detail: 'Clickable Product Prototype',
        record: ['Key user flows interactive & reviewable', 'Usability feedback gathered from pilot cohort', 'Technical architecture & APIs specified'],
        connection: 'UI/UX Design + Prototype + Feedback Loops',
      },
      {
        label: 'Build',
        title: 'Engineer the core product to production quality.',
        customer: 'Users are ready to onboard and pay for the service.',
        system: 'Clean modern web/mobile architecture, local payment gateway connections, authentication, and secure databases engineered for reliability.',
        detail: 'Production MVP Release',
        record: ['Production software tested & deployed', 'MoMo/card billing & subscriptions connected', 'Operational monitoring & telemetry live'],
        connection: 'Product Engineering + Cloud Infrastructure',
      },
      {
        label: 'Learn & Scale',
        title: 'Let real user behavior drive the product roadmap.',
        customer: 'Your user base expands across Ghana, Nigeria, and beyond.',
        system: 'Product analytics, telemetry, and support tickets inform iterative feature development and scalable cloud capacity.',
        detail: 'Telemetry & Roadmap Loop',
        record: ['User retention & drop-off tracked', 'User feedback prioritized for upcoming sprints', 'Scalable product ready for regional scale'],
        connection: 'Product Analytics + Continuous Development',
      },
    ],
  },
];

export function BusinessJourney() {
  const [selected, setSelected] = useState('retail');
  const [step, setStep] = useState(0);

  const activeJourney = journeys.find((j) => j.id === selected) || journeys[0];
  const currentStep = activeJourney.steps[step] || activeJourney.steps[0];

  return (
    <Tabs
      value={selected}
      onValueChange={(value) => {
        setSelected(String(value));
        setStep(0);
      }}
      className="business-journey"
    >
      <TabsList className="journey-tabs" aria-label="Choose a business journey">
        {journeys.map((j) => (
          <TabsTrigger key={j.id} value={j.id}>
            <j.icon size={17} />
            {j.name}
          </TabsTrigger>
        ))}
      </TabsList>

      {journeys.map((j) => (
        <TabsContent value={j.id} key={j.id} className="journey-panel">
          <p className="journey-intro">{j.description}</p>

          <div className="journey-steps" role="group" aria-label="Explore the stages">
            {j.steps.map((s, i) => (
              <button
                type="button"
                key={s.label}
                aria-pressed={step === i}
                aria-controls={`journey-detail-${j.id}`}
                onClick={() => setStep(i)}
                className={step === i ? 'is-current' : step > i ? 'is-past' : ''}
              >
                <span>{step > i ? <Check size={15} /> : String(i + 1).padStart(2, '0')}</span>
                <span className="step-label-text">{s.label}</span>
                <ArrowRight size={16} />
              </button>
            ))}
          </div>

          <div className="journey-progress" aria-hidden="true">
            <span
              style={{
                transform: `scaleX(${(step + 1) / j.steps.length})`,
              }}
            />
          </div>

          <div className="journey-detail" id={`journey-detail-${j.id}`} aria-live="polite" aria-atomic="true">
            <div key={`${j.id}-${step}`} className="journey-change">
              <div className="journey-explanation">
                <span className="agency-example-label">STAGE 0{step + 1} / THE CUSTOMER & THE BUSINESS</span>
                <h3>{j.steps[step].title}</h3>
                <div className="journey-customer-box">
                  <strong>Customer Experience</strong>
                  <p className="journey-customer">{j.steps[step].customer}</p>
                </div>
                <div className="journey-system-box">
                  <strong>System & Operations Behind It</strong>
                  <p>{j.steps[step].system}</p>
                </div>
              </div>

              <div className="journey-record">
                <span className="agency-example-label">{j.steps[step].detail}</span>
                {j.steps[step].record.map((r, i) => (
                  <div
                    className="journey-record-line"
                    style={{ animationDelay: `${i * 65}ms` }}
                    key={r}
                  >
                    <Check size={17} />
                    <span>{r}</span>
                  </div>
                ))}
                <div className="journey-connection">
                  <span className="agency-status-dot" />
                  <strong>Connected Architecture:</strong>
                  <span>{j.steps[step].connection}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="journey-footer-controls">
            <div className="journey-step-buttons">
              <button
                type="button"
                disabled={step === 0}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className="journey-nav-btn"
                aria-label="Previous step"
              >
                <ArrowLeft size={16} /> Previous
              </button>
              <span className="step-indicator">
                {step + 1} of {j.steps.length}
              </span>
              <button
                type="button"
                disabled={step === j.steps.length - 1}
                onClick={() => setStep((s) => Math.min(j.steps.length - 1, s + 1))}
                className="journey-nav-btn"
                aria-label="Next step"
              >
                Next <ArrowRight size={16} />
              </button>
            </div>
            <p className="agency-example-note">
              An illustrative connected system. We customize the exact tools, payments, and team handoffs to your business.
            </p>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}

