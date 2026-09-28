'use client';

import { ArrowLeft, ArrowRight, Check, CircleHelp } from 'lucide-react';
import { NodeMark } from '@/components/ui/node-mark';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  emptyIntake,
  mapperSteps,
  stepProblem,
  symptomsFor,
  type DraftIntake,
  type MapperField,
  type MapperIntake,
  type MapperStep,
} from '@/lib/mapper-questions';
import { mapperFallback } from '@/lib/mapper-fallback';
import {
  FREE_ASSESSMENT,
  reportForLead,
  type CheckResult,
  type MapperReport,
} from '@/lib/mapper-report';

type Result = {
  report: MapperReport;
  packageTiming?: string;
  source: 'live' | 'rules';
  checks: CheckResult[];
  needsReview: boolean;
};

// The server may write, check, rewrite and check again. Its own deadline is
// under this, so the page only gives up when the connection has.
const WAIT_MS = 90_000;

function answerText(step: MapperStep, draft: DraftIntake) {
  return step.fields
    .map((field) => {
      const value = draft[field.id];
      if (field.kind === 'text') return typeof value === 'string' ? value : '';
      const picked = Array.isArray(value) ? value : value ? [value] : [];
      const labels = picked.map(
        (item) =>
          field.options(draft).find((option) => option.value === item)?.label ??
          item,
      );
      const otherValue =
        field.other && picked.includes(field.other.when)
          ? draft[field.other.id]
          : '';
      const other = typeof otherValue === 'string' ? otherValue : '';
      return labels.join(', ') + (other ? ` (${other})` : '');
    })
    .filter(Boolean)
    .join(' · ');
}

