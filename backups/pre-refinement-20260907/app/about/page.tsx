import type { Metadata } from 'next';
import { ArrowUpRight, Check, Compass, Globe, Sparkles, Building2 } from 'lucide-react';
import { SiteFooter, SiteNav } from '@/components/site-chrome';
import { Reveal } from '@/components/agency-motion';
import { AgencyCTA, PillarExplorer } from '@/components/agency-sections';

export const metadata: Metadata = {
  title: 'About Aksen Labs | Digital Transformation Agency',
  description:
    'A Ghana-based digital transformation agency helping African businesses grow and operate effectively with technology. Learn about our mission, approach, and values.',
};

export default function AboutPage() {
  return (
    <div className="agency-site">
      <SiteNav />
      <main id="main-content">
        {/* HERO */}
        <section className="agency-page-hero agency-container">
          <p className="agency-eyebrow">
            <span /> ABOUT AKSEN LABS
          </p>
          <h1>
            Practical technology.
            <br />
            <em>Built for African business.</em>
          </h1>
          <p>
            Our mission is helping African businesses grow and run efficiently by putting the right technology to work. We combine strategy, engineering, and hands-on staff training to build systems people actually use.
          </p>
        </section>

        {/* AGENCY STORY */}
        <section className="agency-section agency-container agency-intro" style={{ paddingTop: 0 }}>
          <Reveal>
            <p className="agency-eyebrow">THE CORE MISSION</p>
            <h2>
              Technology that helps your
              <br />
              <em>business grow.</em>
            </h2>
          </Reveal>
          <Reveal delay={80}>
            <p className="agency-intro-lead">Aksen Labs replaces clunky spreadsheets and disconnected tools with systems that work together.</p>
            <p>
              Too many African businesses are sold disjointed tools: a website that doesn’t connect to payments, a WhatsApp number that loses customer orders, or an internal spreadsheet that requires endless manual copy-pasting.
            </p>
            <p>
              We look at what a business is trying to achieve and where its current setup gets in the way. Then we design and build the right connected digital solution—whether that connects your storefront, Mobile Money checkout, and inventory, streamlines your internal operations, or becomes a new digital product.
            </p>
            <a className="agency-text-link" href="/solutions">
              Explore our four core service areas <ArrowUpRight size={18} />
            </a>
          </Reveal>
        </section>

        {/* IMAGE BAND */}
        <div className="agency-container">
          <img
            className="agency-image-band"
            src="/retail-commerce.png"
            alt="Retail entrepreneurs managing business operations together"
            loading="lazy"
            width="1672"
            height="941"
          />
        </div>

        {/* THE 3-TIER ARCHITECTURE */}
        <section className="agency-section agency-container">
          <Reveal className="agency-section-heading">
            <div>
              <p className="agency-eyebrow">HOW WE WORK WITH YOU</p>
              <h2>
                From targeted fixes to
                <br />
                <em>long-term capability.</em>
              </h2>
            </div>
            <p>
              We organize our work into three clear areas: setting the right strategy, delivering scoped milestones, and building reliable tools your team can count on.
            </p>
          </Reveal>

          <PillarExplorer />
        </section>

        {/* GUIDING PRINCIPLES */}
        <section className="agency-section agency-container">
          <Reveal className="agency-section-heading">
            <div>
              <p className="agency-eyebrow">WHAT GUIDES THE WORK</p>
              <h2>
                Rooted in your business.
                <br />
                <em>Focused on real results.</em>
              </h2>
            </div>
          </Reveal>
          <div className="agency-values">
            <Reveal>
              <h3>Understand before building</h3>
              <p>Your customers, team culture, and daily operating reality shape every choice. The most useful software starts with active listening.</p>
            </Reveal>
            <Reveal delay={60}>
              <h3>Connect the whole experience</h3>
              <p>Your digital storefront, customer WhatsApp messages, MoMo payments, and back-office records are parts of one customer journey.</p>
            </Reveal>
            <Reveal delay={120}>
              <h3>Build capability that lasts</h3>
              <p>We train your team, write clear operational manuals, and make sure your staff can run the system with confidence from day one.</p>
            </Reveal>
          </div>
        </section>

        {/* GEOGRAPHY & PERSPECTIVE */}
        <section className="agency-section agency-approach-band">
          <div className="agency-container agency-intro">
            <Reveal>
              <p className="agency-eyebrow">GEOGRAPHIC PERSPECTIVE</p>
              <h2>
                Ghana is home.
                <br />
                <em>Ambition crosses borders.</em>
              </h2>
            </Reveal>
            <Reveal delay={80}>
              <p>
                Ghana is our home and where we test our systems every day. But the operational challenges we solve exist across the continent.
              </p>
              <p>
                We work with clients in Nigeria, Kenya, Rwanda, and across Africa, tailoring every project to local currencies, payment rails (Paystack, Flutterwave, Mobile Money, bank transfers), and local buyer behavior.
              </p>
              <div style={{ marginTop: '24px' }}>
                <a className="agency-button" href="/agent-mapper">
                  Discuss an opportunity in your market <ArrowUpRight size={18} />
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* CLOSING CTA */}
        <AgencyCTA />
      </main>
      <SiteFooter />
    </div>
  );
}

