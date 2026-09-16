/* oxlint-disable next/no-img-element -- Images use pre-encoded WebP sizes; the Workers deployment needs no image optimisation service. */
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowUpRight } from 'lucide-react';
import { SiteFooter, SiteNav } from '@/components/site-chrome';
import { PageIntro } from '@/components/page-intro';
import { Reveal } from '@/components/agency-motion';
export const metadata: Metadata = {
  title: 'About Aksen Labs',
  description:
    'A Ghana-based digital transformation agency building websites, connected business systems and digital products for African businesses.',
};
export default function AboutPage() {
  return (
    <div className="agency-site refresh-site">
      <SiteNav />
      <main id="main-content">
        <PageIntro
          variant="about"
          label="ABOUT AKSEN LABS"
          title={<>A digital studio, built in Accra.</>}
          text="Aksen Labs builds websites, connects the systems a business already runs on, and develops digital products. You deal directly with the people building your project, and the scope and price are agreed in writing before anything starts."
          image="agency-founders"
          alt="Two entrepreneurs collaborating in a contemporary design studio"
        />
        <section className="agency-container refresh-section refresh-scope">
          <Reveal>
            <p className="agency-eyebrow">WHAT GETS IN THE WAY</p>
            <h2>Most businesses are not held back by their idea.</h2>
          </Reveal>
          <Reveal delay={60}>
            <p>
              They are held back by a checkout nobody finishes, information
              sitting in four places, or one person who is the only one who
              knows how something works. None of that is interesting, and all of
              it is expensive.
            </p>
            <p>
              The job is working out which of those is actually costing you
              money, building the fix, and leaving your team able to run it
              without me. Sometimes that is a shop. Sometimes it is shared
              customer records, reporting that tells you something you did not
              know, or a service you did not offer before.
            </p>
            <Link className="agency-text-link" href="/solutions">
              Explore our services <ArrowUpRight size={18} />
            </Link>
          </Reveal>
        </section>
        <section className="refresh-connected">
          <div className="agency-container refresh-feature">
            <Reveal className="refresh-feature-image">
              <img
                src="/agency-intelligence.webp"
                width="1440"
                height="960"
                loading="lazy"
                alt="A glass core and connected layers representing reusable digital tools"
              />
            </Reveal>
            <Reveal delay={60}>
              <p className="agency-eyebrow">CLIENT WORK, AND OUR OWN</p>
              <h2>Client work pays for it. Building our own keeps it sharp.</h2>
              <p>
                CV Forge began as a CV reviewer and now covers the rest of a job
                search: finding roles, preparing each application against the
                actual advert, and keeping a record of what came of it.
              </p>
              <p>
                It is built and in use. A public address is coming, so it is not
                something you can open today. The free tools on the products
                page are live right now.
              </p>
              <Link className="agency-text-link" href="/products">
                Explore our products <ArrowUpRight size={18} />
              </Link>
            </Reveal>
          </div>
        </section>
        <section className="agency-container refresh-section refresh-scope">
          <Reveal>
            <p className="agency-eyebrow">WHERE WE WORK</p>
            <h2>Based in Ghana, open to anywhere we can actually deliver.</h2>
          </Reveal>
          <Reveal delay={60}>
            <p>
              Nigeria, elsewhere in Africa, and further out where the fit is
              right. We scope each market properly before taking work in it.
            </p>
            <p>
              Every market has its own habits. Which channels customers actually
              message on, what the connectivity is like, how people expect to
              pay. That shapes a build far more than any choice of framework
              does.
            </p>
          </Reveal>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
