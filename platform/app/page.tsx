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
 *   what this is       who we are, before any pitch
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

        {/* The hero makes a promise, which raises "who is saying this?". That
            used to go unanswered until the About page, so a reader met the
            forty-messages problem before they knew whose problem we were
            solving. This says what the company is in plain words first.

            It also breaks the two-line heading pattern the rest of the page
            uses on purpose. Every other section opens with a clause and a
            turn; if this one did too, the page would read as a rhythm rather
            than as somebody talking. */}
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

        {/* 3. The argument the company turns on. It gets its own dark band because
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

        {/* 4. What Aksen Is & The Four Capability Areas. */}
        <section id="what-we-do" className="agency-container refresh-section">
          <Reveal className="refresh-section-heading">
            <div>
              <p className="agency-eyebrow">WHAT AKSEN DOES</p>
              <h2>Four areas, and you do not have to buy all four.</h2>
            </div>
            <p>
              The WhatsApp assistant is one job out of four. Aksen Labs is a
              digital transformation agency based in Ghana. We rebuild how
              your business actually runs: customer experience and commerce,
              business systems and operations, data and insight, and custom
              digital products.
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
                <h2>This site is half of it. Here is the other half.</h2>
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
                <h2>Four steps, and you sign off on each one.</h2>
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
            <p className="agency-eyebrow">WHY THIS EXISTS</p>
            <h2>
              African businesses are built on relentless ambition.
              <br />
              <em>The systems they run on should match that energy.</em>
            </h2>
            <p>
              Across Accra, Lagos and beyond, founders build thriving companies
              against real friction: fragmented tools, manual message backlogs,
              unreliable syncs, and software built for San Francisco instead of
              West Africa.
            </p>
            <p>
              We started Aksen Labs to change that. Not with generic advice or
              bloated enterprise contracts, but with dependable, connected
              technology built for how African commerce actually works. We work
              with the door open: the tools on this site, our walkthroughs, and
              our technical notes are shared in public.
            </p>
            <p className="refresh-why-plain">
              Clients who partner with us get the exact same deal: you see
              working software running before you commit, human judgement
              remains firmly in control of critical decisions, and scope and
              pricing are agreed in writing before anyone spends a cedi.
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
