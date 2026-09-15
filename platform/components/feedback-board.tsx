'use client';
import Link from 'next/link';
import { ArrowUp, ArrowUpRight, Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  bodyLimit,
  boardOrder,
  ideaStatuses,
  statusLabel,
  titleLimit,
  type IdeaStatus,
} from '@/lib/feedback-board';

export type BoardIdea = {
  id: string;
  title: string;
  body: string | null;
  status: string;
  statusNote: string | null;
  voteCount: number;
  shippedSlug: string | null;
};

/**
 * Which ideas this device has already voted for.
 *
 * The server decides whether a vote counts, keyed on the same hashed address the
 * rate limiter uses. This is only so the button looks right on a return visit,
 * and it is per device on purpose: the alternative is rendering the board
 * per visitor, which would make it uncacheable to answer a cosmetic question.
 * Private windows and cleared storage read back empty, so the button simply
 * starts unpressed and the server still refuses the second vote.
 */
const votedStore = 'aksen.feedback.voted';

function readVoted(): string[] {
  try {
    const raw = window.localStorage.getItem(votedStore);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

function IdeaCard({
  idea,
  voted,
  onVote,
  busy,
}: {
  idea: BoardIdea;
  voted: boolean;
  onVote: (id: string) => void;
  busy: boolean;
}) {
  const settled = idea.status === 'shipped' || idea.status === 'declined';
  return (
    <article className="board-card" data-status={idea.status}>
      <button
        type="button"
        className="board-vote"
        aria-pressed={voted}
        // The round trip to the database runs to a couple of seconds, and a
        // button that just goes dead for that long reads as broken.
        aria-busy={busy}
        // A shipped or declined idea is a record, not a ballot. Leaving the
        // button live would collect votes that cannot change anything.
        disabled={voted || busy || settled}
        onClick={() => onVote(idea.id)}
        aria-label={
          settled
            ? `${idea.title}. Voting closed. ${idea.voteCount} votes.`
            : voted
              ? `You voted for ${idea.title}. ${idea.voteCount} votes.`
              : `Vote for ${idea.title}. ${idea.voteCount} votes so far.`
        }
      >
        {voted ? <Check size={15} /> : <ArrowUp size={15} />}
        <strong>{idea.voteCount}</strong>
      </button>
      <div className="board-card-body">
        <span className="board-status">{statusLabel(idea.status)}</span>
        <h3>{idea.title}</h3>
        {idea.body && <p>{idea.body}</p>}
        {idea.statusNote && <p className="board-note">{idea.statusNote}</p>}
        {idea.shippedSlug && (
          <Link className="agency-text-link" href={`/changelog#${idea.shippedSlug}`}>
            Read what shipped <ArrowUpRight size={15} />
          </Link>
        )}
      </div>
    </article>
  );
}

export function FeedbackBoard({ ideas }: { ideas: BoardIdea[] }) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [voted, setVoted] = useState<string[]>([]);
  const [busy, setBusy] = useState('');
  const [filter, setFilter] = useState<IdeaStatus | 'all'>('all');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // Read after mount rather than during render: the server has no localStorage,
  // and reading it during render would make the two disagree on first paint.
  // oxlint-disable-next-line react/react-compiler -- reading an external store once on mount is what an effect is for; there is no render-time source for this.
  useEffect(() => setVoted(readVoted()), []);

  async function vote(id: string) {
    setBusy(id);
    setError('');
    try {
      const response = await fetch('/api/feedback/vote', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = (await response.json()) as { votes?: number; error?: string };
      if (!response.ok) {
        setError(data.error || 'That vote did not go through. Try again.');
        return;
      }
      // The server's number wins. An optimistic increment would disagree with
      // it the moment two people vote at once.
      if (typeof data.votes === 'number')
        setCounts((current) => ({ ...current, [id]: data.votes as number }));
      const next = [...new Set([...voted, id])];
      setVoted(next);
      try {
        window.localStorage.setItem(votedStore, JSON.stringify(next));
      } catch {}
    } catch {
      setError('That vote did not go through. Check your connection.');
    } finally {
      setBusy('');
    }
  }

  // Takes the form element rather than the event, so this file needs no React
  // event type. The two the codebase reaches for are both flagged deprecated by
  // the linter against these React types, and neither is worth an exception.
  async function submit(form: HTMLFormElement) {
    const fields = new FormData(form);
    setSending(true);
    setError('');
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: fields.get('title'),
          body: fields.get('body'),
          email: fields.get('email'),
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error || 'That did not send. Please try again.');
        return;
      }
      form.reset();
      setSent(true);
    } catch {
      setError('That did not send. Check your connection.');
    } finally {
      setSending(false);
    }
  }

  const shown =
    filter === 'all' ? ideas : ideas.filter((idea) => idea.status === filter);
  const grouped = boardOrder
    .map((status) => ({
      status,
      label: ideaStatuses.find((entry) => entry.id === status)!.label,
      items: shown
        .filter((idea) => idea.status === status)
        .sort((a, b) => count(b) - count(a)),
    }))
    .filter((group) => group.items.length > 0);

  function count(idea: BoardIdea) {
    return counts[idea.id] ?? idea.voteCount;
  }

  return (
    <div className="board">
      <section className="board-submit" aria-labelledby="board-submit-title">
        <h2 id="board-submit-title">What should we build next?</h2>
        {sent ? (
          <output className="board-sent">
            <Check size={17} />
            Got it. We read every suggestion before it goes on the board, usually
            within a day. If you left an email we will tell you when it moves.
          </output>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void submit(event.currentTarget);
            }}
          >
            <label>
              In one line, what do you want?
              <input
                name="title"
                required
                minLength={10}
                maxLength={titleLimit}
                placeholder="Let me export the order list as a spreadsheet"
              />
            </label>
            <label>
              Anything else? <span>Optional</span>
              <textarea
                name="body"
                rows={3}
                maxLength={bodyLimit}
                placeholder="What you are trying to do, and what you do instead today."
              />
            </label>
            <label>
              Your email <span>Optional, only to tell you when it ships</span>
              <input name="email" type="email" maxLength={200} />
            </label>
            <button className="agency-button" disabled={sending}>
              {sending ? 'Sending…' : 'Send the suggestion'}
            </button>
            <p className="board-privacy">
              We read every one before it appears here. Your email is never shown
              on the board and is not added to a mailing list.
            </p>
          </form>
        )}
      </section>

      <div className="board-main">
        <fieldset className="board-filter" aria-label="Filter by status">
          <button
            type="button"
            aria-pressed={filter === 'all'}
            className={filter === 'all' ? 'is-current' : ''}
            onClick={() => setFilter('all')}
          >
            Everything
          </button>
          {ideaStatuses.map((status) => (
            <button
              key={status.id}
              type="button"
              aria-pressed={filter === status.id}
              className={filter === status.id ? 'is-current' : ''}
              onClick={() => setFilter(status.id)}
            >
              {status.label}
            </button>
          ))}
        </fieldset>
        <p role="alert" className="board-error">
          {error}
        </p>
        {grouped.length === 0 ? (
          <p className="board-empty">
            Nothing on the board under that heading yet. Your suggestion would be
            the first one.
          </p>
        ) : (
          grouped.map((group) => (
            <section key={group.status} aria-label={group.label}>
              <h2 className="board-group-title">
                {group.label}
                <span>{group.items.length}</span>
              </h2>
              <div className="board-list">
                {group.items.map((idea) => (
                  <IdeaCard
                    key={idea.id}
                    idea={{ ...idea, voteCount: count(idea) }}
                    voted={voted.includes(idea.id)}
                    onVote={vote}
                    busy={busy === idea.id}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
