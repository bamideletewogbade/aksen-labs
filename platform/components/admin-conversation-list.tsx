'use client';

import { Loader2, ShieldAlert } from 'lucide-react';
import { useState } from 'react';

export type ConversationView = {
  id: string;
  channel: string;
  status: string;
  urgency: string;
  summary: string | null;
  handoffReason: string | null;
};

export function AdminConversationList({
  initialThreads,
}: {
  initialThreads: ConversationView[];
}) {
  const [threads, setThreads] = useState(initialThreads);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggleStatus(thread: ConversationView) {
    const nextStatus = thread.status === 'resolved' ? 'open' : 'resolved';
    setBusyId(thread.id);
    try {
      const response = await fetch(`/api/admin/conversations/${thread.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (response.ok)
        setThreads((current) =>
          current.map((item) =>
            item.id === thread.id ? { ...item, status: nextStatus } : item,
          ),
        );
    } finally {
      setBusyId(null);
    }
  }

  const openCount = threads.filter(
    (thread) => thread.status !== 'resolved',
  ).length;

  return (
    <>
      <p className="content-count">
        {openCount} open of {threads.length}
      </p>
      <div className="content-list">
        {threads.map((thread) => (
          <article key={thread.id}>
            <div>
              <strong>{thread.summary || 'No message recorded'}</strong>
              <span>
                {thread.channel}
                {thread.handoffReason ? ` · ${thread.handoffReason}` : ''}
              </span>
            </div>
            <b
              className={
                thread.status === 'resolved'
                  ? 'status-published'
                  : 'status-draft'
              }
            >
              {thread.urgency === 'elevated' &&
                thread.status !== 'resolved' && <ShieldAlert size={11} />}{' '}
              {thread.status}
            </b>
            <div className="content-actions">
              <button
                type="button"
                onClick={() => toggleStatus(thread)}
                disabled={busyId === thread.id}
                className={thread.status === 'resolved' ? 'resolved' : ''}
              >
                {busyId === thread.id ? (
                  <Loader2 size={13} className="icon-spin" />
                ) : thread.status === 'resolved' ? (
                  'Reopen'
                ) : (
                  'Mark resolved'
                )}
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
