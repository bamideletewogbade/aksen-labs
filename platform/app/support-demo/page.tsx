'use client';
import { useState } from 'react';
import { SiteNav, SiteFooter } from '@/components/site-chrome';
import { PageIntro } from '@/components/page-intro';
import { SupportChat } from '@/components/support-chat';
export default function SupportDemo() {
  const [scenario, setScenario] = useState<'commerce' | 'booking'>('commerce');
  return (
    <div className="agency-site refresh-site">
      <SiteNav />
      <main id="main-content">
        <PageIntro
          variant="workspace"
          label="CUSTOMER SUPPORT DEMO"
          title={<>Watch it refuse to guess.</>}
          text="Ask it something it can answer, then ask it something the business never told it. The second one is the interesting part: it should ask you for what is missing, or hand the whole thing to a person."
        />
        <section className="support-demo-layout">
          <div>
            <h2>Choose a business scenario</h2>
            <p>
              These are fictional businesses. Nothing you do here places an
              order, reserves a slot or sends a message through WhatsApp.
            </p>
            <fieldset className="support-scenarios">
              <legend>Try an example</legend>
              <label>
                <input
                  type="radio"
                  name="scenario"
                  checked={scenario === 'commerce'}
                  onChange={() => setScenario('commerce')}
                />{' '}
                Cedar Home · custom orders
              </label>
              <label>
                <input
                  type="radio"
                  name="scenario"
                  checked={scenario === 'booking'}
                  onChange={() => setScenario('booking')}
                />{' '}
                Cedar Studio · booking enquiries
              </label>
            </fieldset>
            <h3>What to try</h3>
            <p>
              Ask for a price or an appointment, then ask it to do something the
              business has not confirmed. A useful assistant should make that
              boundary clear.
            </p>
            <h3>What a live setup adds</h3>
            <p>
              Your approved knowledge, authenticated business systems, channel
              connections, staff handoff and agreed monitoring. We scope these
              around the way your team works.
            </p>
          </div>
          <section
            className="support-demo-chat"
            aria-label="Interactive support example"
          >
            <h2>
              {scenario === 'commerce' ? 'Cedar Home' : 'Cedar Studio'}{' '}
              <small>Fictional demo</small>
            </h2>
            <SupportChat key={scenario} scenario={scenario} />
          </section>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
