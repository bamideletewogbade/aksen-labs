import { ArrowDown, ArrowRight, ArrowUpRight, Check } from 'lucide-react';
import { SiteFooter, SiteNav } from '@/components/site-chrome';
import { Reveal, VelocityTicker } from '@/components/agency-motion';
import { HeroShowcase } from '@/components/hero-animations';
import { BusinessJourney } from '@/components/business-journey';
import { AgencyCTA, ServiceList, PillarExplorer } from '@/components/agency-sections';
import { approach } from '@/lib/agency-content';

export default function Home() {
  return (
    <div className="agency-site">
      <SiteNav />
      <main id="main-content">
        {/* HERO SHOWCASE — SYNCHRONIZED ROTATOR WITH 3D VISUALS */}
        <HeroShowcase />

        {/* VELOCITY TICKER — LAST ELEMENT VISIBLE AT BASE OF HERO VIEWPORT */}
        <VelocityTicker
          items={[
            'Customer Experience & Commerce',
            'Mobile Money & Card Checkout',
            'Business Systems & Workspaces',
            'Practical AI Assistants',
            'Data & Performance Insights',
            'Custom Digital Products',
          ]}
          speed={26}
        />

        {/* SECTION 01: HOW WE STRUCTURE THE WORK */}
        <section className="agency-section agency-container agency-intro">
          <Reveal>
            <p className="agency-eyebrow">01 / HOW WE STRUCTURE THE WORK</p>
            <h2>
              The company. The engagement.
              <br />
              <em>The product.</em>
            </h2>
            <p className="agency-intro-lead" style={{ marginTop: '24px' }}>
              We focus on solving your immediate operating bottlenecks while building systems your business can rely on as you scale.
            </p>
            <p style={{ marginTop: '16px' }}>
              Whether you need an improvement to a single customer workflow, an overhaul of your internal tools, or custom software built from scratch, we structure every engagement around clear milestones and verified deliverables.
            </p>
            <div style={{ marginTop: '28px' }}>
              <a className="agency-text-link" href="/about">
                Read our full agency perspective <ArrowUpRight size={18} />
              </a>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <PillarExplorer />
          </Reveal>
        </section>

        {/* SECTION 02: FOUR CORE SERVICES */}
        <section className="agency-section agency-services" id="services">
          <div className="agency-container">
            <Reveal className="agency-section-heading">
              <div>
                <p className="agency-eyebrow">02 / WHAT WE CAN BUILD TOGETHER</p>
                <h2>
                  From the first impression
                  <br />
                  to the <em>whole operation.</em>
                </h2>
              </div>
              <p>
                Start with a clear, high-impact business need. Connect more of your operating tools as confidence and revenue grow.
              </p>
            </Reveal>

            <ServiceList />

            <div className="services-footer-note">
              <p>
                Strategy, implementation, team adoption and scoped improvement run across all four areas. Agree on specific deliverables per project.
              </p>
              <a className="agency-text-link" href="/solutions">
                Compare full service scopes & deliverables <ArrowUpRight size={18} />
              </a>
            </div>
          </div>
        </section>

        {/* SECTION 03: CONNECTED BUSINESS JOURNEY */}
        <section className="agency-section agency-connected" id="connected">
          <div className="agency-container">
            <Reveal className="agency-section-heading">
              <div>
                <p className="agency-eyebrow">03 / SEE THE CONNECTIONS</p>
                <h2>
                  One business.
                  <br />
                  <em>A more connected journey.</em>
                </h2>
              </div>
              <p>
                Explore how a customer moment connects straight into internal workspaces, inventory, payments, and reporting.
              </p>
            </Reveal>

            <BusinessJourney />

            {/* CONNECTED SYSTEMS CALLOUT WITH CONTEXTUAL ASSET */}
            <div className="connected-systems-preview">
              <div className="connected-preview-image">
                <img
                  src="/aksen-systems.png"
                  alt="Connected operations workspace interface showing orders, customer records and team handoffs"
                  width="1200"
                  height="675"
                  loading="lazy"
                />
              </div>
              <div className="connected-preview-copy">
                <span className="agency-example-label">THE TFS CONNECTED MODEL</span>
                <h3>How connected commerce and operations work in practice.</h3>
                <p>
                  In our proposed system for The Frame Shop (TFS), customer discovery, bespoke sizing inquiries, Mobile Money checkout, workshop queues, and reporting all draw on the same verified business records.
                </p>
                <div className="connected-benefits">
                  <div>
                    <Check size={16} />
                    <span>No double-entry between web orders and workshop floor</span>
                  </div>
                  <div>
                    <Check size={16} />
                    <span>Automated MoMo & card verification before cutting begins</span>
                  </div>
                  <div>
                    <Check size={16} />
                    <span>Real-time dashboard tracking margins, turnaround times & repeat orders</span>
                  </div>
                </div>
                <a className="agency-text-link" href="/industries">
                  Explore industry-specific scenarios <ArrowUpRight size={18} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 04: PRACTICAL AI */}
        <section className="agency-section agency-container agency-ai" id="ai-multiplier">
          <Reveal className="agency-ai-statement">
            <p className="agency-eyebrow">04 / AI WITH A PURPOSE</p>
            <h2>
              Your people.
              <br />
              Your business.
              <br />
              <em>More possibility.</em>
            </h2>
            <p>
              AI shouldn't replace your team—it should take repetitive tasks off their plates. We use it to help staff organize incoming inquiries, draft estimates, and process orders faster.
            </p>
            <p style={{ marginTop: '16px' }}>
              We set strict guardrails based on your real pricing, inventory, and policies so customers always receive accurate information.
            </p>
            <div style={{ marginTop: '28px' }}>
              <a className="agency-text-link" href="/agents">
                Explore practical AI examples <ArrowUpRight size={18} />
              </a>
            </div>
          </Reveal>

          <Reveal delay={80} className="agency-ai-example">
            <div className="agency-example-label">PRACTICAL ASSISTANCE IN ACTION / BESPOKE ESTIMATE</div>
            <div className="agency-ai-request">
              “We need 12 custom aluminum-framed prints for our Accra head office by next Friday.”
            </div>
            <div className="agency-ai-step">
              <span>01</span>
              <div>
                <strong>Your business sets the foundation</strong>
                <p>Catalog dimensions, current material costs, and delivery policies.</p>
              </div>
            </div>
            <div className="agency-ai-step">
              <span>02</span>
              <div>
                <strong>AI structures and drafts the estimate</strong>
                <p>Calculates material requirements, checks capacity, and drafts options for staff.</p>
              </div>
            </div>
            <div className="agency-ai-step">
              <span>
                <Check size={16} />
              </span>
              <div>
                <strong>Your team reviews and confirms</strong>
                <p>Team verifies corporate discount, confirms completion date, and sends the final quote.</p>
              </div>
            </div>
            <p className="agency-example-note">
              Accurate quotes. Real human review. No wrong prices or false promises.
            </p>
          </Reveal>
        </section>

        {/* SECTION 05: OUR APPROACH */}
        <section className="agency-section agency-approach-band" id="approach">
          <div className="agency-container">
            <Reveal className="agency-section-heading">
              <div>
                <p className="agency-eyebrow">05 / HOW WE WORK</p>
                <h2>
                  Thought through.
                  <br />
                  <em>Built to be used.</em>
                </h2>
              </div>
              <a className="agency-text-link" href="/how-it-works">
                Deep dive into our 4-stage process <ArrowUpRight size={18} />
              </a>
            </Reveal>

            <div className="agency-process-grid">
              {approach.map((step, index) => (
                <Reveal key={step.title} delay={index * 60}>
                  <span className="agency-process-number">
                    0{index + 1}
                    <ArrowRight size={18} />
                  </span>
                  <h3>{step.title}</h3>
                  <p>{step.lead}</p>
                  <div className="agency-process-deliverable">
                    <strong>Deliverable:</strong>
                    <span>{step.output}</span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 06: ROOTED IN GHANA, BUILT FOR AFRICAN BUSINESS */}
        <section className="agency-section agency-container agency-about-preview" id="about">
          <Reveal className="agency-about-image">
            <img
              src="/professional-services-workflow.png"
              alt="Two business leaders collaborating on a strategic digital plan"
              loading="lazy"
              width="1672"
              height="941"
            />
          </Reveal>
          <Reveal>
            <p className="agency-eyebrow">06 / ROOTED HERE. THINKING FORWARD.</p>
            <h2>
              Practical technology.
              <br />
              <em>Built for African business.</em>
            </h2>
            <p>
              We believe technology should help African businesses prosper. Aksen Labs is based in Ghana, with a perspective that reaches across borders.
            </p>
            <p>
              We actively partner with businesses in Nigeria, Ghana, and across the region, tailoring systems to local payment habits, Mobile Money, and fulfillment logistics.
            </p>
            <p>
              Whether you are modernizing an established merchant or launching a new venture, we start with where your business is today and build what takes you forward.
            </p>
            <div style={{ marginTop: '28px' }}>
              <a className="agency-text-link" href="/about">
                More about Aksen Labs <ArrowUpRight size={18} />
              </a>
            </div>
          </Reveal>
        </section>

        {/* FINAL CTA */}
        <AgencyCTA />
      </main>
      <SiteFooter />
    </div>
  );
}


