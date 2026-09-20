'use client';

import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { NodeMark } from '@/components/ui/node-mark';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { workflowSuggestion } from '@/lib/workflow-suggestion';
import { mapperQuestions, type MapperAnswers } from '@/lib/mapper-questions';
import { mapperFallback } from '@/lib/mapper-fallback';

type Pilot = {
  title: string;
  summary: string;
  firstWorkflow: string;
  steps: string[];
  firstMetric: string;
  humanControl: string;
};

export function StandaloneMapper({
  pricingSelection,
}: {
  pricingSelection?: { name: string; price: string };
}) {
  const [includeSelection, setIncludeSelection] = useState(true);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<MapperAnswers>([[], [], []]);
  const [selected, setSelected] = useState<string[]>([]);
  const [otherMarket, setOtherMarket] = useState('');
  const [otherTools, setOtherTools] = useState('');
  const [example, setExample] = useState('');
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
  const complete = step === mapperQuestions.length;
  const title =
    pilot?.title ||
    (answers[0].length === 1
      ? workflowSuggestion(answers[0][0])
      : 'Business improvement scoping plan');

  useEffect(() => {
    if (!complete) return;
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    fetch('/api/recommendation', {
      signal: controller.signal,
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        answers,
        otherMarket: answers[1].includes('Another African country')
          ? otherMarket
          : '',
        otherTools: answers[2].includes('Something else') ? otherTools : '',
        example,
      }),
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
        if (!cancelled) {
          setPilot(mapperFallback(answers));
          setPilotState('fallback');
        }
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      cancelled = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [complete, answers, otherMarket, otherTools, example]);

  function toggle(option: string) {
    const question = mapperQuestions[step];
    const exclusive = 'exclusive' in question ? question.exclusive : null;
    setSelected((current) => {
      if (current.includes(option))
        return current.filter((item) => item !== option);
      if (option === exclusive) return [option];
      return [...current.filter((item) => item !== exclusive), option];
    });
  }

  function continueFromQuestion() {
    if (!selected.length) return;
    const next = answers.map((answer, index) =>
      index === step ? selected : answer,
    ) as MapperAnswers;
    setAnswers(next);
    if (step === mapperQuestions.length - 1) setPilotState('loading');
    setStep(step + 1);
    setSelected(next[step + 1] || []);
  }

  function editQuestion(index: number) {
    setStep(index);
    setSelected(answers[index]);
    setPilot(null);
    setPilotState('idle');
    setShowContact(false);
    setStatus('idle');
    setSaveError('');
    setAcknowledged(false);
  }

  function restart() {
    setAnswers([[], [], []]);
    setSelected([]);
    setOtherMarket('');
    setOtherTools('');
    setExample('');
    setStep(0);
    setShowContact(false);
    setStatus('idle');
    setPilot(null);
    setPilotState('idle');
    setContact({ name: '', email: '', company: '' });
    setSaveError('');
    setAcknowledged(false);
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
          otherMarket: answers[1].includes('Another African country')
            ? otherMarket
            : '',
          otherTools: answers[2].includes('Something else') ? otherTools : '',
          example,
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
          <span>Three short steps, then an optional enquiry</span>
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
            Choose all the goals and tools that fit. We’ll suggest where to
            begin; a person on our team will discuss the scope and price with
            you if you send an enquiry.
          </p>
        </div>
        {answers.map(
          (answer, index) =>
            index < step && (
              <div className="thread-pair" key={index}>
                <div className="user-message">
                  <span>
                    {answer.join(', ')}
                    {index === 1 &&
                    answer.includes('Another African country') &&
                    otherMarket
                      ? ` (${otherMarket})`
                      : ''}
                    {index === 2 && answer.includes('Something else') && otherTools
                      ? ` (${otherTools})`
                      : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => editQuestion(index)}
                    aria-label={`Edit ${mapperQuestions[index].prompt}`}
                  >
                    Edit
                  </button>
                </div>
                {index + 1 < mapperQuestions.length && index + 1 < step && (
                  <div className="agent-message compact">
                    <span>AK</span>
                    <p>{mapperQuestions[index + 1].prompt}</p>
                  </div>
                )}
              </div>
            ),
        )}
        {!complete ? (
          <div className="choice-panel">
            <fieldset className="mapper-choice-fieldset">
              <legend className="current-question">
                {mapperQuestions[step].prompt}
              </legend>
              <p className="mapper-choice-hint">{mapperQuestions[step].hint}</p>
              <div className="choice-grid">
                {mapperQuestions[step].options.map((option) => (
                  <label className="mapper-choice" key={option}>
                    <input
                      type="checkbox"
                      checked={selected.includes(option)}
                      onChange={() => toggle(option)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            {step === 1 && selected.includes('Another African country') && (
              <label className="mapper-extra-label">
                Which country or countries?
                <input
                  value={otherMarket}
                  onChange={(event) =>
                    setOtherMarket(event.target.value.slice(0, 120))
                  }
                  placeholder="For example, Côte d’Ivoire and Senegal"
                />
              </label>
            )}
            {step === 2 &&
              selected.includes('Something else') && (
                <label className="mapper-extra-label">
                  What else do you use?
                  <input
                    value={otherTools}
                    onChange={(event) =>
                      setOtherTools(event.target.value.slice(0, 120))
                    }
                    placeholder="For example, a booking app or paper records"
                  />
                </label>
              )}
            {step === 2 && (
              <label className="mapper-extra-label">
                One real example we should understand <span>(optional)</span>
                <textarea
                  value={example}
                  onChange={(event) =>
                    setExample(event.target.value.slice(0, 600))
                  }
                  placeholder="For example, customers ask for stock on WhatsApp, then someone checks a spreadsheet before replying."
                  rows={3}
                />
              </label>
            )}
            <div className="mapper-step-actions">
              {step > 0 && (
                <button
                  type="button"
                  className="mapper-back"
                  onClick={() => editQuestion(step - 1)}
                >
                  <ArrowLeft size={15} /> Back
                </button>
              )}
              <button
                type="button"
                className="continue-button"
                disabled={
                  !selected.length ||
                  (step === 1 &&
                    selected.includes('Another African country') &&
                    !otherMarket.trim()) ||
                  (step === 2 &&
                    selected.includes('Something else') &&
                    !otherTools.trim())
                }
                onClick={continueFromQuestion}
              >
                {step === mapperQuestions.length - 1
                  ? 'See a starting point'
                  : 'Continue'}{' '}
                <ArrowRight size={16} />
              </button>
            </div>
            <div className="mapper-progress">
              <span
                style={{
                  width: `${((step + 1) / mapperQuestions.length) * 100}%`,
                }}
              />
            </div>
            <small>
              Step {step + 1} of {mapperQuestions.length}
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
                {pilotState === 'fallback' && (
                  <p className="mapper-fallback-note">
                    The live advisor is unavailable, so this starting point is
                    based on the choices you made. Our team will review the
                    details before suggesting a scope.
                  </p>
                )}
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
                  Email address
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
                  Business or project <span>(optional)</span>
                  <input
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
