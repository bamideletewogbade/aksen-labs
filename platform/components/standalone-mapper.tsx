'use client';

import { ArrowRight, Check, ChevronRight } from 'lucide-react';
import { NodeMark } from '@/components/ui/node-mark';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { workflowSuggestion } from '@/lib/workflow-suggestion';

type Pilot = {
  title: string;
  summary: string;
  firstWorkflow: string;
  steps: string[];
  firstMetric: string;
  humanControl: string;
};

const questions = [
  {
    prompt: 'What would you like your business to do better?',
    options: [
      'Sell online or improve the buying experience',
      'Serve customers better',
      'Connect internal work and systems',
      'Understand business performance',
      'Develop a new digital product',
      'Help me work out where to start',
    ],
  },
  {
    prompt: 'Where is your business based or operating?',
    options: [
      'Ghana',
      'Nigeria',
      'Kenya or East Africa',
      'South Africa or Southern Africa',
      'Another African country',
      'Multiple countries',
      'Beyond Africa / International',
    ],
  },
  {
    prompt: 'What does your current setup look like?',
    options: [
      'WhatsApp, phone and social media',
      'Website, email and basic invoicing',
      'Spreadsheets and manual handoffs',
      'Multiple disconnected tools and apps',
      'Starting something new',
      'Something else / not sure yet',
    ],
  },
];