export function StandaloneMapper({
  pricingSelection,
}: {
  pricingSelection?: { name: string; price: string };
}) {
  const [includeSelection, setIncludeSelection] = useState(true);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<DraftIntake>(emptyIntake);
  const [showContact, setShowContact] = useState(false);
  const [contact, setContact] = useState({ name: '', email: '', company: '' });
  const [saveError, setSaveError] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle',
  );
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [waited, setWaited] = useState(0);
  const complete = step === mapperSteps.length;
  const current = mapperSteps[step];
  const blocked = current ? stepProblem(current, draft) : '';

  useEffect(() => {
    if (!complete) return;
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), WAIT_MS);
    const started = Date.now();
    const ticker = setInterval(() => setWaited(Date.now() - started), 1000);
    fetch('/api/recommendation', {
      signal: controller.signal,
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ intake: draft }),
    })
      .then((response) =>
        response.ok ? response.json() : Promise.reject(new Error('no report')),
      )
      .then((data) => {
        if (!cancelled) setResult(data as Result);
      })
      // The page still has to answer the visitor when the server cannot.
      // Every step already passed stepProblem, so the draft is a full intake.
      .catch(() => {
        if (!cancelled)
          setResult({
            report: mapperFallback(draft as MapperIntake),
            source: 'rules',
            checks: [],
            needsReview: true,
          });
      })
      .finally(() => {
        clearTimeout(timeout);
        clearInterval(ticker);
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      clearTimeout(timeout);
      clearInterval(ticker);
      controller.abort();
    };
    // The draft cannot change while complete (editing leaves this state
    // first), so listing it only satisfies the hook rules; it never refires.
  }, [complete, draft]);

  function set<K extends keyof DraftIntake>(key: K, value: DraftIntake[K]) {
    setDraft((currentDraft) => {
      const next = { ...currentDraft, [key]: value };
      // A new problem brings a new list of symptoms. Keep only those still on it.
      if (key === 'problem') {
        const allowed = symptomsFor(next.problem);
        next.symptoms = next.symptoms.filter((item) => allowed.includes(item));
      }
      return next;
    });
  }

  function toggle(
    field: Extract<MapperField, { kind: 'single' | 'multi' }>,
    value: string,
  ) {
    if (field.kind === 'single') {
      set(
        field.id,
        (draft[field.id] === value && field.optional ? '' : value) as never,
      );
      return;
    }
    const picked = draft[field.id] as string[];
    if (picked.includes(value))
      set(field.id, picked.filter((item) => item !== value) as never);
    else if (!field.max || picked.length < field.max)
      set(field.id, [...picked, value] as never);
  }

  function goTo(index: number) {
    setStep(index);
    setResult(null);
    setShowContact(false);
    setStatus('idle');
    setSaveError('');
    setAcknowledged(false);
  }

  function restart() {
    setDraft(emptyIntake());
    setContact({ name: '', email: '', company: '' });
    goTo(0);
  }

  async function save(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!result) return;
    setStatus('saving');
    setSaveError('');
    try {
      const response = await fetch('/api/opportunities', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...contact,
          intake: draft,
          answerFormat: 'diagnostic-v2',
          recommendation: result.report.headline,
          reportSummary: reportForLead(result.report),
          needsReview: result.needsReview,
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

  const report = result?.report;
  const loadingText =
    waited < 8000
      ? 'Reading your answers…'
      : waited < 22000
        ? 'Writing your starting point…'
        : 'Checking it against what you told us…';

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
          <span>
            {mapperSteps.length} short steps, then an optional enquiry
          </span>
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
            Tell us how the business runs today. We’ll write a short starting
            point, check it against your answers, and a person on our team will
            discuss scope and price with you if you send an enquiry.
          </p>
        </div>
        {mapperSteps.map(
          (answered, index) =>
            index < step && (
              <div className="thread-pair" key={answered.prompt}>
                <div className="user-message">
                  <span>{answerText(answered, draft)}</span>
                  <button
                    type="button"
                    onClick={() => goTo(index)}
                    aria-label={`Edit ${answered.prompt}`}
                  >
                    Edit
                  </button>
                </div>
              </div>
            ),
        )}
        {!complete ? (
          <div className="choice-panel">
            <p className="current-question mapper-step-prompt">
              {current.prompt}
            </p>
            <p className="mapper-choice-hint">{current.hint}</p>
            {current.fields.map((field) =>
              field.kind === 'text' ? (
                <label className="mapper-extra-label" key={field.id}>
                  {field.label} <span>(optional)</span>
                  {field.rows ? (
                    <textarea
                      value={draft[field.id] as string}
                      onChange={(event) =>
                        set(
                          field.id,
                          event.target.value.slice(0, field.limit) as never,
                        )
                      }
                      placeholder={field.placeholder}
                      rows={field.rows}
                    />
                  ) : (
                    <input
                      value={draft[field.id] as string}
                      onChange={(event) =>
                        set(
                          field.id,
                          event.target.value.slice(0, field.limit) as never,
                        )
                      }
                      placeholder={field.placeholder}
                    />
                  )}
                </label>
              ) : (
                <fieldset className="mapper-choice-fieldset" key={field.id}>
                  {current.fields.length > 1 && (
                    <legend className="mapper-field-legend">
                      {field.label}
                      {field.optional && <span> (optional)</span>}
                    </legend>
                  )}
                  {current.fields.length === 1 && (
                    <legend className="sr-only">{field.label}</legend>
                  )}
                  <div className="choice-grid">
                    {field.options(draft).map((option) => {
                      const value = draft[field.id];
                      const checked = Array.isArray(value)
                        ? value.includes(option.value)
                        : value === option.value;
                      const full =
                        field.kind === 'multi' &&
                        !!field.max &&
                        (value as string[]).length >= field.max &&
                        !checked;
                      return (
                        <label
                          className={`mapper-choice${full ? ' is-full' : ''}`}
                          key={option.value}
                        >
                          <input
                            type={
                              field.kind === 'single' ? 'radio' : 'checkbox'
                            }
                            name={field.id}
                            checked={checked}
                            disabled={full}
                            onChange={() => toggle(field, option.value)}
                            onClick={() => {
                              // A radio cannot be unticked by the browser; an
                              // optional one should be.
                              if (
                                field.kind === 'single' &&
                                field.optional &&
                                checked
                              )
                                toggle(field, option.value);
                            }}
                          />
                          <span>{option.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  {field.other &&
                    (Array.isArray(draft[field.id])
                      ? (draft[field.id] as string[]).includes(field.other.when)
                      : draft[field.id] === field.other.when) && (
                      <label className="mapper-extra-label">
                        {field.other.label}
                        <input
                          value={draft[field.other.id] as string}
                          onChange={(event) =>
                            set(
                              field.other!.id,
                              event.target.value.slice(0, 120) as never,
                            )
                          }
                          placeholder={field.other.placeholder}
                        />
                      </label>
                    )}
                </fieldset>
              ),
            )}
            <div className="mapper-step-actions">
              {step > 0 && (
                <button
                  type="button"
                  className="mapper-back"
                  onClick={() => goTo(step - 1)}
                >
                  <ArrowLeft size={15} /> Back
                </button>
              )}
              <button
                type="button"
                className="continue-button"
                disabled={!!blocked}
                title={blocked || undefined}
                onClick={() => {
                  // Set here rather than in the effect, so the first render
                  // of the finished state already says it is working.
                  if (step === mapperSteps.length - 1) {
                    setLoading(true);
                    setWaited(0);
                  }
                  setStep(step + 1);
                }}
              >
                {step === mapperSteps.length - 1
                  ? 'See my starting point'
                  : 'Continue'}{' '}
                <ArrowRight size={16} />
              </button>
            </div>
            <div className="mapper-progress">
              <span
                style={{
                  width: `${((step + 1) / mapperSteps.length) * 100}%`,
                }}
              />
            </div>
            <small>
              Step {step + 1} of {mapperSteps.length}
            </small>
          </div>
        ) : (
          <div className="recommendation-card" aria-busy={loading}>
            <div className="recommendation-head">
              <Check size={17} />
              <span>YOUR STARTING POINT</span>
            </div>
            {loading || !result || !report ? (
              <p className="pilot-loading">{loadingText}</p>
            ) : (
              <>
                <h3>{report.headline}</h3>
                {result.source === 'rules' && (
                  <p className="mapper-fallback-note">
                    This version is built from your choices by fixed rules,
                    because a written one could not be checked against your
                    answers just now. A person on our team reads every enquiry
                    before suggesting a scope.
                  </p>
                )}
                <p>{report.summary}</p>

                <section className="mapper-report-section">
                  <h4>Where it slips</h4>
                  <ul className="mapper-leaks">
                    {report.leaks.map((leak) => (
                      <li key={leak.where}>
                        <strong>{leak.where}</strong>
                        <span>{leak.evidence}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="mapper-report-section">
                  <h4>This week, on your own</h4>
                  <ul className="mapper-diy">
                    {report.doThisWeek.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>

                <div className="pilot-workflow">
                  <small>FIRST FIX WE COULD BUILD</small>
                  <strong>{report.firstFix.title}</strong>
                  <span>{report.firstFix.what}</span>
                  {report.firstFix.whyFirst && (
                    <span className="mapper-why">
                      Why first: {report.firstFix.whyFirst}
                    </span>
                  )}
                  <span className="mapper-package">
                    {report.firstFix.package === FREE_ASSESSMENT ? (
                      <>
                        Next step: the free assessment. No build is suggested
                        yet.
                      </>
                    ) : (
                      <>
                        Closest package: {report.firstFix.package}
                        {result.packageTiming
                          ? `, usually ${result.packageTiming}`
                          : ''}
                        . <Link href="/pricing">Indicative prices</Link>. A
                        person quotes after the free assessment.
                      </>
                    )}
                  </span>
                </div>
                <ol className="pilot-steps">
                  {report.steps.map((pilotStep) => (
                    <li key={pilotStep}>{pilotStep}</li>
                  ))}
                </ol>
                <dl className="pilot-guardrails">
                  <div>
                    <dt>How to measure it</dt>
                    <dd>{report.measure}</dd>
                  </div>
                  <div>
                    <dt>Leave until later</dt>
                    <dd>{report.notYet}</dd>
                  </div>
                  <div>
                    <dt>Your team stays in control</dt>
                    <dd>{report.humanControl}</dd>
                  </div>
                </dl>
                {report.questions.length > 0 && (
                  <section className="mapper-report-section">
                    <h4>What we would ask you on a call</h4>
                    <ul className="mapper-diy">
                      {report.questions.map((question) => (
                        <li key={question}>{question}</li>
                      ))}
                    </ul>
                  </section>
                )}
                {result.source === 'live' && result.checks.length > 0 && (
                  <div className="mapper-checks">
                    <small>CHECKED AGAINST YOUR ANSWERS</small>
                    <ul>
                      {result.checks.map((item) => (
                        <li key={item.id} data-verdict={item.verdict}>
                          {item.verdict === 'pass' ? (
                            <Check size={13} aria-label="Passed" />
                          ) : (
                            <CircleHelp
                              size={13}
                              aria-label="A person will check this"
                            />
                          )}
                          {item.label}
                        </li>
                      ))}
                    </ul>
                    {result.needsReview && (
                      <p>
                        Where the check was unsure, a person on our team reads
                        it before anything is suggested to you.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
            <div className="recommendation-actions">
              <button
                className="continue-button"
                disabled={loading || !report}
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
                  Send your answers and this starting point with a reply address
                  so we can discuss the work.
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
