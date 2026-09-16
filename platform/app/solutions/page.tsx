import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowUpRight, Check } from 'lucide-react';
import { SiteFooter, SiteNav } from '@/components/site-chrome';
import { PageIntro } from '@/components/page-intro';
import { Reveal } from '@/components/agency-motion';
import { IndustryExplorer } from '@/components/industry-explorer';
import { services } from '@/lib/agency-content';
export const metadata: Metadata = {
  title: 'Services | Aksen Labs',
  description:
    'Websites, online shops, business systems, reporting and custom applications. Explore what Aksen Labs can build for your business.',
};
export default function ServicesPage() {
  return (
    <div className="agency-site refresh-site">
      <SiteNav />
      <main id="main-content">
        <PageIntro
          variant="services"
          label="OUR SERVICES"
          title={<>Four kinds of work. Start with the one that hurts.</>}
          text="Help customers find and buy from you, connect the work your team already does, make sense of your own numbers, or turn an idea into something people can use. Scope and price are agreed in writing before anything gets built."
          image="agency-commerce-system"
          alt="Connected glass and graphite modules representing a business system"
          target="#capabilities"
          action="Explore the services"
        />
        <section
          id="capabilities"
          className="agency-container refresh-capabilities"
        >
          {services.map((service, index) => (
            <Reveal key={service.id} delay={index * 40}>
              <article className="refresh-capability" id={service.id}>
                <div className="refresh-capability-title">
                  <span className="refresh-small-index">{service.number}</span>
                  <h2>{service.title}</h2>
                  <p>{service.short}</p>
                </div>
                <div>
                  <ul>
                    {service.capabilities.map((item) => (
                      <li key={item}>
                        <Check size={16} />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    className="agency-text-link"
                    href={`/agent-mapper?service=${service.id}`}
                  >
                    Discuss your business <ArrowUpRight size={17} />
                  </Link>
                </div>
              </article>
            </Reveal>
          ))}
        </section>
        {/* Industries used to be its own nav item leading to this one explorer.
            It answers the same question as the services above it, from the
            other end: not what we do, but what it looks like where you work. */}
        <section
          id="industries"
          className="agency-container refresh-industries"
          aria-label="Explore by industry"
        >
          <div className="refresh-section-heading">
            <h2>Find the one that sounds like your week.</h2>
            <p>
              Find a familiar challenge and see what a more connected way of
              working could look like in your sector.
            </p>
          </div>
          <IndustryExplorer />
          <p className="refresh-scenario-note">
            Illustrative scenarios, not completed client projects. We agree the
            exact tools, connections and outcomes with your business.
          </p>
        </section>
        <section className="refresh-soft-band">
          <Reveal className="agency-container refresh-section refresh-scope">
            <div>
              <p className="agency-eyebrow">A SCOPE THAT FITS</p>
              <h2>One process first. The rest can wait.</h2>
            </div>
            <div>
              <p>
                A single improvement, several connected systems or a new
                product: we agree what’s needed, what success looks like and the
                scope before work begins.
              </p>
              <p>
                Timelines, budget, integrations and ongoing support depend on
                your project.
              </p>
              <Link className="agency-text-link" href="/how-it-works">
                How we deliver <ArrowUpRight size={18} />
              </Link>
            </div>
          </Reveal>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
