import type { Metadata } from 'next';
import { ArrowUpRight, Check, Sparkles } from 'lucide-react';
import { SiteFooter, SiteNav } from '@/components/site-chrome';
import { Reveal } from '@/components/agency-motion';
import { AgencyCTA } from '@/components/agency-sections';
import { BusinessJourney } from '@/components/business-journey';

export const metadata: Metadata = {
  title: 'Business Examples | Aksen Labs',
  description:
    'Explore connected commerce, service operations and digital product journeys. Practical illustrations of how digital transformation helps African businesses grow.',
};

const examples = [
  {
    title: 'Retail & Connected Commerce',
    goal: 'Make the journey from product discovery to MoMo checkout, workshop handoff, and repeat orders smooth and accountable.',
    image: '/retail-commerce.png',
    parts: ['Custom Storefront & Live Catalogue', 'Paystack / MoMo Payments', 'Workshop Production Queue', 'WhatsApp Milestone Alerts'],
    result: 'Zero missed custom orders, instant payment verification, and clear fulfillment tracking for the team.',
  },
  {
    title: 'Professional Service & Consulting Firms',
    goal: 'Transform scattered email inquiries into structured project briefs, milestone agreements, and predictable client delivery.',
    image: '/professional-services-workflow.png',
    parts: ['Structured Intake Mapper', 'Collaborative Scoping Tool', 'Milestone Invoicing & Paystack', 'Client Delivery Portal'],
    result: 'Clear client expectations, less unpaid scope creep, and faster proposal approvals.',
  },
  {
    title: 'Hospitality & Boutique Tourism',
    goal: 'Unite guest reservations, direct payment confirmation, room preparation, and concierge assistance under one operational hub.',
    image: '/hospitality-tourism.png',
    parts: ['Direct Booking Engine', 'Automated Deposit Verification', 'Housekeeping & Front Desk Handoff', 'Instant Guest Inquiry Assistant'],
    result: 'Reduced reliance on third-party OTA commissions and faster guest inquiry response times.',
  },
  {
    title: 'Real Estate & Property Portfolios',
    goal: 'Present listings with verified availability, filter tenant inquiries, and automate viewing schedules for leasing agents.',
    image: '/property-workflow.png',
    parts: ['Interactive Property Showcase', 'Applicant Prequalification Flow', 'Viewing Scheduling Assistant', 'Lease & Payment Records'],
    result: 'Agents spend time with qualified buyers rather than fielding repetitive questions on unavailable units.',
  },
  {
    title: 'Creative, Media & Campaign Agencies',
    goal: 'Give creative briefs, multi-stakeholder feedback, client approvals, and campaign reporting a single reliable track.',
    image: '/creator-campaign.png',
    parts: ['Asset & Brief Repository', 'Client Approval Workflow', 'Production Calendar & Sprints', 'Campaign ROI Reporting'],
    result: 'Eliminated approval bottlenecks, complete audit trails, and faster campaign delivery cycles.',
  },
  {
    title: 'New Digital Ventures & Portals',
    goal: 'Take a new software or service idea from initial concept to a working prototype, tested web app, and public launch.',
    image: '/aksen-systems.png',
    parts: ['User Research & Journey Mapping', 'Figma Interactive Prototype', 'Modern Full-stack App Build', 'Subscription Billing & Telemetry'],
    result: 'A dependable digital product ready for paying customers in Ghana, Nigeria, and across the region.',
  },
];

export default function ExamplesPage() {
  return (
    <div className="agency-site">
      <SiteNav />
      <main id="main-content">
        {/* HERO */}
        <section className="agency-page-hero agency-container">
          <p className="agency-eyebrow">
            <span /> REALISTIC OPERATIONAL SCENARIOS
          </p>
          <h1>
            Different businesses.
            <br />
            <em>Connected daily operations.</em>
          </h1>
          <p>
            See how a digital experience connects into back-office records, payment gateways, and staff workspaces. These are illustrative scenarios we tailor around your specific market, currency, and operating tools.
          </p>
        </section>

        {/* INTERACTIVE JOURNEY SECTION */}
        <section className="agency-section agency-connected">
          <div className="agency-container">
            <BusinessJourney />
          </div>
        </section>

        {/* EXAMPLES GRID WITH ASSETS */}
        <section className="agency-section agency-container">
          <Reveal className="agency-section-heading">
            <div>
              <p className="agency-eyebrow">WHERE COULD WE START?</p>
              <h2>
                Find a familiar challenge.
                <br />
                <em>Imagine a connected solution.</em>
              </h2>
            </div>
            <p>
              Your business does not need to fit a rigid template. These examples serve as a practical starting point for scoping an engagement.
            </p>
          </Reveal>

          <div className="agency-example-grid">
            {examples.map((e, i) => (
              <Reveal key={e.title} delay={i * 50}>
                <article className="agency-business-example-card">
                  <div className="example-card-image">
                    <img src={e.image} alt={e.title} width="600" height="338" loading="lazy" />
                  </div>
                  <div className="example-card-body">
                    <span className="agency-example-label">SCENARIO 0{i + 1}</span>
                    <h3>{e.title}</h3>
                    <p className="example-goal">{e.goal}</p>
                    
                    <div className="example-parts">
                      <strong>Connected Elements:</strong>
                      <ul>
                        {e.parts.map((p) => (
                          <li key={p}>
                            <Check size={14} /> {p}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="example-result-box">
                      <strong>Target Business Result:</strong>
                      <p>{e.result}</p>
                    </div>

                    <div style={{ marginTop: '20px' }}>
                      <a className="agency-text-link" href="/agent-mapper">
                        Discuss a similar system <ArrowUpRight size={17} />
                      </a>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>

          <div className="agency-agent-note" style={{ marginTop: '50px' }}>
            <strong>Please note:</strong> These scenarios illustrate how connected systems work in practice rather than past client case studies. Every engagement is scoped around your actual operations and agreed deliverables.
          </div>
        </section>

        {/* CLOSING CTA */}
        <AgencyCTA />
      </main>
      <SiteFooter />
    </div>
  );
}

