'use client';
import { useState } from 'react';
import { AlertTriangle, Loader2, Plus } from 'lucide-react';
import {
  ITEM_KINDS,
  ITEM_STATUSES,
  KIND_LABEL,
  STATUS_LABEL,
  itemSummary,
  needsEvidence,
  type ItemKind,
  type ProjectItem,
} from '@/lib/project-items';

/**
 * Items load when the section is opened rather than with the project list, so a
 * page showing thirty projects does not fetch the work inside all of them.
 */
export function AdminProjectItems({ projectId }: { projectId: string }) {
  const [items, setItems] = useState<ProjectItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<ItemKind>('task');

  async function load() {
    if (items || loading) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/projects/${projectId}/items`);
      const data = (await response.json()) as {
        items?: ProjectItem[];
        error?: string;
      };
      if (!response.ok) throw new Error(data.error || 'Items unavailable.');
      setItems(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Items unavailable.');
    } finally {
      setLoading(false);
    }
  }

  async function add(event: React.FormEvent) {
    event.preventDefault();
    const value = title.trim();
    if (!value || busy) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/projects/${projectId}/items`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind, title: value }),
      });
      const data = (await response.json()) as ProjectItem & { error?: string };
      if (!response.ok) throw new Error(data.error || 'That did not save.');
      setItems((current) => [...(current ?? []), data]);
      setTitle('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That did not save.');
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(item: ProjectItem, status: string) {
    const before = items;
    setError('');
    setItems(
      (current) =>
        current?.map((row) =>
          row.id === item.id ? { ...row, status } : row,
        ) ?? null,
    );
    try {
      const response = await fetch(`/api/admin/projects/${projectId}/items`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ itemId: item.id, status }),
      });
      if (!response.ok) throw new Error('save failed');
    } catch {
      setItems(before);
      setError('That change did not save. Try again.');
    }
  }

  const summary = items ? itemSummary(items) : null;

  return (
    <details className="project-items" onToggle={() => void load()}>
      <summary>
        Work inside this project
        {summary && (
          <span className="project-items-count">
            {summary.open} open
            {summary.blocked ? `, ${summary.blocked} blocked` : ''}
          </span>
        )}
      </summary>
      {loading && (
        <p className="project-items-state">
          <Loader2 className="animate-spin" size={15} /> Loading…
        </p>
      )}
      {error && (
        <p className="project-items-state" role="alert">
          {error}
        </p>
      )}
      {items && !items.length && !loading && (
        <p className="project-items-state">
          Nothing recorded yet. Add the first deliverable or decision.
        </p>
      )}
      {items && items.length > 0 && (
        <ul className="project-items-list">
          {items.map((item) => (
            <li key={item.id} data-status={item.status}>
              <span className="project-item-kind">
                {KIND_LABEL[item.kind as ItemKind] ?? item.kind}
              </span>
              <span className="project-item-title">
                {item.title}
                {needsEvidence(item) && (
                  <em title="Marked done with no evidence recorded">
                    <AlertTriangle size={13} /> no evidence
                  </em>
                )}
              </span>
              {item.dueAt && (
                <span className="project-item-due">{item.dueAt}</span>
              )}
              <label>
                <span className="sr-only">Status for {item.title}</span>
                <select
                  value={item.status}
                  onChange={(event) => void setStatus(item, event.target.value)}
                >
                  {ITEM_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {STATUS_LABEL[value]}
                    </option>
                  ))}
                </select>
              </label>
            </li>
          ))}
        </ul>
      )}
      <form className="project-items-add" onSubmit={add}>
        <label>
          <span className="sr-only">Item type</span>
          <select
            value={kind}
            onChange={(event) => setKind(event.target.value as ItemKind)}
          >
            {ITEM_KINDS.map((value) => (
              <option key={value} value={value}>
                {KIND_LABEL[value]}
              </option>
            ))}
          </select>
        </label>
        <input
          value={title}
          maxLength={200}
          placeholder="What needs doing, deciding or watching?"
          onChange={(event) => setTitle(event.target.value)}
          aria-label="Item title"
        />
        <button type="submit" disabled={busy || !title.trim()}>
          {busy ? (
            <Loader2 className="animate-spin" size={15} />
          ) : (
            <Plus size={15} />
          )}
          Add
        </button>
      </form>
    </details>
  );
}
