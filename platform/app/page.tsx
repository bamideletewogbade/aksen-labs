import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { SiteFooter, SiteNav } from '@/components/site-chrome';
import { Reveal } from '@/components/agency-motion';
import { HeroShowcase } from '@/components/hero-animations';
import { HomeFlow } from '@/components/home-flow';
import { MessageVolume, ProofGallery } from '@/components/home-story';
import { ServiceList } from '@/components/agency-sections';
import { approach } from '@/lib/agency-content';
import { freeTools } from '@/lib/product-catalog';

/**
 * The homepage is one argument told in order, not a set of panels.
 *
 *   the evening        a problem the reader had this week
 *   what happens       one enquiry followed end to end
 *   where the line is  the thing this company actually turns on
 *   what we do         the four service areas
 *   the proof          our own software, ours to show
 *   open now           free tools, no account, no conversation
 *   how we work        the four steps of an engagement
 *   why                what the agency is for
 *
 * Each section answers the question the one above it raises. Moving one means
 * checking that the question it answered is still asked.
 */

export default function Home() {
  return (
    <div className="agency-site refresh-site">
      <SiteNav />
      <main id="main-content">
        <HeroShowcase />

        {/* Start where the reader already is: a specific evening, and a number
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
                The rest were price checks, questions about delivery, people
                asking if you are still open, and people who never replied
                again. Somebody in your business read every one of them, most of
                them twice, and the three that mattered were in there somewhere.
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

        {/* The answer to the evening above, followed step by step so nobody has
            to take our word for who does what. */}
        <section
          id="one-enquiry"
          className="agency-container refresh-section refresh-flow"
        >
          <Reveal className="refresh-flow-head">
            <p className="agency-eyebrow">ONE ENQUIRY, START TO FINISH</p>
            <h2>
              The same night,
              <br />
              <em>handled while you sleep.</em>
            </h2>
            <p>
              This is one of those forty messages, step by step. The agent does
              the typing. Your team does the deciding. Watch it run, or tap any
              step to read it at your own pace.
            </p>
          </Reveal>
          <Reveal delay={60} direction="none">
            <HomeFlow />
          </Reveal>
          <Reveal delay={60} className="refresh-flow-foot">
            <p className="refresh-scenario-note">
              Fictional shop and fictional customer. A real thread uses your
              prices, your delivery areas and your own wording.
            </p>
            <Link className="agency-text-link" href="/business-agents">
              Try a business agent <ArrowUpRight size={18} />
            </Link>
          </Reveal>
        </section>

        {/* The argument the company turns on. It gets its own dark band because
            it is the objection every owner arrives with. */}
        <section className="refresh-line">
          <div className="agency-container refresh-line-grid">
            <Reveal>
              <p className="agency-eyebrow">WHERE THE LINE IS</p>
              <h2>
                It never sets a price.
                <br />
                It never takes a payment.
                <br />
                <em>It never promises a date.</em>
              </h2>
              <p>
                AI prepares, organises and explains. It does not confirm a
                payment, sign an agreement, publish anything or make a promise
                on your behalf. Not because we asked it nicely. Because the
                system does not give it the option.
              </p>
            </Reveal>
            <Reveal delay={80} className="refresh-line-split">
              <div>
                <span className="refresh-small-index">THE AGENT DOES</span>
                <ul>
                  <li>Answers questions from what you gave it</li>
                  <li>Asks for the details an order is missing</li>
                  <li>Writes the order down where the team can see it</li>
                  <li>Prepares the reply, the quote and the follow-up</li>
                  <li>Says it does not know, and calls a person in</li>
                </ul>
              </div>
              <div>
                <span className="refresh-small-index">A PERSON DOES</span>
                <ul>
                  <li>Sets the price and approves any discount</li>
                  <li>Confirms that money has actually arrived</li>
                  <li>Promises a delivery date to a customer</li>
                  <li>Signs anything, and releases anything</li>
                  <li>Decides when the answer needs judgement</li>
                </ul>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Only now the menu. A service list read before the story above is a
            list of words; read after it, each line has a picture behind it. */}
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
              The WhatsApp agent is one job out of four. Websites and shops,
              connected records, reporting you can act on, and products built
              from scratch. Start with the part you want to improve.
            </p>
          </Reveal>
          <ServiceList />
        </section>

        {/* Proof, and the only kind we honestly have: our own software. */}
        <section className="refresh-soft-band">
          <div className="agency-container refresh-section refresh-proof-section">
            <Reveal className="refresh-section-heading">
              <div>
                <p className="agency-eyebrow">WE RUN AKSEN ON IT</p>
                <h2>
                  Our shop window.
                  <br />
                  <em>And the workshop behind it.</em>
                </h2>
              </div>
              <p>
                This site is the public half. The other half is the workspace we
                use to run the agency: leads, projects, client records,
                approvals and drafts. One codebase. We use what we sell.
              </p>
            </Reveal>
            <ProofGallery />
          </div>
        </section>

        {/* The cheapest possible next step, offered before any conversation. */}
        <section className="agency-container refresh-section refresh-open">
          <Reveal className="refresh-section-heading">
            <div>
              <p className="agency-eyebrow">OPEN RIGHT NOW. NO ACCOUNT.</p>
              <h2>
                Do not take our word.
                <br />
                <em>Go and press the buttons.</em>
              </h2>
            </div>
            <p>
              One free tool and three walkthroughs. Nothing to install, no email
              to hand over, and you can decide what you think of us before we
              have spoken.
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
        </section>

        {/* The step list above answers what happens. This answers how a business
            gets from today to that, which is the next question it raises. */}
        <section className="refresh-soft-band">
          <div className="agency-container refresh-section refresh-start">
            <Reveal className="refresh-start-head">
              <div>
                <p className="agency-eyebrow">HOW A BUSINESS GETS THERE</p>
                <h2>
                  Four steps,
                  <br />
                  <em>and you agree each one.</em>
                </h2>
              </div>
              <Link className="agency-text-link" href="/how-it-works">
                Our approach <ArrowUpRight size={18} />
              </Link>
            </Reveal>
            <ol className="refresh-start-steps">
              {approach.map((step, index) => (
                <Reveal as="li" key={step.number} delay={index * 60}>
                  <span className="refresh-start-number">{step.number}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* Why any of this exists. Last, because a reader who has seen the work
            will read the reasons; a reader who has not, will not. */}
        <section className="agency-container refresh-section refresh-why">
          <Reveal className="refresh-why-copy">
            <p className="agency-eyebrow">WHY WE ARE BUILDING THIS</p>
            <h2>
              African businesses do not
              <br />
              <em>need technology for show.</em>
            </h2>
            <p>
              They need technology that helps real work move. Helping a customer
              buy. Helping a team find the right information. Helping an owner
              see what is actually happening. Turning a useful idea into
              something people can use.
            </p>
            <p>
              That is why Aksen is deliberately wider than a website company or
              a chatbot business. Those are pieces. The job is to understand
              what a business is trying to do, find where its current setup gets
              in the way, and build the improvement that is actually worth
              building.
            </p>
            <p className="refresh-why-plain">
              We do not have a customer case study to show you yet, and we are
              not going to invent one. What we can show you is working software,
              the free tools above, and a scope and price agreed before anyone
              spends anything.
            </p>
            <div className="agency-actions">
              <Link className="agency-button" href="/agent-mapper">
                Discuss your business <ArrowUpRight size={19} />
              </Link>
              <Link className="agency-text-link" href="/about">
                More about Aksen <ArrowUpRight size={17} />
              </Link>
            </div>
          </Reveal>
          <Reveal delay={80} className="refresh-why-mark">
            <blockquote>
              <p>
                Start with a business goal, build the right system, help the
                team adopt it, and use AI where it improves the result.
              </p>
              <cite>Ghana is home. The ambition travels.</cite>
            </blockquote>
          </Reveal>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
