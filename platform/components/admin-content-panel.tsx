'use client';

import { BookOpen, Clock3, ExternalLink, Loader2, Search } from 'lucide-react';
import { useState } from 'react';
import { ConfirmAction } from '@/components/ui/confirm-action';

/**
 * The article list.
 *
 * It held up to thirty rows with no way to narrow them, which is fine at three
 * articles and unusable at thirty. The filter is the same shape as the lead
 * queue: counts come from the same list the rows come from, so a chip cannot
 * promise more than it shows.
 *
 * "Awaiting approval" used to link to /admin/approvals. That page was taken out
 * of the sidebar when approving was folded into this one, so the link sent you
 * away from the panel that is already sitting at the top of this page holding
 * the decision.
 */

export type ContentPost = {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: string;
  authorName: string;
  updatedAt: Date | string;
};

export function AdminContentPanel({
  initialPosts,
  initialAwaiting = [],
}: {
  initialPosts: ContentPost[];
  initialAwaiting?: string[];
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [awaiting, setAwaiting] = useState<string[]>(initialAwaiting);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  async function unpublish(post: ContentPost) {
    setError('');
    setBusyId(post.id);
    try {
      const response = await fetch(`/api/admin/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'draft' }),
      });
      if (!response.ok)
        throw new Error('The action did not save. Refresh and try again.');
      if (response.ok)
        setPosts((current) =>
          current.map((item) =>
            item.id === post.id ? { ...item, status: 'draft' } : item,
          ),
        );
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'The action did not save. Please try again.',
      );
    } finally {
      setBusyId(null);
    }
  }

  async function requestPublication(post: ContentPost) {
    setError('');
    setBusyId(post.id);
    try {
      const response = await fetch('/api/admin/approvals/request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ postId: post.id }),
      });
      if (!response.ok)
        throw new Error('The action did not save. Refresh and try again.');
      if (response.ok)
        setAwaiting((current) =>
          current.includes(post.id) ? current : [...current, post.id],
        );
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'The action did not save. Please try again.',
      );
    } finally {
      setBusyId(null);
    }
  }

  async function removePost(post: ContentPost) {
    setError('');
    setBusyId(post.id);
    try {
      const response = await fetch(`/api/admin/posts/${post.id}`, {
        method: 'DELETE',
      });
      if (!response.ok)
        throw new Error('The action did not save. Refresh and try again.');
      if (response.ok)
        setPosts((current) => current.filter((item) => item.id !== post.id));
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'The action did not save. Please try again.',
      );
    } finally {
      setBusyId(null);
    }
  }

  if (!posts.length)
    return (
      <div className="empty-admin">
        <BookOpen />
        <strong>No articles yet.</strong>
        <span>Use the form to draft the first one.</span>
      </div>
    );

  // Awaiting is its own view rather than a sub-state of draft, because it is
  // the only one where the next move is someone else's.
  const inState = (post: ContentPost, state: string) =>
    state === 'all'
      ? true
      : state === 'awaiting'
        ? awaiting.includes(post.id)
        : post.status === state && !awaiting.includes(post.id);

  const term = query.trim().toLowerCase();
  const visible = posts.filter(
    (post) =>
      inState(post, filter) &&
      (!term ||
        `${post.title} ${post.category} ${post.authorName}`
          .toLowerCase()
          .includes(term)),
  );

  const views = [
    { id: 'all', label: 'All' },
    { id: 'published', label: 'Published' },
    { id: 'draft', label: 'Drafts' },
    { id: 'awaiting', label: 'Awaiting you' },
  ];

  return (
    <div className="content-body">
      <div className="content-filters">
        <div className="content-views">
          {views.map((view) => {
            const count = posts.filter((post) => inState(post, view.id)).length;
            return (
              <button
                key={view.id}
                type="button"
                className="content-view"
                aria-pressed={filter === view.id}
                onClick={() => setFilter(view.id)}
              >
                {view.label} <span>{count}</span>
              </button>
            );
          })}
        </div>
        <label className="content-search">
          <Search size={14} aria-hidden="true" />
          <input
            type="search"
            value={query}
            placeholder="Title, category or author"
            aria-label="Search articles"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>
      <div className="content-list">
        {error && <p role="alert">{error}</p>}
        {!visible.length && (
          <p className="content-none">
            {term
              ? 'Nothing matches that search.'
              : 'Nothing in this view yet.'}
          </p>
        )}
        {visible.map((post) => (
          <article key={post.id}>
            <div>
              <strong>{post.title}</strong>
              <span>
                {post.category} · {post.authorName}
              </span>
            </div>
            <b className={`status-${post.status}`}>{post.status}</b>
            <div className="content-actions">
              {post.status === 'published' && (
                <a
                  href={`/blog/${post.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="View published article"
                >
                  <ExternalLink size={14} />
                </a>
              )}
              {post.status === 'published' ? (
                <button
                  type="button"
                  onClick={() => unpublish(post)}
                  disabled={busyId === post.id}
                >
                  {busyId === post.id ? (
                    <Loader2 size={13} className="icon-spin" />
                  ) : (
                    'Unpublish'
                  )}
                </button>
              ) : awaiting.includes(post.id) ? (
                // The decision panel is at the top of this same page, so this
                // points there rather than at the approvals page it used to.
                <a className="awaiting-decision" href="#waiting">
                  <Clock3 size={13} /> Awaiting approval
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => requestPublication(post)}
                  disabled={busyId === post.id}
                >
                  {busyId === post.id ? (
                    <Loader2 size={13} className="icon-spin" />
                  ) : (
                    'Request publication'
                  )}
                </button>
              )}
              <ConfirmAction
                className="content-delete"
                label="Delete"
                confirmLabel="Delete for good"
                pendingLabel="Deleting…"
                title={`Delete ${post.title}`}
                disabled={busyId === post.id}
                onConfirm={() => removePost(post)}
              />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
