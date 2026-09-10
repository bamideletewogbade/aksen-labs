'use client';

import { BookOpen, Clock3, ExternalLink, Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';

export type ContentPost = { id: string; title: string; slug: string; category: string; status: string; authorName: string; updatedAt: Date | string };

export function AdminContentPanel({ initialPosts, initialAwaiting = [] }: { initialPosts: ContentPost[]; initialAwaiting?: string[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [awaiting, setAwaiting] = useState<string[]>(initialAwaiting);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [error, setError] = useState('');

  async function unpublish(post: ContentPost) {
    setError('');
    setBusyId(post.id);
    try {
      const response = await fetch(`/api/admin/posts/${post.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: 'draft' }) });
      if (!response.ok) throw new Error('The action did not save. Refresh and try again.');
      if (response.ok) setPosts((current) => current.map((item) => item.id === post.id ? { ...item, status: 'draft' } : item));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'The action did not save. Please try again.');
    } finally {
      setBusyId(null);
    }
  }

  async function requestPublication(post: ContentPost) {
    setError('');
    setBusyId(post.id);
    try {
      const response = await fetch('/api/admin/approvals/request', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ postId: post.id }) });
      if (!response.ok) throw new Error('The action did not save. Refresh and try again.');
      if (response.ok) setAwaiting((current) => current.includes(post.id) ? current : [...current, post.id]);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'The action did not save. Please try again.');
    } finally {
      setBusyId(null);
    }
  }

  async function removePost(post: ContentPost) {
    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    setError('');
    setBusyId(post.id);
    try {
      const response = await fetch(`/api/admin/posts/${post.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('The action did not save. Refresh and try again.');
      if (response.ok) setPosts((current) => current.filter((item) => item.id !== post.id));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'The action did not save. Please try again.');
    } finally {
      setBusyId(null);
    }
  }

  if (!posts.length) return <div className="empty-admin"><BookOpen /><strong>No articles yet.</strong><span>Use the form to draft the first one.</span></div>;

  return (
    <div className="content-list">
      {error && <p role="alert">{error}</p>}
      {posts.map((post) => (
        <article key={post.id}>
          <div><strong>{post.title}</strong><span>{post.category} · {post.authorName}</span></div>
          <b className={`status-${post.status}`}>{post.status}</b>
          <div className="content-actions">
            {post.status === 'published' && <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer" aria-label="View published article"><ExternalLink size={14} /></a>}
            {post.status === 'published'
              ? <button type="button" onClick={() => unpublish(post)} disabled={busyId === post.id}>{busyId === post.id ? <Loader2 size={13} className="icon-spin" /> : 'Unpublish'}</button>
              : awaiting.includes(post.id)
                ? <a className="awaiting-decision" href="/admin/approvals"><Clock3 size={13} /> Awaiting approval</a>
                : <button type="button" onClick={() => requestPublication(post)} disabled={busyId === post.id}>{busyId === post.id ? <Loader2 size={13} className="icon-spin" /> : 'Request publication'}</button>}
            <button type="button" className="content-delete" onClick={() => removePost(post)} disabled={busyId === post.id} aria-label="Delete article"><Trash2 size={14} /></button>
          </div>
        </article>
      ))}
    </div>
  );
}
