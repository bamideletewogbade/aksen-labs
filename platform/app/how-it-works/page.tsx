import type { Metadata } from 'next';
import { SiteFooter, SiteNav } from '@/components/site-chrome';
import { PageIntro } from '@/components/page-intro';
import { Reveal } from '@/components/agency-motion';
import { approach } from '@/lib/agency-content';
export const metadata: Metadata = {
  title: 'Our Approach | Aksen Labs',
  description:
    'Understand, design, build and help your team adopt it. A practical approach to digital transformation.',
};
export default function ApproachPage() {
  return (
    <div className="agency-site refresh-site">
      <SiteNav />
      <main id="main-content">
        <PageIntro
          variant="approach"
          label="OUR APPROACH"
          title={
            <>
              From agreed scope
              <br />
              <em>to everyday use.</em>
            </>
          }
          text="We understand the problem, agree what to build and test it with your team. Before launch, we plan training, responsibilities and ongoing support."
          image="agency-founders"
          alt="Entrepreneurs planning together with materials and a laptop"
          target="#process"
          action="See how we work"
        />
        <section id="process" className="agency-container refresh-process">
          {approach.map((step, index) => (
            <Reveal key={step.title} delay={index * 40}>
              <article>
                <span className="refresh-step-number">{step.number}</span>
                <div>
                  <h2>{step.title}</h2>
                  <p>{step.text}</p>
                </div>
                <div className="refresh-output">
                  <span className="refresh-small-index">
                    WHAT YOU GET
                  </span>
                  <p>{step.output}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </section>
        <section className="refresh-soft-band">
          <div className="agency-container refresh-section">
            <p className="agency-eyebrow">THROUGHOUT THE WORK</p>
            <div className="refresh-three-up">
              <Reveal>
                <h3>Visible progress</h3>
                <p>
                  Working demonstrations and agreed checkpoints keep decisions
                  grounded in what you can see and use.
                </p>
              </Reveal>
              <Reveal delay={50}>
                <h3>Your team involved</h3>
                <p>
                  The people doing the work help shape the system, test it and
                  learn to run it.
                </p>
              </Reveal>
              <Reveal delay={100}>
                <h3>Clear responsibilities</h3>
                <p>
                  We agree ownership, access, approvals and support. AI-assisted
                  work gets the review it needs.
                </p>
              </Reveal>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
