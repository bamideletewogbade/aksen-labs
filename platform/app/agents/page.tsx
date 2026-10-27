import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowUpRight, Check } from 'lucide-react';
import { SiteFooter, SiteNav } from '@/components/site-chrome';
import { Reveal } from '@/components/agency-motion';
import { AgentDeskGrid } from '@/components/agent-desk-grid';
import { FrontDeskAgent } from '@/components/front-desk-agent';
import { WhatsAppLink } from '@/components/whatsapp-link';
import { agentFaq, agentParts, softwareVsAgent } from '@/lib/agent-desks';

export const metadata: Metadata = {
  title: 'Agents | Aksen Labs',
  description:
    'Aksen Labs builds and runs agents that take work off your week: answering customers, taking orders, chasing paperwork. They work inside your prices and rules and pass you what needs a person. Talk to a live front desk agent.',
};

/**
 * The page that answers "what do you sell that is not just software".
 *
 *   the claim         work done, decisions kept
 *   try it            a live agent with tools, on a fictional shop
 *   the difference    software waits to be used; an agent picks up the work
 *   every desk        six jobs, each with what it hands over
 *   what it is made   the parts, including the model routing
 *   how you get one   the same three stages as the pricing page
 *   questions         the objections a careful owner raises
 *
 * Until 18 Oct 2026 this address redirected to /products#ai-examples. The
 * examples gallery is still there; this page is the argument they illustrate.
 */
