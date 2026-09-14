'use client';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PendingButton, SkeletonRows } from '@/components/ui/activity';
import { ConfirmAction } from '@/components/ui/confirm-action';
import {
  CHANNEL_LABEL,
  DIRECTIONS,
  DIRECTION_LABEL,
  INTERACTION_CHANNELS,
  awaitingReply,
  daysSinceContact,
  type Direction,
  type InteractionChannel,
  type LeadInteraction,
} from '@/lib/lead-interactions';

/**
 * The exchange itself, which next_action could never hold because each edit
 * overwrote the last. Loaded on open so a pipeline of thirty leads does not
 * fetch every conversation with it.
 */
export function AdminLeadHistory({
  leadId,
  today,
}: {
  leadId: string;
  today: string;
}) {
  const [entries, setEntries] = useState<LeadInteraction[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [summary, setSummary] = useState('');
  const [shared, setShared] = useState('');
  const [channel, setChannel] = useState<InteractionChannel>('whatsapp');
  const [direction, setDirection] = useState<Direction>('outbound');

  async function load() {
    if (entries || loading) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `/api/admin/opportunities/${leadId}/interactions`,
      );
      const data = (await response.json()) as {
        interactions?: LeadInteraction[];
        error?: string;
      };
      if (!response.ok) throw new Error(data.error || 'History unavailable.');
      setEntries(data.interactions ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'History unavailable.');
    } finally {
      setLoading(false);
    }
  }

  async function add(event: React.FormEvent) {
    event.preventDefault();
    const value = summary.trim();
    if (!value || busy) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch(
        `/api/admin/opportunities/${leadId}/interactions`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            summary: value,
            channel,
            direction,
            shared: shared.trim() || undefined,
          }),
        },
      );
      const data = (await response.json()) as LeadInteraction & {
        error?: string;
      };
      if (!response.ok) throw new Error(data.error || 'That did not save.');
      setEntries((current) => [data, ...(current ?? [])]);
      setSummary('');
      setShared('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That did not save.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(entryId: string) {
    setRemoving(entryId);
    setError('');
    try {
      const response = await fetch(
        `/api/admin/opportunities/${leadId}/interactions`,
        {
          method: 'DELETE',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ entryId }),
        },
      );
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || 'That did not remove.');
      // Dropped from the list rather than refetched: the server has confirmed
      // it, and a reload here would collapse the open section.
      setEntries((current) =>
        (current ?? []).filter((entry) => entry.id !== entryId),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That did not remove.');
    } finally {
      setRemoving(null);
    }
  }

  const days = entries ? daysSinceContact(entries, today) : null;
  const waiting = entries?.length ? awaitingReply(entries) : false;

  return (
    <details className="lead-history" onToggle={() => void load()}>
      <summary>
        Conversation history
        {entries !== null && (
          <span className="lead-history-state">
            {days === null
              ? 'nothing recorded'
              : `last contact ${days === 0 ? 'today' : `${days}d ago`}`}
            {waiting ? ' Â· awaiting reply' : ''}
          </span>
        )}
      </summary>
      {loading && (
        <div className="lead-history-line">
          <SkeletonRows rows={3} label="Loading contact history" />
        </div>
      )}
      {error && (
        <p className="lead-history-line" role="alert">
          {error}
        </p>
      )}
      {entries && !entries.length && !loading && (
        <p className="lead-history-line">
          Nothing recorded. Add what was last said so this lead cannot go quiet
          unnoticed.
        </p>
      )}
      {entries && entries.length > 0 && (
        <ol className="lead-history-list">
          {entries.map((entry) => (
            <li key={entry.id} data-direction={entry.direction}>
              <span className="lead-history-when">{entry.occurredAt}</span>
              <span className="lead-history-channel">
                {CHANNEL_LABEL[entry.channel as InteractionChannel] ??
                  entry.channel}
                {entry.direction === 'inbound' ? ' in' : ' out'}
              </span>
              <span className="lead-history-summary">
                {entry.summary}
                {entry.shared && <em>Sent: {entry.shared}</em>}
              </span>
              <ConfirmAction
                className="lead-history-remove"
                label="Remove"
                confirmLabel="Remove entry"
                pendingLabel="Removing"
                title="Remove this entry from the history"
                pending={removing === entry.id}
                disabled={removing !== null}
                onConfirm={() => void remove(entry.id)}
              />
            </li>
          ))}
        </ol>
      )}
      <form className="lead-history-add" onSubmit={add}>
        <div>
          <label>
            <span className="sr-only">Channel</span>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as InteractionChannel)}
            >
              {INTERACTION_CHANNELS.map((value) => (
                <option key={value} value={value}>
                  {CHANNEL_LABEL[value]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Direction</span>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as Direction)}
            >
              {DIRECTIONS.map((value) => (
                <option key={value} value={value}>
                  {DIRECTION_LABEL[value]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <input
          value={summary}
          maxLength={500}
          placeholder="What was said?"
          onChange={(e) => setSummary(e.target.value)}
          aria-label="What happened"
        />
        <input
          value={shared}
          maxLength={300}
          placeholder="Anything sent? (optional)"
          onChange={(e) => setShared(e.target.value)}
          aria-label="What was shared"
        />
        <PendingButton
          type="submit"
          pending={busy}
          pendingLabel="Recording"
          disabled={!summary.trim()}
        >
          <Plus size={15} />
          Record
        </PendingButton>
      </form>
    </details>
  );
}