export function StandaloneMapper({
  pricingSelection,
}: {
  pricingSelection?: { name: string; price: string };
}) {
  const [includeSelection, setIncludeSelection] = useState(true);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showContact, setShowContact] = useState(false);
  const [contact, setContact] = useState({ name: '', email: '', company: '' });
  const [saveError, setSaveError] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle',
  );
  const [pilot, setPilot] = useState<Pilot | null>(null);
  const [pilotState, setPilotState] = useState<
    'idle' | 'loading' | 'ready' | 'fallback'
  >('idle');
  const complete = step === questions.length;
  const title = pilot?.title || workflowSuggestion(answers[0] || '');

  useEffect(() => {
    if (!complete) return;
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    fetch('/api/recommendation', {
      signal: controller.signal,
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ answers }),
    })
      .then((response) =>
        response.ok
          ? response.json()
          : Promise.reject(new Error('no recommendation')),
      )
      .then((data) => {
        if (!cancelled) {
          setPilot((data as { recommendation: Pilot }).recommendation);
          setPilotState('ready');
        }
      })
      // The mapper still has to answer the visitor when the model is unreachable.
      .catch(() => {
        if (!cancelled) setPilotState('fallback');
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      cancelled = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [complete, answers]);

  function choose(answer: string) {
    if (step === questions.length - 1) setPilotState('loading');
    setAnswers((current) => [...current.slice(0, step), answer]);
    setStep((current) => current + 1);
  }

  function restart() {
    setAnswers([]);
    setStep(0);
    setShowContact(false);
    setStatus('idle');
    setPilot(null);
    setPilotState('idle');
  }

  async function save(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('saving');
    setSaveError('');
    try {
      const response = await fetch('/api/opportunities', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...contact,
          answers,
          answerFormat: 'goal-market-setup',
          recommendation: title,
          pricingPackage: includeSelection ? pricingSelection?.name : undefined,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        acknowledged?: boolean;
      };
      // Show the reason. Telling someone to try again when they have been asked
      // to wait only sends them back into the same answer.
      if (!response.ok) throw new Error(data.error || '');
      setAcknowledged(data.acknowledged === true);
      setStatus('saved');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '');
      setStatus('error');
    }
  }

  return (
    <div className="mapper-shell standalone">
      <div className="mapper-topline">
        {/* Was a robot face. This is the first thing a visitor meets on the
            page where they describe their business, and a cartoon robot
            promises the one thing the rest of the site argues against: a
            machine doing the deciding. */}
        <div className="agent-avatar">
          <NodeMark size={18} />
        </div>
        <div>
          <strong>Find your starting point</strong>
          <span>Three questions, then an optional enquiry</span>
        </div>
        <span className="online">
          <i /> ready
        </span>
      </div>
      {pricingSelection && includeSelection && (
        <div className="mapper-pricing-selection">
          <small>YOUR PRICING ENQUIRY</small>
          <strong>{pricingSelection.name}</strong>
          <span>{pricingSelection.price} · Indicative, subject to scope</span>
          <p>We’ll include this selection with your answers for the team.</p>
          <button type="button" onClick={() => setIncludeSelection(false)}>
            Remove selection
          </button>
        </div>
      )}
      <div className="mapper-thread" aria-live="polite">
        <div className="agent-message">
          <span>AK</span>
          <p>
            Choose what you want to improve. We’ll suggest a starting point
            based on your answers. Our team confirms the scope and price with
            you.
          </p>
        </div>
        {answers.map((answer, index) => (
          <div className="thread-pair" key={answer}>
            <div className="user-message">{answer}</div>
            {index + 1 < questions.length && index + 1 < step && (
              <div className="agent-message compact">
                <span>AK</span>
                <p>{questions[index + 1].prompt}</p>
              </div>
            )}
          </div>
        ))}
        {!complete ? (
          <div className="choice-panel">
            <p className="current-question">{questions[step].prompt}</p>
            <div className="choice-grid">
              {questions[step].options.map((option) => (
                <button key={option} onClick={() => choose(option)}>
                  {option}
                  <ChevronRight size={15} />
                </button>
              ))}
            </div>
            <div className="mapper-progress">
              <span
                style={{ width: `${((step + 1) / questions.length) * 100}%` }}
              />
            </div>
            <small>
              Question {step + 1} of {questions.length}
            </small>
          </div>
        ) : (
          <div
            className="recommendation-card"
            aria-busy={pilotState === 'loading'}
          >
            <div className="recommendation-head">
              <Check size={17} />
              <span>YOUR SUGGESTED STARTING POINT</span>
            </div>
            {pilotState === 'loading' ? (
              <p className="pilot-loading">
                Reading your answers and preparing a suggestion…
              </p>
            ) : (
              <>
                <h3>{title}</h3>
                {pilot ? (
                  <>
                    <p>{pilot.summary}</p>
                    <p className="pilot-workflow">
                      <strong>First improvement.</strong> {pilot.firstWorkflow}
                    </p>
                    <ol className="pilot-steps">
                      {pilot.steps.map((pilotStep) => (
                        <li key={pilotStep}>{pilotStep}</li>
                      ))}
                    </ol>
                    <dl className="pilot-guardrails">
                      <div>
                        <dt>How to measure progress</dt>
                        <dd>{pilot.firstMetric}</dd>
                      </div>
                      <div>
                        <dt>Your team stays in control</dt>
                        <dd>{pilot.humanControl}</dd>
                      </div>
                    </dl>
                  </>
                ) : (
                  <p>
                    Start by mapping your current process and choosing one
                    improvement to test. We’ll discuss your goal, operating
                    market and current setup before recommending what to build.
                  </p>
                )}
              </>
            )}
            <div className="recommendation-actions">
              <button
                className="continue-button"
                disabled={pilotState === 'loading'}
                onClick={() => setShowContact(true)}
              >
                Enquire about this <ArrowRight size={16} />
              </button>
              <button onClick={restart}>Start again</button>
            </div>
            {showContact && status !== 'saved' && (
              <form className="contact-continuation" onSubmit={save}>
                <p>
                  <strong>How can our team reach you?</strong>
                  <br />
                  Send your answers with a reply address so we can discuss the
                  work.
                </p>
                <label>
                  Your name
                  <input
                    required
                    value={contact.name}
                    onChange={(event) =>
                      setContact({ ...contact, name: event.target.value })
                    }
                  />
                </label>
                <label>
                  Work email
                  <input
                    required
                    type="email"
                    value={contact.email}
                    onChange={(event) =>
                      setContact({ ...contact, email: event.target.value })
                    }
                  />
                </label>
                <label>
                  Company or project
                  <input
                    required
                    value={contact.company}
                    onChange={(event) =>
                      setContact({ ...contact, company: event.target.value })
                    }
                  />
                </label>
                <button disabled={status === 'saving'}>
                  {status === 'saving' ? 'Sending…' : 'Send my enquiry'}{' '}
                  <ArrowRight size={15} />
                </button>
                <small className="mapper-privacy">
                  We use your details to reply to this enquiry.{' '}
                  <Link href="/privacy">How we handle your information</Link>.
                </small>
                {status === 'error' && (
                  <small role="alert">
                    {saveError ||
                      'We couldn’t confirm your enquiry. Please try again.'}
                  </small>
                )}
              </form>
            )}
            {status === 'saved' && (
              <div className="saved-state">
                <Check size={18} />
                <div>
                  <strong>We’ve received your enquiry.</strong>
                  <span>
                    {acknowledged
                      ? 'A confirmation is on its way to your email. A person will read your answers and reply to that address. No project has been booked yet.'
                      : 'A person will read your answers and reply by email to discuss the next step. No project has been booked yet.'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
