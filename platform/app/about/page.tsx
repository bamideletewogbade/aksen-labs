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
          title={
            <>
              Built around
              <br />
              <em>African businesses.</em>
            </>
          }
          text="Aksen Labs is a Ghana-based digital transformation agency. We build websites, connect business systems and develop digital products to help African businesses prosper."
          image="agency-founders"
          alt="Two entrepreneurs collaborating in a contemporary design studio"
        />
        <section className="agency-container refresh-section refresh-scope">
          <Reveal>
            <p className="agency-eyebrow">WHY WE EXIST</p>
            <h2>
              Business potential
              <br />
              <em>deserves better tools.</em>
            </h2>
          </Reveal>
          <Reveal delay={60}>
            <p>
              A good business can be held back by a difficult buying experience,
              scattered information or work that depends on one overloaded
              person.
            </p>
            <p>
              We help you choose what to improve, build the solution and teach
              your team to use it. That might mean a better online shop, shared
              customer records, useful reporting or a new digital service.
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
              <p className="agency-eyebrow">AN AGENCY. ROOM TO INVENT.</p>
              <h2>
                Built for clients.
                <br />
                <em>Open to new ideas.</em>
              </h2>
              <p>
                Alongside client projects, we build our own. CV Forge started as
                a CV reviewer and builder and now covers the rest of a job
                search: finding roles, preparing each application against the
                real advert, and keeping track of what happened next.
              </p>
              <p>
                CV Forge is built and we use it ourselves; it does not have a
                public address yet. The free tools on the products page do work
                today.
              </p>
              <Link className="agency-text-link" href="/products">
                Explore our products <ArrowUpRight size={18} />
              </Link>
            </Reveal>
          </div>
        </section>
        <section className="agency-container refresh-section refresh-scope">
          <Reveal>
            <p className="agency-eyebrow">OUR PERSPECTIVE</p>
            <h2>
              Ghana is home.
              <br />
              <em>Ambition travels.</em>
            </h2>
          </Reveal>
          <Reveal delay={60}>
            <p>
              We’re based in Ghana and welcome opportunities in Nigeria, across
              Africa and beyond.
            </p>
            <p>
              Every market deserves its own understanding. We shape the work
              around your customers, connectivity, payment options and operating
              reality.
            </p>
          </Reveal>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
