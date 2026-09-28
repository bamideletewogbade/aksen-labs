import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { SiteFooter, SiteNav } from '@/components/site-chrome';
import { Reveal } from '@/components/agency-motion';
import { HeroShowcase } from '@/components/hero-animations';
import { HomeFlow } from '@/components/home-flow';
import { MessageVolume } from '@/components/home-story';
import { ServiceList } from '@/components/agency-sections';
import { WhatsAppLink } from '@/components/whatsapp-link';
import { freeTools } from '@/lib/product-catalog';

/**
 * The homepage is one argument told in order, not a set of panels.
 *
 *   the evening        a problem the reader had this week
 *   what happens       one enquiry followed end to end
 *   where the line is  the thing this company actually turns on
 *   what we do         the four service areas
 *   open now           free tools, no account, no conversation
 *   start here         the free assessment, and how to ask for it
 *
 * Each section answers the question the one above it raises. Moving one means
 * checking that the question it answered is still asked.
 *
 * Cut on 28 Sep 2026 because the page ran to about ten screens: a gallery of
 * our own admin screens (it repeated the free tools and showed an owner our
 * back office, not their problem), a generic four-step process, and a "why we
 * exist" essay. The closing section now makes the one offer that starts every
 * engagement, the free assessment.
 */

export default function Home() {
  return (
    <div className="agency-site refresh-site">
      <SiteNav />
      <main id="main-content">
        <HeroShowcase />

        {/* 1. Start where the reader already is: a specific evening, and a number
            they can check against their own phone. */}
        <section className="refresh-problem">
          <div className="agency-container refresh-problem-grid">
            <Reveal>
              <p className="agency-eyebrow">THE EVENING THIS IS ABOUT</p>
              <h2>
                Forty messages.
                <br />
                <em>Three were orders.</em>
              </h2>
              <p>
                The rest were price checks, delivery questions, “are you still
                open?” and people who never replied. Someone read every one,
                most of them twice, to find the three that mattered.
              </p>
              <p className="refresh-problem-line">
                That is not a technology problem. It is an evening problem.
              </p>
            </Reveal>
            <Reveal delay={80} direction="none">
              <MessageVolume />
            </Reveal>
          </div>
        </section>

        {/* 2. The answer to the evening above, followed step by step so nobody has
            to take our word for who does what. */}
        <section
          id="one-enquiry"
          className="agency-container refresh-section refresh-flow"
        >
          <Reveal className="refresh-flow-head">
            <p className="agency-eyebrow">ONE ENQUIRY, START TO FINISH</p>
            <h2>One of those forty, handled while you slept.</h2>
            <p>
              The agent does the work. You see a finished order. Watch it run,
              or tap a step to read it at your own pace.
            </p>
          </Reveal>
          <Reveal delay={60} direction="none">
            <HomeFlow />
          </Reveal>
          <Reveal delay={60} className="refresh-flow-foot">
            <p className="refresh-scenario-note">
              A fictional shop. Yours would use your prices, your delivery areas
              and your wording.
            </p>
            <Link className="agency-text-link" href="/business-agents">
              Try a business agent <ArrowUpRight size={18} />
            </Link>
          </Reveal>
        </section>

        {/* 3. Automation first, the owner by exception. Rewritten 28 Sep 2026:
            the old "it never sets a price" band put a person in the middle of
            every order. It now leads with what runs on its own, and every line
            stays true to the system: it quotes the owner's listed prices (it
            does not invent one), and Paystack confirms the money (the model
            never reads a payment screenshot and decides). */}
        <section className="refresh-line">
          <div className="agency-container refresh-line-grid">
            <Reveal>
              <p className="agency-eyebrow">WHAT RUNS ON ITS OWN</p>
              <h2>
                It answers. It takes the order.
                <br />
                It sends the payment link.
                <br />
                <em>You step in only when it matters.</em>
              </h2>
              <p>
                Your prices, delivery areas and rules go in once. From then on
                the questions, the order details and the payment link run by
                themselves, day and night. Paystack confirms the money,
                including mobile money, so nobody checks screenshots. Anything
                off your list comes to you with the details already collected.
              </p>
            </Reveal>
            <Reveal delay={80} className="refresh-line-split">
              <div>
                <span className="refresh-small-index">RUNS ON ITS OWN</span>
                <ul>
                  <li>Answers from your prices and policies</li>
                  <li>Collects every detail an order needs</li>
                  <li>Writes the order where the team can see it</li>
                  <li>Sends the payment link and the receipt</li>
                  <li>Tells you the order is paid and ready</li>
                </ul>
              </div>
              <div>
                <span className="refresh-small-index">COMES TO YOU</span>
                <ul>
                  <li>A price that is not on your list</li>
                  <li>A discount or special request</li>
                  <li>A date you have not already set</li>
                  <li>A complaint or a refund</li>
                  <li>Anything it is not sure about</li>
                </ul>
              </div>
            </Reveal>
          </div>
        </section>

        {/* 4. The rest of what we build, for the reader whose problem is not the
            WhatsApp backlog. */}
        <section id="what-we-do" className="agency-container refresh-section">
          <Reveal className="refresh-section-heading">
            <div>
              <p className="agency-eyebrow">WHAT AKSEN DOES</p>
              <h2>
                Four kinds of work. Start with the one that costs you most.
              </h2>
            </div>
            <p>
              The WhatsApp agent is one of them. From Ghana, we build websites
              and shops, the systems behind them, simple reporting, and new
              digital products for businesses across Africa.
            </p>
          </Reveal>
          <ServiceList />
        </section>

        {/* 5. The cheapest next step, offered before any conversation. */}
        <section className="refresh-soft-band">
          <div className="agency-container refresh-section refresh-open">
            <Reveal className="refresh-section-heading">
              <div>
                <p className="agency-eyebrow">OPEN NOW. NO ACCOUNT.</p>
                <h2>
                  Don’t take our word.
                  <br />
                  <em>Press the buttons.</em>
                </h2>
              </div>
              <p>
                One free tool and three walkthroughs. No install, no email, and
                you can judge us before we have spoken.
              </p>
            </Reveal>
            <div className="refresh-open-grid">
              {freeTools.map((tool, index) => (
                <Reveal key={tool.slug} delay={index * 50}>
                  <Link href={tool.href} className="refresh-open-card">
                    <span className={`refresh-open-kind is-${tool.kind}`}>
                      {tool.status}
                    </span>
                    <h3>{tool.name}</h3>
                    <p>{tool.description}</p>
                    <span className="refresh-open-action">
                      {tool.action} <ArrowUpRight size={17} />
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* 6. The one offer that starts every engagement, and two ways to ask for
            it. The promises are the ones the pricing page makes; keep them in
            step with lib/pricing.ts. */}
        <section className="agency-container refresh-section refresh-why">
          <Reveal className="refresh-why-copy">
            <p className="agency-eyebrow">START HERE</p>
            <h2>
              A free assessment.
              <br />
              <em>Then you decide.</em>
            </h2>
            <p>
              We look at how your business runs today and find where orders,
              customers or time are slipping. It costs nothing. If a fix is
              worth building, you get a written quote. If not, we say so.
            </p>
            <ul className="refresh-why-promises">
              <li>You see it working before you commit to it.</li>
              <li>You set the prices and rules once. It works inside them.</li>
              <li>Scope and price are agreed in writing before work starts.</li>
            </ul>
            <div className="agency-actions">
              <Link className="agency-button" href="/agent-mapper">
                Discuss your business <ArrowUpRight size={19} />
              </Link>
              <WhatsAppLink />
            </div>
          </Reveal>
          <Reveal delay={80} className="refresh-why-mark">
            <blockquote>
              <p>
                I would rather show you the thing running than tell you what it
                could do.
              </p>
              <cite>Accra. Built in the open.</cite>
            </blockquote>
          </Reveal>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
