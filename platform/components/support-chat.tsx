'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2, Send } from 'lucide-react';
import { ResponseText } from '@/components/response-text';

type Message = { role: 'user' | 'assistant'; content: string };
type Reference = { id: string; title: string; href: string };
export function SupportChat({
  scenario,
}: {
  scenario?: 'commerce' | 'booking';
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: scenario
        ? 'Try this fictional business example. I can answer from its sample information and show where a person needs to step in. No real orders, payments or bookings are made.'
        : 'Aksen builds websites, connects business systems and develops digital products. I’m an AI assistant: I can explain our services, prices and process. What would you like your business to do better?',
    },
  ]);
  const [question, setQuestion] = useState(''),
    [loading, setLoading] = useState(false),
    [error, setError] = useState('');
  const [references, setReferences] = useState<Reference[]>([]),
    [handoff, setHandoff] = useState(''),
    [fallback, setFallback] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest', behavior: 'auto' });
  }, [messages, loading]);
  const starters =
    scenario === 'commerce'
      ? [
          'What does a standard shelf cost?',
          'Can you make a custom size?',
          'Can this payment screenshot confirm my order?',
        ]
      : scenario === 'booking'
        ? [
            'Can I book a consultation tomorrow?',
            'What details do you need?',
            'Is my appointment confirmed?',
          ]
        : [
            'What can Aksen help my business with?',
            'Is the GHS 1,500 assessment credited?',
            'How much does monthly care cost?',
            'Can I try a customer-support demo?',
          ];
  async function ask(value = question) {
    const text = value.trim();
    if (!text || loading) return;
    const history = messages.slice(-6);
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setQuestion('');
    setLoading(true);
    setError('');
    setReferences([]);
    setHandoff('');
    setFallback(false);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45000);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question: text, history, scenario }),
        signal: controller.signal,
      });
      const data = (await response.json()) as {
        answer?: string;
        error?: string;
        sources?: Reference[];
        source?: string;
        handoff?: { needed?: boolean; recorded?: boolean };
      };
      if (!response.ok)
        throw new Error(
          `${data.error || 'The assistant is unavailable.'}${response.headers.get('X-Request-ID') ? ' Reference: ' + response.headers.get('X-Request-ID') : ''}`,
        );
      if (typeof data.answer !== 'string')
        throw new Error('No answer was returned. Please try again.');
      const answer = data.answer;
      setMessages((m) => [...m, { role: 'assistant', content: answer }]);
      setReferences(
        Array.isArray(data.sources)
          ? data.sources.filter(
              (s: Reference) =>
                typeof s.href === 'string' &&
                s.href.startsWith('/') &&
                !s.href.startsWith('//'),
            )
          : [],
      );
      setFallback(data.source !== 'openrouter');
      if (data.handoff?.needed)
        setHandoff(
          scenario
            ? 'This step needs a person in a live deployment.'
            : data.handoff.recorded
              ? 'A note was recorded for the team. Use the enquiry form to give them a reply address.'
              : 'Use the enquiry form to reach the team; a support note could not be confirmed.',
        );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Please try again.');
      setQuestion(text);
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  }
  return (
    <div className="support-chat">
      <div
        className="guide-thread"
        role="log"
        aria-live="polite"
        aria-label="Support conversation"
      >
        {messages.map((m, i) => (
          <div className={`guide-message ${m.role}`} key={i}>
            <span>
              {m.role === 'user' ? 'You' : scenario ? 'Demo' : 'Aksen'}
            </span>
            <ResponseText text={m.content} />
          </div>
        ))}
        {loading && (
          <output>
            <Loader2 size={14} className="icon-spin" /> Checking the relevant
            information…
          </output>
        )}
        {messages.length === 1 && (
          <div className="guide-starters">
            {starters.map((s) => (
              <button type="button" key={s} onClick={() => void ask(s)}>
                {s}
                <ArrowRight size={14} />
              </button>
            ))}
          </div>
        )}
        {fallback && (
          <small className="support-note">
            Showing saved information or a support handoff.
          </small>
        )}
        {!!references.length && (
          <div className="support-references">
            <small>{scenario ? 'Demo reference' : 'Reference pages'}</small>
            {references.map((s) => (
              <Link key={s.id} href={s.href}>
                {s.title}
                <ArrowRight size={12} />
              </Link>
            ))}
          </div>
        )}
        {handoff && (
          <div className="support-handoff">
            <p>{handoff}</p>
            <Link href="/agent-mapper">
              Contact the team <ArrowRight size={14} />
            </Link>
          </div>
        )}
        {error && (
          <p role="alert" className="support-error">
            {error}
          </p>
        )}
        <div ref={end} />
      </div>
      <form
        className="guide-compose"
        onSubmit={(e) => {
          e.preventDefault();
          void ask();
        }}
      >
        <label htmlFor={`support-question-${scenario || 'aksen'}`}>
          Your question
        </label>
        <div>
          <input
            id={`support-question-${scenario || 'aksen'}`}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={700}
            placeholder={
              scenario ? 'Try a customer question…' : 'How can we help?'
            }
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            aria-label="Send question"
          >
            {loading ? (
              <Loader2 size={16} className="icon-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
        <small>
          Automated support using approved information. Please keep passwords
          and payment details out of this chat.
        </small>
        <Link href="/agent-mapper">Contact the Aksen team</Link>
        <Link href={scenario ? '/agent-mapper' : '/support-demo'}>
          {scenario
            ? 'Discuss your own support assistant'
            : 'Try the business demos'}
        </Link>
      </form>
    </div>
  );
}
