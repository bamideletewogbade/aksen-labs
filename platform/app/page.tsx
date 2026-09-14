/* oxlint-disable next/no-img-element -- Images use pre-encoded WebP sizes; the Workers deployment needs no image optimisation service. */
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { SiteFooter, SiteNav } from '@/components/site-chrome';
import { Reveal } from '@/components/agency-motion';
import { HeroShowcase } from '@/components/hero-animations';
import { ServiceList } from '@/components/agency-sections';
export default function Home() {
  return (
    <div className="agency-site refresh-site">
      <SiteNav />
      <main id="main-content">
        <HeroShowcase />
        {/* Second on the page, not last: how a business actually moves to
            working this way is the question the hero raises, and the service
            menu below means more once that path is visible. */}
        <section className="agency-container refresh-section refresh-home-ai">
          <Reveal>
            <p className="agency-eyebrow">AI, WITH A PURPOSE</p>
            <h2>
              Less repeated work.
              <br />
              <em>Your team in control.</em>
            </h2>
            <p>
              Nobody becomes an AI-first business in one step. We start where
              the work already happens and add the next piece once the last one
              has earned its place.
            </p>
            {/* Three real services, named by where they sit in an owner's week
                rather than by the technology, so the thread runs through the
                page without becoming the page. */}
            <ul className="refresh-ai-steps">
              <li>
                <strong>On WhatsApp</strong>
                An agent answers where your customers already are, and passes
                the real ones to a person.
              </li>
              <li>
                <strong>In the shop</strong>
                The order is taken, checked for what is missing, and handed to
                whoever fulfils it.
              </li>
              <li>
                <strong>On Monday morning</strong>
                A plain read on what sold, what stalled and what needs you.
              </li>
            </ul>
            <p>
              People keep the decisions that carry consequences: prices,
              payments and promises to customers.
            </p>
            <Link className="agency-text-link" href="/business-agents">
              Try a business agent <ArrowUpRight size={18} />
            </Link>
          </Reveal>
          <Reveal delay={80} className="refresh-process-note">
            <span className="refresh-small-index">HOW WE GET THERE</span>
            <h3>
              Understand the business.
              <br />
              Agree what to build.
            </h3>
            <p>
              We agree the goal, scope and price, then build and test the
              solution. Your team gets guidance on using it and a clear plan for
              support.
            </p>
            <Link className="agency-text-link" href="/how-it-works">
              Our approach <ArrowUpRight size={18} />
            </Link>
          </Reveal>
        </section>
        <section id="what-we-do" className="agency-container refresh-section">
          <Reveal className="refresh-section-heading">
            <div>
              <p className="agency-eyebrow">WHAT WE DO</p>
              <h2>
                Help customers buy.
                <br />
                <em>Help your team deliver.</em>
              </h2>
            </div>
            <p>
              Websites and shops, connected records, useful reports and custom
              applications. Start with the part of your business you want to
              improve.
            </p>
          </Reveal>
          <ServiceList />
        </section>
        <section className="refresh-connected">
          <div className="agency-container refresh-feature">
            <Reveal className="refresh-feature-image">
              <img
                src="/agency-commerce-system.webp"
                srcSet="/agency-commerce-system-768.webp 768w, /agency-commerce-system.webp 1440w"
                sizes="(max-width:760px) 100vw, 50vw"
                width="1440"
                height="960"
                alt="Connected glass and graphite modules representing commerce, payments and operations"
                loading="lazy"
              />
            </Reveal>
            <Reveal delay={80}>
              <p className="agency-eyebrow">
                CONNECT THE WORK BEHIND EACH ORDER
              </p>
              <h2>
                A better website
                <br />
                is just <em>the beginning.</em>
              </h2>
              <p>
                An enquiry becomes a quote, a confirmed order and a clear
                handover. We connect those steps so your team can see what needs
                attention and who takes it forward.
              </p>
              <Link className="agency-text-link" href="/order-demo">
                Try the order demo <ArrowUpRight size={18} />
              </Link>
              <p className="refresh-scenario-note">
                Fictional business example. Payments and fulfilment are
                simulated.
              </p>
            </Reveal>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
