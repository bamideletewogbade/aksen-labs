'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  BookOpenCheck,
  CircleSlash,
  RotateCcw,
  UserRoundCheck,
} from 'lucide-react';
import { demoScenarios, type DemoTurn } from '@/lib/operations-catalog';

type Captured = { label: string; value: string };
type Turn = DemoTurn & { handoff?: boolean };

const initials = (name: string) =>
  name
    .replace(/[’']s\b/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

/**
 * The demo a founder puts on a shared screen: a WhatsApp-style conversation
 * with a fictional business like the prospect's own, and beside it what the
 * assistant knows, what it will not do, and what it hands to the owner.
 *
 * It replaced a document editor (title, Markdown, "Download .md") wrapped
 * around a single reply, which showed a prospect a drafting tool rather than
 * the thing they would be buying: a customer asks, the assistant answers from
 * approved facts, and the owner gets the order with the details complete.
 */
export function DemoStage() {
  const [demoId, setDemoId] = useState(demoScenarios[0].id);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [message, setMessage] = useState('');
  const [captured, setCaptured] = useState<Captured[]>([]);
  const [handoffNote, setHandoffNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const thread = useRef<HTMLDivElement>(null);
  const demo = demoScenarios.find((item) => item.id === demoId)!;
  const handedOver = turns.some((turn) => turn.handoff);
  const unused = demo.examples.filter(
    (example) => !turns.some((turn) => turn.text === example),
  );

  useEffect(() => {
    thread.current?.scrollTo({
      top: thread.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [turns, busy]);

  function choose(id: string) {
    if (busy) return;
    setDemoId(id);
    reset();
  }

  function reset() {
    setTurns([]);
    setMessage('');
    setCaptured([]);
    setHandoffNote('');
    setError('');
  }

  async function send(text: string) {
    const body = text.trim();
    if (!body || busy) return;
    const history = turns.map(({ from, text: said }) => ({ from, text: said }));
    setTurns((current) => [...current, { from: 'them', text: body }]);
    setMessage('');
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/admin/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demo: demo.id, message: body, history }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        content?: string;
        captured?: Captured[];
        handoff?: boolean;
        handoffNote?: string;
      };
      if (!response.ok || !data.content)
        throw new Error(
          data.error || 'The assistant did not answer. Try again.',
        );
      setTurns((current) => [
        ...current,
        { from: 'assistant', text: data.content!, handoff: data.handoff },
      ]);
      // Details accumulate over the conversation; a later turn can correct one.
      if (data.captured?.length)
        setCaptured((current) => {
          const next = new Map(
            current.map((item) => [item.label.toLowerCase(), item]),
          );
          for (const item of data.captured!)
            next.set(item.label.toLowerCase(), item);
          return [...next.values()];
        });
      if (data.handoff && data.handoffNote) setHandoffNote(data.handoffNote);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'The assistant did not answer.',
      );
      // Put the message back so it can be sent again without retyping.
      setTurns((current) => current.slice(0, -1));
      setMessage(body);
    } finally {
      setBusy(false);
    }
  }

  const speakerLabel =
    demo.speaker === 'owner'
      ? `You are ${demo.owner}, the owner`
      : 'You are a customer';

  return (
    <section className="ds" aria-label="Service demo">
      <div
        className="ds-picker"

        aria-label="Choose a business"
      >
        {demoScenarios.map((item) => (
          <button
            type="button"
            aria-pressed={item.id === demoId}
            key={item.id}
            className="ds-pick"
            onClick={() => choose(item.id)}
            disabled={busy && item.id !== demoId}
          >
            <span className="ds-pick-place">
              {item.city}, {item.country}
            </span>
            <strong>{item.business}</strong>
            <span className="ds-pick-sector">{item.sector}</span>
            <span className="ds-pick-shows">{item.shows}</span>
          </button>
        ))}
      </div>

      <div className="ds-stage">
        <div className="ds-phone">
          <header className="ds-phone-head">
            <span className="ds-avatar" aria-hidden>
              {initials(demo.business)}
            </span>
            <div>
              <strong>{demo.business}</strong>
              <span>
                {demo.speaker === 'owner'
                  ? 'Business assistant · for the owner'
                  : `Assistant answers · ${demo.owner} decides`}
              </span>
            </div>
            <button
              type="button"
              className="ds-reset"
              onClick={reset}
              disabled={busy || !turns.length}
              title="Start the conversation again"
            >
              <RotateCcw size={15} />
              <span>Start again</span>
            </button>
          </header>

          <div className="ds-thread" ref={thread} aria-live="polite">
            <p className="ds-day">
              Fictional business · no message leaves this page
            </p>
            {!turns.length && (
              <p className="ds-empty">
                {speakerLabel}. Tap a message below or type your own, the way
                people really write on WhatsApp.
              </p>
            )}
            {turns.map((turn, index) => (
              <div key={index} className={`ds-bubble ds-${turn.from}`}>
                <p>{turn.text}</p>
                {turn.handoff && (
                  <span className="ds-handoff-tag">
                    <UserRoundCheck size={12} /> Passed to {demo.owner}
                  </span>
                )}
              </div>
            ))}
            {busy && (
              <div
                className="ds-bubble ds-assistant ds-typing"
                aria-label="Typing"
              >
                <i />
                <i />
                <i />
              </div>
            )}
          </div>

          {unused.length > 0 && (
            <div className="ds-suggestions" aria-label="Example messages">
              {unused.map((example) => (
                <button
                  type="button"
                  key={example}
                  disabled={busy}
                  onClick={() => void send(example)}
                >
                  {example}
                </button>
              ))}
            </div>
          )}

          {error && (
            <p role="alert" className="ds-error">
              {error}
            </p>
          )}

          <form
            className="ds-composer"
            onSubmit={(event) => {
              event.preventDefault();
              void send(message);
            }}
          >
            <input
              value={message}
              maxLength={1000}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={
                demo.speaker === 'owner'
                  ? `Ask as ${demo.owner}…`
                  : 'Type a message as a customer…'
              }
              aria-label="Message"
              disabled={busy}
            />
            <button
              type="submit"
              disabled={busy || !message.trim()}
              aria-label="Send"
            >
              <ArrowUp size={18} />
            </button>
          </form>
        </div>

        <aside className="ds-side">
          {demo.speaker === 'customer' && (
            <section
              className={`ds-card ds-owner${handedOver ? ' is-live' : ''}`}
            >
              <h3>
                <UserRoundCheck size={16} /> What {demo.owner} receives
              </h3>
              {handedOver ? (
                <>
                  {handoffNote && <p className="ds-note">{handoffNote}</p>}
                  {captured.length > 0 && (
                    <dl className="ds-captured">
                      {captured.map((item) => (
                        <div key={item.label}>
                          <dt>{item.label}</dt>
                          <dd>{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  <p className="ds-fine">
                    In a live setup this lands in {demo.owner}’s order list with
                    the chat attached. {demo.owner} checks the money and
                    confirms. Here, nothing is sent.
                  </p>
                </>
              ) : captured.length ? (
                <>
                  <p className="ds-fine">
                    Details gathered so far. Nothing needs {demo.owner} yet.
                  </p>
                  <dl className="ds-captured">
                    {captured.map((item) => (
                      <div key={item.label}>
                        <dt>{item.label}</dt>
                        <dd>{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                </>
              ) : (
                <p className="ds-fine">
                  Anything about money, a date, a booking or a complaint is
                  handed to {demo.owner} with the details already collected.
                  That rule is in the code, not left to the assistant.
                </p>
              )}
            </section>
          )}

          <section className="ds-card">
            <h3>
              <BookOpenCheck size={16} /> What the assistant knows
            </h3>
            <ul className="ds-facts">
              {demo.facts.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>
            <p className="ds-fine">
              Written and approved by {demo.owner}. It answers from this and
              nothing else.
            </p>
          </section>

          <section className="ds-card">
            <h3>
              <CircleSlash size={16} /> What it will not do
            </h3>
            <ul className="ds-willnot">
              {demo.willNot.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </section>
  );
}
