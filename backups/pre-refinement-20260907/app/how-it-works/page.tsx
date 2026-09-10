import type { Metadata } from 'next';
import { ArrowUpRight, Check, ShieldCheck, Users, Eye, Target, Sparkles } from 'lucide-react';
import { SiteFooter, SiteNav } from '@/components/site-chrome';
import { Reveal } from '@/components/agency-motion';
import { AgencyCTA } from '@/components/agency-sections';
import { approach } from '@/lib/agency-content';

export const metadata: Metadata = {
  title: 'Our Approach | Aksen Labs',
  description:
    'Understand the business, design the right solution, build it and help your team adopt it. How Aksen Labs delivers digital transformation.',
};

const principles = [
  {
    icon: Target,
    title: 'Business objective before technology stack',
    description: 'We never pitch software for the sake of technology. We start with the revenue you want to capture or the operational friction you need to remove.',
  },
  {
    icon: ShieldCheck,
    title: 'Strict human control & verified records',
    description: 'Where AI is applied, it assists with research, preparation, and structuring. Critical decisions, pricing commitments, and customer promises always remain with your team.',
  },
  {
    icon: Users,
    title: 'Adoption is the real deliverable',
    description: 'A system that your staff doesn’t use is a failed project. We train your people, observe live usage, and refine the interface until it feels like second nature.',
  },
  {
    icon: Eye,
    title: 'Transparent milestones and checkpoints',
    description: 'You see the work progress in working software, not 80-page slide decks. Every milestone has a clear demonstration and measurable criteria.',
  },
];

export default function ApproachPage() {
  return (
    <div className="agency-site">
      <SiteNav />
      <main id="main-content">
        {/* HERO */}
        <section className="agency-page-hero agency-container">
          <p className="agency-eyebrow">
            <span /> OUR METHODOLOGY
          </p>
          <h1>
            The business comes first.
            <br />
            <em>The technology follows.</em>
          </h1>
          <p>
            Lasting business improvement starts with understanding how your operation runs today. We work alongside you to turn that understanding into tools your customers love and your team actually uses.
          </p>
          <div className="agency-actions">
            <a className="agency-button" href="/agent-mapper">
              Map your first engagement <ArrowUpRight size={18} />
            </a>
          </div>
        </section>

        {/* EDITORIAL IMAGE BAND */}
        <div className="agency-container">
          <img
            className="agency-image-band"
            src="/professional-services-workflow.png"
            alt="Business professionals reviewing an operational plan together"
            width="1672"
            height="941"
          />
        </div>

        {/* 4 STAGES */}
        <section className="agency-section agency-container agency-approach-list">
          <div style={{ marginBottom: '40px' }}>
            <p className="agency-eyebrow">OUR 4-STAGE PROCESS</p>
            <h2>From the first conversation to a working system.</h2>
          </div>

          {approach.map((s, i) => (
            <Reveal key={s.title} delay={i * 60}>
              <article className="agency-approach-step">
                <span className="agency-step-index">0{i + 1}</span>
                <div>
                  <h2>{s.title}</h2>
                  <p className="agency-approach-lead">
                    <strong>{s.lead}</strong>
                  </p>
                  <p>{s.detail}</p>
                  <div className="agency-deliverable">
                    <Check size={20} />
                    <span>
                      <strong>Agreed output:</strong> {s.output}
                    </span>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </section>

        {/* WORKING PRINCIPLES */}
        <section className="agency-section agency-approach-band">
          <div className="agency-container">
            <Reveal className="agency-section-heading">
              <div>
                <p className="agency-eyebrow">HOW WE OPERATE</p>
                <h2>
                  Clear working principles.
                  <br />
                  <em>No surprises.</em>
                </h2>
              </div>
              <a className="agency-text-link" href="/agent-mapper">
                Discuss an engagement with us <ArrowUpRight size={18} />
              </a>
            </Reveal>

            <div className="agency-values" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              {principles.map((p, idx) => (
                <Reveal key={p.title} delay={idx * 50}>
                  <div className="principle-card">
                    <p.icon size={22} className="principle-icon" />
                    <h3>{p.title}</h3>
                    <p>{p.description}</p>
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

