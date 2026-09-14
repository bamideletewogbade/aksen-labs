'use client';
import { useState } from 'react';
import { ResponseText } from '@/components/response-text';
import {
  orderScenarios,
  checkSpecification,
  nextOrderStage,
  type Scenario,
  type Specification,
  type OrderStage,
  type OrderAction,
} from '@/lib/order-demo';

const stages: OrderStage[] = [
  'enquiry',
  'review',
  'accepted',
  'paid',
  'production',
  'complete',
];
const labels: Record<OrderStage, string> = {
  enquiry: 'Enquiry',
  review: 'Quote review',
  accepted: 'Accepted',
  paid: 'Payment checked',
  production: 'Workshop',
  complete: 'Follow-up',
};
const actions: Record<
  OrderStage,
  { action: OrderAction; label: string } | null
> = {
  enquiry: { action: 'prepare', label: 'Prepare quote for review' },
  review: { action: 'accept', label: 'Simulate customer acceptance' },
  accepted: { action: 'verify', label: 'Simulate verified payment' },
  paid: { action: 'release', label: 'Approve demo workshop release' },
  production: { action: 'complete', label: 'Simulate collection' },
  complete: null,
};
const money = (pesewas: number) =>
  new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(
    pesewas / 100,
  );

export function OrderDemo() {
  const [scenario, setScenario] = useState<Scenario>('complete');
  const [spec, setSpec] = useState<Specification>({
    ...orderScenarios.complete,
  });
  const [stage, setStage] = useState<OrderStage>('enquiry');
  const [events, setEvents] = useState<string[]>([
    'Fictional enquiry received.',
  ]);
  const [draft, setDraft] = useState('');
  const [draftRole, setDraftRole] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [requestId, setRequestId] = useState('');
  const [logging, setLogging] = useState('');
  const check = checkSpecification(spec);
  function reset(next: Scenario) {
    setScenario(next);
    setSpec({ ...orderScenarios[next] });
    setStage('enquiry');
    setEvents(['Fictional enquiry received.']);
    setDraft('');
    setError('');
    setRequestId('');
    setLogging('');
  }
  function edit(key: keyof Specification, value: string) {
    setSpec((current) => ({
      ...current,
      [key]: key === 'finish' ? value : Number(value),
    }));
    setDraft('');
    setError('');
  }
  function advance() {
    const action = actions[stage];
    if (!action) return;
    try {
      const next = nextOrderStage(stage, action.action, spec);
      setStage(next);
      setEvents((current) => [
        ...current,
        `${labels[next]} — simulated by you.`,
      ]);
      setDraft('');
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not advance.');
    }
  }
  async function prepareDraft(task: 'enquiry' | 'handoff') {
    setBusy(true);
    setError('');
    setDraft('');
    setRequestId('');
    setLogging('');
    setDraftRole(
      task === 'enquiry' ? 'Enquiry interpreter' : 'Workshop handoff preparer',
    );
    try {
      const response = await fetch('/api/order-demo', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ scenario, spec, task }),
        signal: AbortSignal.timeout(45000),
      });
      setRequestId(response.headers.get('x-request-id') || '');
      setLogging(response.headers.get('x-log-status') || '');
      const data = (await response.json()) as {
        content?: string;
        error?: string;
      };
      if (!response.ok || !data.content)
        throw new Error(data.error || 'No draft returned.');
      setDraft(data.content);
    } catch (e) {
      setError(
        e instanceof Error && e.name === 'TimeoutError'
          ? 'Drafting timed out. The walkthrough is still available.'
          : e instanceof Error
            ? e.message
            : 'Drafting is unavailable.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="order-lab">
      <header className="order-heading">
        <div>
          <span className="order-eyebrow">CEDAR HOME · FICTIONAL BUSINESS</span>
          <h1>From enquiry to collection.</h1>
          <p>
            Walk through one shelf order. See where AI helps and where a person
            makes the decision.
          </p>
        </div>
        <button disabled={busy} onClick={() => reset(scenario)}>
          Restart demo
        </button>
      </header>
      <p className="order-notice">
        Demo only. No customer messages, payments or production orders are
        created. Progress lasts until you reload this page.
      </p>
      <fieldset className="order-scenarios" disabled={busy}>
        <legend>Choose an enquiry</legend>
        {(Object.keys(orderScenarios) as Scenario[]).map((key) => (
          <label key={key}>
            <input
              type="radio"
              name="order-scenario"
              checked={scenario === key}
              onChange={() => reset(key)}
            />
            {orderScenarios[key].label}
          </label>
        ))}
      </fieldset>
      <ol className="order-progress" aria-label="Order progress">
        {stages.map((s, index) => (
          <li
            key={s}
            aria-current={s === stage ? 'step' : undefined}
            className={index <= stages.indexOf(stage) ? 'reached' : ''}
          >
            <span>{index + 1}</span>
            {labels[s]}
          </li>
        ))}
      </ol>
      <div className="order-columns">
        <section className="order-panel">
          <span className="order-eyebrow">01 / ENQUIRY INTERPRETER</span>
          <h2>Make the request clear</h2>
          <blockquote>{orderScenarios[scenario].enquiry}</blockquote>
          <p>
            Confirm the details below with the customer. An unspecified unit is
            a question, not permission to guess.
          </p>
          <fieldset
            disabled={stage !== 'enquiry' || busy}
            className="order-fields"
          >
            <legend>Reviewed specifications</legend>
            <label>
              Width (cm)
              <input
                type="number"
                min="0"
                max="500"
                value={spec.width || ''}
                onChange={(e) => edit('width', e.target.value)}
                placeholder="Confirm units"
              />
            </label>
            <label>
              Depth (cm)
              <input
                type="number"
                min="0"
                max="500"
                value={spec.depth || ''}
                onChange={(e) => edit('depth', e.target.value)}
                placeholder="Confirm units"
              />
            </label>
            <label>
              Quantity
              <input
                type="number"
                min="1"
                max="10"
                step="1"
                value={spec.quantity}
                onChange={(e) => edit('quantity', e.target.value)}
              />
            </label>
            <div>
              <span>Finish</span>
              <div className="order-finishes">
                {['oak', 'black'].map((finish) => (
                  <label key={finish}>
                    <input
                      type="radio"
                      name="finish"
                      checked={spec.finish === finish}
                      onChange={() => edit('finish', finish)}
                    />
                    {finish}
                  </label>
                ))}
              </div>
            </div>
          </fieldset>
          <button
            disabled={busy || stage !== 'enquiry'}
            onClick={() => prepareDraft('enquiry')}
          >
            Ask AI to review this enquiry
          </button>
        </section>
        <section className="order-panel">
          <span className="order-eyebrow">
            02 / SPECIFICATION CHECKER · RULES
          </span>
          <h2>A quote you can explain</h2>
          <p>
            Approved demo catalogue: 80 × 30 cm shelf, oak or black,{' '}
            {money(45000)} each. Collection only.
          </p>
          {check.issues.length ? (
            <ul className="order-issues">
              {check.issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          ) : (
            <p className="order-ready">
              Specifications match the approved demo catalogue.
            </p>
          )}
          <dl className="order-totals">
            <div>
              <dt>Illustrative total</dt>
              <dd>
                {check.totalPesewas === null
                  ? 'Needs clarification'
                  : money(check.totalPesewas)}
              </dd>
            </div>
            <div>
              <dt>Production date</dt>
              <dd>Workshop must confirm</dd>
            </div>
            <div>
              <dt>Payment</dt>
              <dd>
                {stages.indexOf(stage) >= 3
                  ? 'Verified — simulation only'
                  : 'Unverified'}
              </dd>
            </div>
          </dl>
          <p className="order-small">
            All-in fictional amount. This is not an Aksen service price or a tax
            invoice. Editing an approved quote requires restarting this demo.
          </p>
          {stage === 'accepted' && (
            <p className="order-notice">
              A screenshot or customer claim cannot release the order. In a live
              system this step requires a verified provider event or authorised
              reconciliation.
            </p>
          )}
          {actions[stage] && (
            <button
              className="order-primary"
              disabled={busy || check.issues.length > 0}
              onClick={advance}
            >
              {actions[stage]?.label}
            </button>
          )}
          {stage === 'complete' && (
            <p className="order-ready">
              Collected in the simulation. Next: confirm satisfaction, record
              issues and ask permission before any marketing follow-up.
            </p>
          )}
        </section>
        <section className="order-panel order-handoff">
          <span className="order-eyebrow">03 / WORKSHOP HANDOFF PREPARER</span>
          <h2>Give the workshop a clear brief</h2>
          <p>
            AI prepares a draft checklist. The order controls above determine
            whether it can progress.
          </p>
          <button
            disabled={
              busy || !['paid', 'production', 'complete'].includes(stage)
            }
            onClick={() => prepareDraft('handoff')}
          >
            Draft the workshop handoff
          </button>
          {!['paid', 'production', 'complete'].includes(stage) && (
            <p className="order-small">
              Available after simulated payment verification.
            </p>
          )}
          {busy && (
            <output aria-live="polite">Preparing a draft for review…</output>
          )}
          {error && (
            <p role="alert" className="order-error">
              {error}
            </p>
          )}
          {draft && (
            <div className="order-draft">
              <h3>{draftRole} · review required</h3>
              <ResponseText text={draft} />
            </div>
          )}
          {requestId && (
            <p className="order-reference">
              Request: {requestId}
              {logging === 'degraded'
                ? ' · Some tracking could not be acknowledged.'
                : ''}
            </p>
          )}
        </section>
        <section className="order-panel">
          <span className="order-eyebrow">DECISION TRAIL</span>
          <h2>What happened</h2>
          <ol className="order-events">
            {events.map((event, index) => (
              <li key={index}>{event}</li>
            ))}
          </ol>
          <p className="order-small">
            This trail is local to your demo. AI requests have backend tracking;
            these simulated decisions are not live business records.
          </p>
        </section>
      </div>
    </div>
  );
}
