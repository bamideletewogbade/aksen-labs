'use client';
import {cleanAiText} from '@/lib/ai-text';
import { useEffect, useState } from 'react';
import { PendingButton } from '@/components/ui/activity';
type EmailItem = {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  status: string;
  purpose: string;
  relationship_note: string;
  provider_id?: string;
};
export function EmailDesk() {
  const [data, setData] = useState<{
    items: EmailItem[];
    drafts: { id: string; agent_name: string; content: string }[];
    configured: boolean;
    from: string;
    replyTo: string;
  } | null>(null);
  const [recipient, setRecipient] = useState('bishoptewogbade@gmail.com');
  const [purpose, setPurpose] = useState('test');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [note, setNote] = useState('');
  const [reviewId, setReviewId] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  async function load() {
    try {
      const res = await fetch('/api/admin/email');
      const json = (await res.json()) as {
        error?: string;
        items: EmailItem[];
        drafts: { id: string; agent_name: string; content: string }[];
        configured: boolean;
        from: string;
        replyTo: string;
      };
      if (!res.ok) throw Error(json.error || 'Request failed.');
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load outbox.');
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/admin/email', { signal: controller.signal })
      .then(async (res) => {
        const body = (await res.json()) as NonNullable<typeof data> & {
          error?: string;
        };
        if (!res.ok) throw Error(body.error || 'Outbox unavailable.');
        setData(body);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError('Outbox unavailable. Check access and database connection.');
      });
    return () => controller.abort();
  }, []);
  async function act(action: string) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const res = await fetch('/api/admin/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          action === 'draft'
            ? {
                action,
                recipient,
                subject,
                body,
                purpose,
                relationshipNote: note,
              }
            : { action, id: reviewId, confirmed },
        ),
      });
      const json = (await res.json()) as {
        error?: string;
        items: EmailItem[];
        drafts: { id: string; agent_name: string; content: string }[];
        configured: boolean;
        from: string;
        replyTo: string;
      };
      if (!res.ok) throw Error(json.error || 'Request failed.');
      setNotice(
        action === 'draft'
          ? 'Saved as a draft. Select it below to review before sending.'
          : 'Resend accepted the email. This does not yet confirm inbox delivery.',
      );
      setReviewId('');
      setConfirmed(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Email action failed.');
      await load();
    } finally {
      setBusy(false);
    }
  }
  const reviewed = data?.items.find((i) => i.id === reviewId);
  return (
    <div className="ops-layout">
      <section className="admin-panel ops-controls">
        <h2>Compose a service email</h2>
        <label>
          Start from a saved AI follow-up
          <select
            defaultValue=""
            onChange={(e) => {
              const draft = data?.drafts.find((d) => d.id === e.target.value);
              if (draft) {
                setBody(cleanAiText(draft.content));
                setSubject('Follow-up from Aksen Labs');
              }
            }}
          >
            <option value="">Write a new message</option>
            {data?.drafts.map((draft, index) => (
              <option key={draft.id} value={draft.id}>
                {index + 1}. {draft.agent_name}
              </option>
            ))}
          </select>
        </label>
        <p>
          For individual service correspondence and tests. Marketing campaigns
          remain disabled until subscription, unsubscribe and suppression
          handling are connected.
        </p>
        <p className="ops-status">
          {data?.configured
            ? `Provider configured · From ${data.from}`
            : 'Sending not configured'}
          <br />
          Reply-to: {data?.replyTo || 'bishoptewogbade@gmail.com'}
        </p>
        <label>
          Purpose
          <select value={purpose} onChange={(e) => setPurpose(e.target.value)}>
            <option value="test">Test to reply-to address</option>
            <option value="service">
              Existing enquiry / client correspondence
            </option>
          </select>
        </label>
        <label>
          Recipient
          <input
            type="email"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            maxLength={200}
          />
        </label>
        <label>
          Relationship or test context
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="What enquiry or client request is this responding to?"
          />
        </label>
        <label>
          Subject
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={180}
          />
        </label>
        <label>
          Message
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            maxLength={12000}
          />
        </label>
        <PendingButton
          pending={busy}
          pendingLabel="Saving draft"
          disabled={
            !recipient || !subject.trim() || !body.trim() || !note.trim()
          }
          onClick={() => void act('draft')}
        >
          Save draft
        </PendingButton>
      </section>
      <section className="admin-panel ops-editor">
        <div className="ops-actions">
          <h2>Saved outbox</h2>
          <button onClick={() => void load()}>Refresh</button>
        </div>
        {error && (
          <p role="alert" className="ops-error">
            {error}
          </p>
        )}
        {notice && <output className="ops-status">{notice}</output>}
        {data?.items.length ? (
          data.items.map((item) => (
            <article className="ops-email-row" key={item.id}>
              <strong>{item.subject}</strong>
              <p>
                {item.recipient} ·{' '}
                {item.status === 'sent' ? 'Accepted by Resend' : item.status}
              </p>
              {item.provider_id && (
                <small>Provider reference: {item.provider_id}</small>
              )}
              {['uncertain', 'sending'].includes(item.status) && (
                <p>
                  Check Resend before any retry. This record cannot be sent
                  again automatically.
                </p>
              )}
              <button
                disabled={busy}
                onClick={() => {
                  setReviewId(item.id);
                  setConfirmed(false);
                }}
              >
                Review saved email
              </button>
            </article>
          ))
        ) : (
          <p>No saved emails.</p>
        )}
        {reviewed && (
          <div className="ops-email-review">
            <h3>{reviewed.subject}</h3>
            <p>To: {reviewed.recipient}</p>
            <p>Context: {reviewed.relationship_note}</p>
            <pre>{reviewed.body}</pre>
            {reviewed.status === 'draft' && (
              <>
                <label className="ops-confirm">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                  />
                  I reviewed this exact recipient and message and want to send
                  it.
                </label>
                <PendingButton
                  pending={busy}
                  pendingLabel="Sending"
                  disabled={!confirmed || !data?.configured}
                  onClick={() => void act('send')}
                >
                  Send this email via Resend
                </PendingButton>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