export default function AgentsPage() {
  return (
    <div className="agency-site refresh-site">
      <SiteNav />
      <main id="main-content" className="ag-page">
        <section className="ag-hero">
          <div className="agency-container">
            <Reveal>
              <p className="agency-eyebrow">AGENTS</p>
              <h1>
                Agents that do the work.
                <br />
                <em>You keep the decisions.</em>
              </h1>
              <p className="ag-hero-lead">
                We build and run agents for the jobs that eat your week:
                answering customers, taking orders, chasing paperwork. They work
                inside your prices and rules, and pass you anything that needs a
                person.
              </p>
              <div className="agency-actions">
                <Link className="agency-button" href="#try-it">
                  Talk to a front desk agent <ArrowUpRight size={19} />
                </Link>
                <Link className="agency-text-link" href="/agent-mapper">
                  Get the free assessment <ArrowUpRight size={18} />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        <section id="try-it" className="agency-container ag-try">
          <Reveal className="ag-try-copy">
            <p className="agency-eyebrow">TRY IT. NO ACCOUNT.</p>
            <h2>A shop’s front desk, live.</h2>
            <p>
              This agent runs a made-up skincare shop in Accra. Ask it what a
              customer would. Watch what it checks before it answers, and what
              it passes to the owner instead of deciding.
            </p>
            <span className="refresh-small-index">IT CAN</span>
            <ul className="ag-checks">
              <li>
                <Check size={16} /> Look up prices and stock
              </li>
              <li>
                <Check size={16} /> Check the delivery fee for an area
              </li>
              <li>
                <Check size={16} /> Write up the order and work out the total
              </li>
              <li>
                <Check size={16} /> Pass anything else to the owner
              </li>
            </ul>
            <p className="ag-note">
              That is the whole list. There is no button for discounts, payments
              or promises, so it cannot be talked into them.
            </p>
          </Reveal>
          <Reveal delay={60} direction="none">
            <FrontDeskAgent />
          </Reveal>
        </section>

        <section className="refresh-soft-band">
          <div className="agency-container refresh-section">
            <Reveal className="refresh-section-heading">
              <div>
                <p className="agency-eyebrow">NOT MORE SOFTWARE</p>
                <h2>
                  Software waits to be used.
                  <br />
                  <em>An agent picks up the work.</em>
                </h2>
              </div>
              <p>
                Most businesses already own more software than anyone has time
                to run. We sell the work done, and stay to keep it done.
              </p>
            </Reveal>
            <Reveal delay={60}>
              <table className="ag-compare">
                <caption className="sr-only">
                  Software you buy compared with an agent we run
                </caption>
                <thead>
                  <tr>
                    <th scope="col">
                      <span className="sr-only">Topic</span>
                    </th>
                    <th scope="col">Software you buy</th>
                    <th scope="col">An agent we run</th>
                  </tr>
                </thead>
                <tbody>
                  {softwareVsAgent.map((row) => (
                    <tr key={row.topic}>
                      <th scope="row">{row.topic}</th>
                      <td data-label="Software">{row.software}</td>
                      <td data-label="Agent">{row.agent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Reveal>
          </div>
        </section>

        <section id="desks" className="agency-container refresh-section">
          <Reveal className="refresh-section-heading">
            <div>
              <p className="agency-eyebrow">AN AGENT FOR EVERY DESK</p>
              <h2>Start with the job that costs you most.</h2>
            </div>
            <p>
              Each one takes a single job, and names what it hands back. Most
              businesses start with one and add the next once it has earned its
              place.
            </p>
          </Reveal>
          <Reveal delay={60} direction="none">
            <AgentDeskGrid />
          </Reveal>
          <p className="refresh-scenario-note">
            The front desk above is a demonstration. The other five are the jobs
            we build for; we agree the exact scope with your business.
          </p>
        </section>

        <section className="ag-parts-band">
          <div className="agency-container refresh-section">
            <Reveal className="refresh-section-heading">
              <div>
                <p className="agency-eyebrow">WHAT EVERY AGENT IS MADE OF</p>
                <h2>Six parts. You decide what goes in the first one.</h2>
              </div>
            </Reveal>
            <div className="ag-parts">
              {agentParts.map((part, index) => (
                <Reveal key={part.title} delay={index * 40}>
                  <article>
                    <span className="refresh-small-index">0{index + 1}</span>
                    <h3>{part.title}</h3>
                    <p>{part.text}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="agency-container refresh-section ag-steps">
          <Reveal className="refresh-section-heading">
            <div>
              <p className="agency-eyebrow">HOW YOU GET ONE</p>
              <h2>See it on your business before you pay for it.</h2>
            </div>
            <Link className="agency-text-link" href="/pricing">
              See prices <ArrowUpRight size={18} />
            </Link>
          </Reveal>
          <ol className="ag-step-list">
            <li>
              <span className="refresh-small-index">01 · FREE</span>
              <h3>Assess</h3>
              <p>
                We look at where enquiries, orders or time slip away, and tell
                you which job an agent should take first, or whether one is
                worth building at all.
              </p>
            </li>
            <li>
              <span className="refresh-small-index">
                02 · QUOTED IN WRITING
              </span>
              <h3>Build</h3>
              <p>
                We set it up on your prices, rules and channels, and you test it
                with your own team before a customer sees it.
              </p>
            </li>
            <li>
              <span className="refresh-small-index">03 · MONTHLY</span>
              <h3>Run</h3>
              <p>
                We look after it: model costs inside a limit you set,
                corrections when it slips, and a monthly report on what it
                handled and what it passed to you.
              </p>
            </li>
          </ol>
        </section>

        <section className="refresh-soft-band">
          <div className="agency-container refresh-section ag-faq">
            <Reveal>
              <p className="agency-eyebrow">QUESTIONS OWNERS ASK</p>
              <h2>Before you let it talk to a customer.</h2>
            </Reveal>
            <div>
              {agentFaq.map((item) => (
                <details key={item.question}>
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="agency-container refresh-section refresh-why">
          <Reveal className="refresh-why-copy">
            <p className="agency-eyebrow">START HERE</p>
            <h2>
              Tell us the job that eats your week.
              <br />
              <em>We will show you the agent for it.</em>
            </h2>
            <p>
              The assessment is free. If an agent is worth building, you get a
              written quote and a demonstration on your own prices. If not, we
              say so.
            </p>
            <div className="agency-actions">
              <Link className="agency-button" href="/agent-mapper">
                Discuss your business <ArrowUpRight size={19} />
              </Link>
              <WhatsAppLink />
            </div>
          </Reveal>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
