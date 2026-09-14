'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, MessageCircleQuestion, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { PendingButton, StatusNote } from '@/components/ui/activity';

export type KnowledgeEntry = {
  id: string;
  title: string;
  href: string;
  keywords: string;
  content: string;
  source: string;
};

type Match = {
  id: string;
  title: string;
  score: number;
  matched: string[];
  sent: boolean;
};

/**
 * The knowledge screen was a list of collapsed panels. It answered "what does
 * the assistant know" and nothing else, so the two questions actually worth
 * asking had no answer here: would this entry ever be reached, and where do I
 * go to change its words.
 */
export function KnowledgeConsole({ entries }: { entries: KnowledgeEntry[] }) {
  const [filter, setFilter] = useState('');
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [limit, setLimit] = useState(5);
  const [error, setError] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const visible = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return entries;
    return entries.filter((entry) =>
      `${entry.title} ${entry.keywords} ${entry.content} ${entry.source}`
        .toLowerCase()
        .includes(needle),
    );
  }, [entries, filter]);

  const scoreFor = useMemo(
    () => new Map((matches ?? []).map((m) => [m.id, m])),
    [matches],
  );

  // After a preview, the list reorders to put what would be retrieved on top.
  const ordered = useMemo(() => {
    if (!matches) return visible;
    return [...visible].sort(
      (a, b) => (scoreFor.get(b.id)?.score ?? 0) - (scoreFor.get(a.id)?.score ?? 0),
    );
  }, [visible, matches, scoreFor]);

  useEffect(() => {
    if (matches && resultsRef.current)
      resultsRef.current.scrollIntoView({ block: 'nearest' });
  }, [matches]);

  async function preview(event: { preventDefault(): void }) {
    event.preventDefault();
    const asked = question.trim();
    if (!asked) return;
    setAsking(true);
    setError('');
    try {
      const response = await fetch('/api/admin/support/knowledge', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question: asked }),
      });
      const data = (await response.json()) as {
        error?: string;
        matches?: Match[];
        limit?: number;
      };
      if (!response.ok) throw new Error(data.error || 'That did not run.');
      setMatches(data.matches ?? []);
      setLimit(data.limit ?? 5);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That did not run.');
    } finally {
      setAsking(false);
    }
  }

  const reached = (matches ?? []).filter((m) => m.score > 0).length;

  return (
    <>
      <section className="admin-panel knowledge-try">
        <div className="panel-head">
          <div>
            <small>RETRIEVAL PREVIEW</small>
            <h2>Ask what a visitor would ask</h2>
          </div>
          <MessageCircleQuestion />
        </div>
        <p className="knowledge-intro">
          Runs the real retrieval and calls no model, so it costs nothing. It
          shows which entries would be handed to the assistant, which would be
          left out, and which words matched.
        </p>
        <form className="knowledge-ask" onSubmit={preview}>
          <label className="sr-only" htmlFor="knowledge-question">
            A question to preview
          </label>
          <input
            id="knowledge-question"
            value={question}
            maxLength={500}
            placeholder="How much does a website cost?"
            onChange={(event) => setQuestion(event.target.value)}
          />
          <PendingButton
            type="submit"
            pending={asking}
            pendingLabel="Checking"
            disabled={!question.trim()}
          >
            Preview
          </PendingButton>
        </form>
        {error && <StatusNote tone="error">{error}</StatusNote>}
        {matches && !error && (
          <div className="knowledge-verdict arrive" ref={resultsRef}>
            {reached === 0 ? (
              <StatusNote tone="error">
                Nothing matched. The assistant would fall back to a general
                answer, and none of these entries would be used.
              </StatusNote>
            ) : (
              <StatusNote tone="done">
                {reached} {reached === 1 ? 'entry matches' : 'entries match'};
                the top {Math.min(reached, limit)} would be sent.
              </StatusNote>
            )}
          </div>
        )}
      </section>

      <section className="admin-panel">
        <div className="panel-head">
          <div>
            <small>ENTRIES</small>
            <h2>
              {visible.length === entries.length
                ? `${entries.length} in the knowledge base`
                : `${visible.length} of ${entries.length} shown`}
            </h2>
          </div>
          <span className="knowledge-search">
            <Search size={15} aria-hidden="true" />
            <label className="sr-only" htmlFor="knowledge-filter">
              Filter entries
            </label>
            <input
              id="knowledge-filter"
              type="search"
              value={filter}
              placeholder="Filter by word"
              onChange={(event) => setFilter(event.target.value)}
            />
          </span>
        </div>

        {visible.length === 0 && (
          <div className="empty-admin">
            <strong>Nothing matches that word.</strong>
            <button type="button" onClick={() => setFilter('')}>
              Clear the filter
            </button>
          </div>
        )}

        <ul className="knowledge-list">
          {ordered.map((entry) => {
            const match = scoreFor.get(entry.id);
            const open = openId === entry.id;
            return (
              <li
                key={entry.id}
                className="knowledge-entry"
                data-sent={match?.sent || undefined}
                data-missed={matches && !match?.score ? true : undefined}
              >
                <button
                  type="button"
                  className="knowledge-entry-head"
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? null : entry.id)}
                >
                  <span className="knowledge-entry-title">
                    {entry.title}
                    {match && (
                      <em
                        className="knowledge-score"
                        title={
                          match.score
                            ? `Matched: ${match.matched.join(', ')}`
                            : 'No word in the question appears in this entry'
                        }
                      >
                        {match.sent
                          ? `sent · ${match.score}`
                          : match.score
                            ? `below the cut · ${match.score}`
                            : 'no match'}
                      </em>
                    )}
                  </span>
                  <span className="knowledge-entry-meta">
                    {entry.content.length.toLocaleString()} chars
                  </span>
                </button>
                {open && (
                  <div className="knowledge-entry-body arrive">
                    <p className="knowledge-source">
                      <strong>Where this comes from</strong>
                      {entry.source}
                    </p>
                    <p className="knowledge-keywords">
                      <strong>Retrieval words</strong>
                      {entry.keywords
                        .split(/\s+/)
                        .filter(Boolean)
                        .map((word) => (
                          <code key={word}>{word}</code>
                        ))}
                    </p>
                    <p className="knowledge-content">{entry.content}</p>
                    <Link href={entry.href} className="knowledge-open">
                      Open the page a visitor is sent to
                      <ExternalLink size={14} />
                    </Link>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
