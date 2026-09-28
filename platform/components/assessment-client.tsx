'use client';

import { useEffect, useState } from 'react';
import { RoadmapView, type ClientState } from '@/components/assessment-desk';

/**
 * The window shared on a video call. It holds no data of its own: it asks the
 * assessment window for the current state and shows only what that state
 * carries, which by construction excludes the lead list, private notes, Jev's
 * reading and any draft not yet released. Sharing this window instead of the
 * whole screen is what keeps other clients' names off the call.
 */
export function AssessmentClient() {
  const [state, setState] = useState<ClientState | null>(null);

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel('aksen-assessment');
    channel.onmessage = (event) => {
      if (event.data?.type === 'state')
        setState(event.data.state as ClientState);
    };
    channel.postMessage({ type: 'hello' });
    const bye = () => channel.postMessage({ type: 'bye' });
    window.addEventListener('beforeunload', bye);
    return () => {
      bye();
      window.removeEventListener('beforeunload', bye);
      channel.close();
    };
  }, []);

  const when = (iso: string) =>
    iso
      ? new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })
      : '';

  return (
    <div className="as-client">
      <header>
        <span className="as-client-mark">a</span>
        <div>
          <strong>Aksen Labs</strong>
          <small>
            Free assessment{state?.business ? ` · ${state.business}` : ''}
          </small>
        </div>
      </header>

      {!state && (
        <main className="as-client-wait">
          <p>Waiting for the assessment window.</p>
          <small>Keep the assessment open in the other window.</small>
        </main>
      )}

      {state?.step === 'start' && (
        <main className="as-client-intro">
          <h1>{state.business ? `Welcome, ${state.business}` : 'Welcome'}</h1>
          <p>
            A few questions about how your business runs today. There are no
            wrong answers, and this costs you nothing.
          </p>
          <ol>
            <li>How customers reach you now</li>
            <li>Where things slip on a busy day</li>
            <li>What that costs you</li>
            <li>A short roadmap, with things you can do yourself this week</li>
          </ol>
        </main>
      )}

      {state?.step === 'ask' && state.question && (
        <main className="as-client-question">
          <p className="as-client-progress">
            Question {state.question.index} of {state.question.total}
          </p>
          <h1>{state.question.prompt}</h1>
          {(state.channels.length > 0 || state.goals.length > 0) && (
            <ul className="as-client-chips">
              {[...state.channels, ...state.goals].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
          {state.answer && (
            <blockquote>
              <small>What you said</small>
              {state.answer}
            </blockquote>
          )}
        </main>
      )}

      {(state?.step === 'roadmap' || state?.step === 'finish') &&
        (state.roadmap ? (
          <main>
            <RoadmapView business={state.business} roadmap={state.roadmap} />
            {state.step === 'finish' && state.nextAction && (
              <aside className="as-client-next">
                <small>Agreed next step</small>
                <strong>{state.nextAction}</strong>
                {state.followUpAt && <span>{when(state.followUpAt)}</span>}
              </aside>
            )}
          </main>
        ) : (
          <main className="as-client-wait">
            <p>Putting your roadmap together.</p>
            <small>
              It is written from what you told us, and checked before you see
              it.
            </small>
          </main>
        ))}

      {state?.step === 'done' && (
        <main className="as-client-wait">
          <p>Thank you{state.business ? `, ${state.business}` : ''}.</p>
          {state.nextAction && (
            <small>
              Next: {state.nextAction}
              {state.followUpAt ? `, ${when(state.followUpAt)}` : ''}
            </small>
          )}
        </main>
      )}
    </div>
  );
}
