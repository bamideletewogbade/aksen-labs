'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { OutreachBrief } from '@/lib/prospect-outreach';

type RecordRow = {
  brief: OutreachBrief;
  outbox_id: string | null;
  email_status: string | null;
  response_status: string;
  response_note: string;
  next_action: string;
  followup_date: string | null;
};
type OutreachResponse = {
  record: RecordRow | null;
  sendingConfigured: boolean;
  opportunityId?: string;
  error?: string;
};
export function ProspectOutreach({
  leadId,
  onEnquiryChange,
}: {
  leadId: string;
  /** Called when a recorded reply moved this prospect into Enquiries. */
  onEnquiryChange?: () => void;
}) {
  const [record, setRecord] = useState<RecordRow | null>(null);
  const [opportunityId, setOpportunityId] = useState('');
  const [opened, setOpened] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [configured, setConfigured] = useState(false);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [reason, setReason] = useState('');
  const [reviewed, setReviewed] = useState(false);
  const [responseStatus, setResponseStatus] = useState('interested');
  const [note, setNote] = useState('');
  const [next, setNext] = useState('');
  const [date, setDate] = useState('');
  const accept = useCallback((value: RecordRow | null) => {
    setRecord(value);
    if (value) {
      setSubject(value.brief.subject);
      setContent(value.brief.body);
      setNote(value.response_note);
      setNext(value.next_action);
      setDate(value.followup_date?.slice(0, 10) || '');
      if (value.response_status !== 'not_recorded')
        setResponseStatus(value.response_status);
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    fetch(
      '/api/admin/prospects/outreach?leadId=' + encodeURIComponent(leadId),
      { signal: controller.signal },
    )
      .then(async (r) => {
        if (!r.ok) throw new Error('Outreach status could not be loaded.');
        return r.json() as Promise<OutreachResponse>;
      })
      .then((d) => {
        accept(d.record);
        setConfigured(d.sendingConfigured);
        setOpportunityId(d.opportunityId || '');
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, [leadId, accept]);
  async function act(action: string, extra: Record<string, unknown> = {}) {
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/admin/prospects/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, leadId, ...extra }),
      });
      const d = (await r.json()) as OutreachResponse;
      if (!r.ok) throw new Error(d.error || 'Action failed.');
      accept(d.record);
      setConfigured(d.sendingConfigured);
      setOpened(true);
      if (d.opportunityId && d.opportunityId !== opportunityId) {
        setOpportunityId(d.opportunityId);
        onEnquiryChange?.();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="prospect-outreach" aria-label="Outreach workflow">
      <button
        disabled={busy}
        onClick={() => (record ? setOpened(!opened) : void act('prepare'))}
      >
        {busy
          ? 'Working…'
          : record
            ? opened
              ? 'Close outreach brief'
              : 'Open outreach brief'
            : 'Prepare outreach with AI'}
      </button>
      {record?.next_action && (
        <p className="scout-small">
          Next: {record.next_action}
          {record.followup_date
            ? ` · ${record.followup_date.slice(0, 10)}`
            : ''}
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      {opened && record && (
        <div>
          <h4>1. Check the evidence</h4>
          <p>Recipient: {record.brief.recipient}</p>
          <p className="scout-small">
            Evidence checked:{' '}
            {record.brief.checkedAt
              ? new Date(record.brief.checkedAt).toLocaleDateString()
              : 'Date not recorded; review sources before contact'}
            .
          </p>
          {record.brief.observations.map((o, i) => (
            <blockquote key={i}>
              <p>{o.quote}</p>
              <a href={o.source} target="_blank" rel="noreferrer">
                Read source ↗
              </a>
            </blockquote>
          ))}
          <p>
            <strong>Possible issue, not confirmed:</strong>{' '}
            {record.brief.hypothesis}
          </p>
          <p>
            <strong>Ask in discovery:</strong> {record.brief.question}
          </p>
          {!record.outbox_id ? (
            <>
              <h4>2. Review your first email</h4>
              <label>
                Subject
                <input
                  value={subject}
                  maxLength={180}
                  onChange={(e) => {
                    setSubject(e.target.value);
                    setReviewed(false);
                  }}
                />
              </label>
              <label>
                Message
                <textarea
                  rows={9}
                  value={content}
                  maxLength={4000}
                  onChange={(e) => {
                    setContent(e.target.value);
                    setReviewed(false);
                  }}
                />
              </label>
              <label>
                Why is it appropriate to contact this business?
                <textarea
                  value={reason}
                  maxLength={1000}
                  onChange={(e) => {
                    setReason(e.target.value);
                    setReviewed(false);
                  }}
                />
              </label>
              <label className="outreach-confirm">
                <input
                  type="checkbox"
                  checked={reviewed}
                  onChange={(e) => setReviewed(e.target.checked)}
                />
                I checked the sources, recipient and wording. Save this as a
                draft only.
              </label>
              <button
                disabled={busy || !reviewed || !reason.trim()}
                onClick={() =>
                  void act('save', {
                    subject,
                    content,
                    relationshipNote: reason,
                    reviewed,
                  })
                }
              >
                Save reviewed email draft
              </button>
            </>
          ) : (
            <>
              <h4>2. Email draft saved</h4>
              <p>
                Email status:{' '}
                {record.email_status === 'sent'
                  ? 'Accepted by Resend, delivery not confirmed'
                  : record.email_status}
                .
              </p>
              <Link
                href={
                  '/admin/email?batch=' + encodeURIComponent(record.outbox_id)
                }
              >
                Review draft in Email Desk →
              </Link>
            </>
          )}
          {!configured && (
            <p>Sending is not configured. You can prepare and save drafts.</p>
          )}
          {record.outbox_id &&
            ['sent', 'uncertain'].includes(record.email_status || '') && (
              <>
                <h4>3. Record the response and next action</h4>
                <p>
                  Record an actual reply here. Replies are not imported
                  automatically.
                </p>
                {record.response_status !== 'not_recorded' && (
                  <p>
                    Recorded: {record.response_status.replaceAll('_', ' ')}.{' '}
                    {record.next_action}
                  </p>
                )}
                {opportunityId ? (
                  <p className="scout-small">
                    The next action and follow-up date also go on the enquiry,
                    so they appear in Sales and on Today.{' '}
                    <Link
                      href={
                        '/admin/pipeline?leadId=' +
                        encodeURIComponent(opportunityId)
                      }
                    >
                      Open the enquiry →
                    </Link>
                  </p>
                ) : (
                  <p className="scout-small">
                    Recording an interested reply moves this prospect into
                    Enquiries, with its next action and follow-up date.
                  </p>
                )}
                <label>
                  Response
                  <select
                    value={responseStatus}
                    onChange={(e) => setResponseStatus(e.target.value)}
                  >
                    <option value="interested">Interested</option>
                    <option value="not_now">Not now</option>
                    <option value="not_interested">Not interested</option>
                    <option value="do_not_contact">
                      Asked not to be contacted
                    </option>
                  </select>
                </label>
                <label>
                  What did they say?
                  <textarea
                    value={note}
                    maxLength={2000}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </label>
                <label>
                  Next action
                  <input
                    value={next}
                    maxLength={500}
                    onChange={(e) => setNext(e.target.value)}
                  />
                </label>
                <label>
                  Follow-up date
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </label>
                <button
                  disabled={busy || !note.trim()}
                  onClick={() =>
                    void act('response', {
                      status: responseStatus,
                      note,
                      nextAction: next,
                      followupDate: date,
                    })
                  }
                >
                  Save response
                </button>
              </>
            )}
        </div>
      )}
    </section>
  );
}
