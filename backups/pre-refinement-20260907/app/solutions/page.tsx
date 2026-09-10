import type { Metadata } from 'next';
import { ArrowUpRight, Check, Clock, Sparkles, Layers } from 'lucide-react';
import { SiteFooter, SiteNav } from '@/components/site-chrome';
import { Reveal } from '@/components/agency-motion';
import { AgencyCTA } from '@/components/agency-sections';
import { services } from '@/lib/agency-content';

export const metadata: Metadata = {
  title: 'Our Services | Aksen Labs',
  description:
    'Customer experience and commerce, business systems and operations, data insight, and digital products. Digital transformation for African businesses.',
};

const engagementModels = [
  {
    title: 'Focused Starter Sprint',
    timeline: '2 to 4 weeks',
    description: 'Solve one clear bottleneck: a high-converting storefront, a structured client intake flow, or a connected payment checkout.',
    deliverable: 'A working, deployed solution addressing an immediate business priority.',
  },
  {
    title: 'Connected Transformation',
    timeline: '6 to 12 weeks',
    description: "Connect your storefront, internal workspace, payment options, and reporting so your team isn't manually re-entering data across apps.",
    deliverable: 'A fully connected workflow from customer order to fulfillment and management reporting.',
  },
  {
    title: 'Digital Product Build',
    timeline: '8 to 16 weeks',
    description: 'Test a new software or service idea with real users, build a production web or mobile app, and launch.',
    deliverable: 'Production software release, authentication, payment subscriptions, and continuous roadmap support.',
  },
];

export default function SolutionsPage() {
  return (
    <div className="agency-site">
      <SiteNav />
      <main id="main-content">
        {/* HERO */}
        <section className="agency-page-hero agency-container">
          <p className="agency-eyebrow">
            <span /> OUR CAPABILITY AREAS
          </p>
          <h1>
            Build a stronger business.
            <br />
            <em>One useful change at a time.</em>
          </h1>
          <p>
            From your customer’s first impression to the operations behind your team, we help you choose, design, and build technology that saves your team time and helps you grow.
          </p>
          <div className="agency-actions">
            <a className="agency-button" href="/agent-mapper">
              Discuss what your business needs <ArrowUpRight size={18} />
            </a>
            <a className="agency-text-link" href="#engagement-models">
              View engagement structures <ArrowUpRight size={17} />
            </a>
          </div>
        </section>

        {/* DETAILED SERVICES LIST WITH CONTEXTUAL IMAGERY */}
        <section className="agency-container agency-section agency-services-detail-list">
          {services.map((s, index) => (
            <Reveal key={s.id} delay={index * 60}>
              <article id={s.id} className="agency-service-detail">
                <span className="agency-service-number">{s.number}</span>
                <div className="agency-service-body">
                  <p className="agency-eyebrow">{s.title.toUpperCase()}</p>
                  <h2>{s.short}</h2>
                  <p className="agency-service-desc">{s.description}</p>
                  
                  <div className="agency-service-question-box">
                    <strong>The question we solve together:</strong>
                    <p>{s.question}</p>
                  </div>

                  <div className="agency-service-scope-box">
                    <strong>Typical project deliverables:</strong>
                    <div className="agency-scope-tags">
                      {s.exampleScope.map((item) => (
                        <span key={item} className="scope-pill">
                          <Check size={14} /> {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <aside className="agency-service-aside">
                  <div className="service-visual-wrap">
                    <img
                      src={s.image}
                      alt={`${s.title} contextual illustration`}
                      width="600"
                      height="338"
                      loading="lazy"
                    />
                  </div>
                  <ul>
                    {s.capabilities.map((c) => (
                      <li key={c}>
                        <Check size={17} />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="service-deliverable-summary">
                    <span>WHAT WE WORK TOWARDS</span>
                    <p>{s.deliverable}</p>
                  </div>
                  <a className="agency-button-sm" href={`/agent-mapper?service=${s.id}`}>
                    Discuss this capability <ArrowUpRight size={16} />
                  </a>
                </aside>
              </article>
            </Reveal>
          ))}
        </section>

        {/* ENGAGEMENT MODELS */}
        <section className="agency-section agency-approach-band" id="engagement-models">
          <div className="agency-container">
            <Reveal className="agency-section-heading">
              <div>
                <p className="agency-eyebrow">PRACTICAL COLLABORATION</p>
                <h2>
                  Structured engagements.
                  <br />
                  <em>Predictable outcomes.</em>
                </h2>
              </div>
              <p>
                We do not believe in open-ended consulting bills. Every project starts with a defined scope, clear milestones, and verified deliverables.
              </p>
            </Reveal>

            <div className="agency-values" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
              {engagementModels.map((model, idx) => (
                <Reveal key={model.title} delay={idx * 60}>
                  <div className="engagement-card">
                    <div className="engagement-time">
                      <Clock size={16} /> {model.timeline}
                    </div>
                    <h3>{model.title}</h3>
                    <p>{model.description}</p>
                    <div className="engagement-deliverable">
                      <strong>Deliverable:</strong>
                      <span>{model.deliverable}</span>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* CLOSING CTA */}
        <AgencyCTA />
      </main>
      <SiteFooter />
    </div>
  );
}

