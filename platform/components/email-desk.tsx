'use client';
import { cleanAiText } from '@/lib/ai-text';
import { useEffect, useMemo, useState } from 'react';
import { PendingButton } from '@/components/ui/activity';
import {
  EMAIL_TEMPLATES,
  TEMPLATE_GROUPS,
  fillTokens,
  findTemplate,
  parseRecipientLines,
  renderForRecipient,
  type Recipient,
} from '@/lib/email-templates';

type EmailItem = {
  id: string;
  batch_key: string;
  recipient: string;
  recipient_name?: string | null;
  subject: string;
  body: string;
  status: string;
  purpose: string;
  relationship_note: string;
  template_key?: string | null;
  provider_id?: string | null;
  created_at: string;
};
type Contact = {
  id: string;
  name: string;
  email: string;
  company: string;
  status: string;
};
type DeskData = {
  items: EmailItem[];
  drafts: { id: string; agent_name: string; content: string }[];
  contacts: Contact[];
  stopped: string[];
  maxGroup: number;
  configured: boolean;
  from: string;
  replyTo: string;
};
type Group = {
  key: string;
  subject: string;
  purpose: string;
  note: string;
  created: string;
  rows: EmailItem[];
};

const PURPOSES: { id: string; label: string; help: string }[] = [
  {
    id: 'outreach',
    label: 'Outreach',
    help: 'People you have met or researched who have not asked you for anything. A line telling them how to stop is added to every copy.',
  },
  {
    id: 'service',
    label: 'Client or enquiry',
    help: 'People already talking to you: enquiries, clients, invoices.',
  },
  {
    id: 'test',
    label: 'Test to myself',
    help: 'Sends one copy to your reply-to address, filled in as it would be for the first person on the list.',
  },
];

const STATUS_LABEL: Record<string, string> = {
  draft: 'draft',
  sending: 'sending',
  sent: 'accepted by Resend',
  uncertain: 'uncertain, check Resend',
  suppressed: 'held, asked to stop',
  discarded: 'discarded',
};

function readSender() {
  try {
    return localStorage.getItem('aksen.email.sender') || '';
  } catch {
    return '';
  }
}

export function EmailDesk() {
  const [data, setData] = useState<DeskData | null>(null);
  const [templateKey, setTemplateKey] = useState('');
  const [purpose, setPurpose] = useState('outreach');
  const [picked, setPicked] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [pasted, setPasted] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [sender, setSender] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [note, setNote] = useState('');
  const [reviewKey, setReviewKey] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [stopEmail, setStopEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function fetchDesk(signal?: AbortSignal) {
    const res = await fetch('/api/admin/email', { signal });
    const json = (await res.json()) as DeskData & { error?: string };
    if (!res.ok) throw Error(json.error || 'Email desk unavailable.');
    return json;
  }
  async function load() {
    try {
      setData(await fetchDesk());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Email desk unavailable.');
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    fetchDesk(controller.signal)
      .then((json) => {
        setData(json);
        // Read here rather than as initial state: the server has no
        // localStorage, and an input that differs between the two is a
        // hydration mismatch.
        setSender((current) => current || readSender());
      })
      .catch((e: unknown) => {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : 'Email desk unavailable.');
      });
    return () => controller.abort();
  }, []);

  const template = templateKey ? findTemplate(templateKey) : undefined;

  function chooseStart(value: string) {
    setError('');
    if (value.startsWith('ai:')) {
      const draft = data?.drafts.find((d) => d.id === value.slice(3));
      setTemplateKey('');
      if (draft) {
        setBody(cleanAiText(draft.content));
        setSubject('Following up');
        setPurpose('service');
      }
      return;
    }
    setTemplateKey(value);
    const next = findTemplate(value);
    if (next) {
      setSubject(next.subject);
      setBody(next.body);
      setPurpose(next.purpose);
      setFields({});
    }
  }

  const stopped = useMemo(() => new Set(data?.stopped ?? []), [data]);
  const parsed = useMemo(() => parseRecipientLines(pasted), [pasted]);
  const recipients: Recipient[] = useMemo(() => {
    const fromContacts = (data?.contacts ?? [])
      .filter((c) => picked.includes(c.id))
      .map((c) => ({
        email: c.email.toLowerCase(),
        name: c.name,
        business: c.company,
      }));
    const seen = new Set<string>();
    return [...fromContacts, ...parsed.recipients].filter((r) => {
      if (seen.has(r.email)) return false;
      seen.add(r.email);
      return true;
    });
  }, [data, picked, parsed]);
  const blocked = recipients.filter((r) => stopped.has(r.email));

  // Shared blanks go in here; per-person blanks are left for the server.
  const shared = { ...fields, sender_name: sender };
  const filledSubject = fillTokens(subject, shared);
  const filledBody = fillTokens(body, shared);
  const sample = recipients[0] ?? { email: '', name: '', business: '' };
  const preview = renderForRecipient(
    { subject: filledSubject, body: filledBody, purpose },
    sample,
  );
  const missing = preview.missing.filter((t) => t !== 'business');
  // The preview only shows the first person; the business name has to be
  // there for everyone the email uses it for.
  const lacksBusiness = /\{\{\s*business\s*\}\}/.test(
    `${filledSubject}\n${filledBody}`,
  )
    ? (purpose === 'test' ? [sample] : recipients).filter((r) => !r.business)
    : [];

  const visibleContacts = (data?.contacts ?? []).filter((c) =>
    `${c.name} ${c.company} ${c.email}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  );

  async function post(payload: Record<string, unknown>) {
    const res = await fetch('/api/admin/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = (await res.json()) as Record<string, unknown> & {
      error?: string;
    };
    if (!res.ok) throw Error(json.error || 'Request failed.');
    return json;
  }

  async function run(work: () => Promise<string>) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      setNotice(await work());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That did not work.');
    } finally {
      await load();
      setBusy(false);
    }
  }

  function saveDrafts() {
    void run(async () => {
      try {
        localStorage.setItem('aksen.email.sender', sender);
      } catch {
        // Remembering the name is a convenience; losing it costs one retype.
      }
      const list =
        purpose === 'test'
          ? [{ ...sample, email: data?.replyTo ?? '' }]
          : recipients;
      const result = await post({
        action: 'draft',
        recipients: list,
        subject: filledSubject,
        body: filledBody,
        purpose,
        relationshipNote: note,
        templateKey,
      });
      setReviewKey(String(result.batchKey));
      setConfirmed(false);
      const count = Number(result.count) || 0;
      return `Saved ${count} ${count === 1 ? 'email' : 'emails'}. Read them on the right, then send.`;
    });
  }

  const groups: Group[] = useMemo(() => {
    const map = new Map<string, Group>();
    for (const item of data?.items ?? []) {
      const group = map.get(item.batch_key) ?? {
        key: item.batch_key,
        subject: item.subject,
        purpose: item.purpose,
        note: item.relationship_note,
        created: item.created_at,
        rows: [],
      };
      group.rows.push(item);
      map.set(item.batch_key, group);
    }
    return [...map.values()].filter(
      (g) => !g.rows.every((r) => r.status === 'discarded'),
    );
  }, [data]);
  const reviewed = groups.find((g) => g.key === reviewKey);
  const reviewDrafts = reviewed?.rows.filter((r) => r.status === 'draft') ?? [];

  const summary = (g: Group) => {
    const counts = new Map<string, number>();
    for (const r of g.rows)
      counts.set(r.status, (counts.get(r.status) ?? 0) + 1);
    return [...counts.entries()]
      .map(([s, n]) => `${n} ${STATUS_LABEL[s] ?? s}`)
      .join(' · ');
  };

  const canSave =
    !busy &&
    !!subject.trim() &&
    !!body.trim() &&
    !!note.trim() &&
    !!sender.trim() &&
    !missing.length &&
    !lacksBusiness.length &&
    (purpose === 'test' ||
      (recipients.length > 0 &&
        recipients.length <= (data?.maxGroup ?? 50) &&
        !blocked.length));

  return (
    <div className="ops-layout email-layout">
      <section className="admin-panel ops-controls">
        <h2>Write an email</h2>
        <p className="ops-status">
          {data?.configured
            ? `Sending from ${data.from}. Replies go to ${data.replyTo}.`
            : 'Sending is not set up yet. You can write and save drafts; add RESEND_API_KEY and RESEND_FROM_EMAIL to send them.'}
        </p>

        <label>
          Start from
          <select
            value={templateKey}
            onChange={(e) => chooseStart(e.target.value)}
          >
            <option value="">A blank email</option>
            {TEMPLATE_GROUPS.map((group) => (
              <optgroup key={group.id} label={group.label}>
                {EMAIL_TEMPLATES.filter((t) => t.group === group.id).map(
                  (t) => (
                    <option key={t.key} value={t.key}>
                      {t.name}
                    </option>
                  ),
                )}
              </optgroup>
            ))}
            {!!data?.drafts.length && (
              <optgroup label="Saved AI follow-ups">
                {data.drafts.map((draft, index) => (
                  <option key={draft.id} value={`ai:${draft.id}`}>
                    {index + 1}. {draft.agent_name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </label>
        {template && <p className="email-hint">Use when: {template.use}</p>}

        <fieldset className="email-purpose">
          <legend>What kind of email</legend>
          {PURPOSES.map((p) => (
            <label key={p.id} className="ops-confirm">
              <input
                type="radio"
                name="purpose"
                value={p.id}
                checked={purpose === p.id}
                onChange={() => setPurpose(p.id)}
              />
              {p.label}
            </label>
          ))}
          <p className="email-hint">
            {PURPOSES.find((p) => p.id === purpose)?.help}
          </p>
        </fieldset>

        <fieldset className="email-recipients">
          <legend>
            Who it goes to{' '}
            <span>
              {recipients.length} of {data?.maxGroup ?? 50} max · each person
              gets their own copy
            </span>
          </legend>
          {!!data?.contacts.length && (
            <>
              <input
                type="search"
                placeholder="Search your enquiries"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="email-picker">
                {visibleContacts.map((c) => {
                  const isStopped = stopped.has(c.email.toLowerCase());
                  return (
                    <label key={c.id} className="ops-confirm">
                      <input
                        type="checkbox"
                        disabled={isStopped}
                        checked={picked.includes(c.id)}
                        onChange={(e) =>
                          setPicked((list) =>
                            e.target.checked
                              ? [...list, c.id]
                              : list.filter((id) => id !== c.id),
                          )
                        }
                      />
                      <span>
                        {c.name} · {c.company}
                        <small>
                          {c.email}
                          {isStopped ? ' · asked to stop' : ''}
                        </small>
                      </span>
                    </label>
                  );
                })}
              </div>
            </>
          )}
          <label>
            Add people, one per line
            <textarea
              rows={3}
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              placeholder={
                'ope@example.com, Ope, The Frame Shop\nKwame Mensah <kwame@example.com>, Wood N Things'
              }
            />
          </label>
          {!!parsed.rejected.length && (
            <p className="ops-error">
              Could not read: {parsed.rejected.join(' · ')}
            </p>
          )}
          {!!blocked.length && (
            <p className="ops-error">
              Asked not to be emailed, remove them:{' '}
              {blocked.map((r) => r.email).join(', ')}
            </p>
          )}
        </fieldset>

        <label>
          Why you are writing to them
          <textarea
            rows={2}
            maxLength={1000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="How you know them, or what they asked. Kept with the record."
          />
        </label>

        <label>
          Sign as
          <input
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            placeholder="Your first name"
            maxLength={60}
          />
        </label>
        {template?.fields.map((field) => (
          <label key={field.key}>
            {field.label}
            <input
              value={fields[field.key] ?? ''}
              onChange={(e) =>
                setFields((f) => ({ ...f, [field.key]: e.target.value }))
              }
              maxLength={400}
            />
            <small className="email-hint">{field.hint}</small>
          </label>
        ))}

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
            rows={12}
            maxLength={12000}
          />
        </label>
        <p className="email-hint">
          {'{{first_name}}'} and {'{{business}}'} are filled in for each person.
        </p>

        {(subject || body) && (
          <div className="ops-email-review email-preview">
            <small>
              Preview
              {recipients.length ? ` for ${sample.name || sample.email}` : ''}
            </small>
            <strong>{preview.subject}</strong>
            <pre>{preview.body}</pre>
          </div>
        )}
        {!!missing.length && (
          <p className="ops-error">
            Still blank: {missing.map((t) => `{{${t}}}`).join(', ')}
          </p>
        )}
        {!!lacksBusiness.length && (
          <p className="ops-error">
            This email uses the business name. Add it after the address for:{' '}
            {lacksBusiness.map((r) => r.email || 'the test copy').join(', ')}
          </p>
        )}

        <PendingButton
          pending={busy}
          pendingLabel="Saving"
          disabled={!canSave}
          onClick={saveDrafts}
        >
          {purpose === 'test'
            ? 'Save a test to myself'
            : `Save ${recipients.length || ''} ${recipients.length === 1 ? 'draft' : 'drafts'}`}
        </PendingButton>
      </section>

      <section className="admin-panel ops-editor">
        <div className="ops-actions">
          <h2>Saved emails</h2>
          <button onClick={() => void load()}>Refresh</button>
        </div>
        {error && (
          <p role="alert" className="ops-error">
            {error}
          </p>
        )}
        {notice && <output className="ops-status">{notice}</output>}

        {reviewed && (
          <div className="ops-email-review">
            <h3>{reviewed.subject}</h3>
            <p>
              {reviewed.rows.length}{' '}
              {reviewed.rows.length === 1 ? 'person' : 'people'} ·{' '}
              {reviewed.purpose} · {summary(reviewed)}
            </p>
            <p>Why: {reviewed.note}</p>
            {reviewed.rows.map((row, index) => (
              <details key={row.id} open={index === 0}>
                <summary>
                  {row.recipient_name ? `${row.recipient_name} · ` : ''}
                  {row.recipient} · {STATUS_LABEL[row.status] ?? row.status}
                </summary>
                <strong>{row.subject}</strong>
                <pre>{row.body}</pre>
              </details>
            ))}
            {!!reviewDrafts.length && (
              <>
                <label className="ops-confirm">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                  />
                  I have read{' '}
                  {reviewDrafts.length === 1
                    ? 'this email'
                    : `all ${reviewDrafts.length} emails`}{' '}
                  and want to send {reviewDrafts.length === 1 ? 'it' : 'them'}.
                </label>
                <div className="ops-actions">
                  <PendingButton
                    pending={busy}
                    pendingLabel="Sending"
                    disabled={!confirmed || !data?.configured}
                    onClick={() =>
                      void run(async () => {
                        const result = await post({
                          action: 'send',
                          batchKey: reviewed.key,
                          count: reviewDrafts.length,
                          confirmed: true,
                        });
                        setConfirmed(false);
                        const held = Number(result.suppressed) || 0;
                        return `Resend accepted ${Number(result.sent) || 0}. That is not yet proof of delivery to the inbox.${held ? ` ${held} held back because they asked to stop.` : ''}`;
                      })
                    }
                  >
                    Send via Resend
                  </PendingButton>
                  <button
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        await post({
                          action: 'discard',
                          batchKey: reviewed.key,
                        });
                        setReviewKey('');
                        return 'Discarded. The record is kept.';
                      })
                    }
                  >
                    Discard
                  </button>
                </div>
              </>
            )}
            {reviewed.rows.some((r) =>
              ['uncertain', 'sending'].includes(r.status),
            ) && (
              <p className="ops-error">
                Check the Resend dashboard before trying again. The desk will
                not resend these by itself.
              </p>
            )}
          </div>
        )}

        {groups.length ? (
          groups.map((g) => (
            <article className="ops-email-row" key={g.key}>
              <strong>{g.subject}</strong>
              <p>
                {g.rows.length === 1
                  ? g.rows[0].recipient
                  : `${g.rows.length} people`}{' '}
                · {summary(g)}
              </p>
              <button
                disabled={busy}
                onClick={() => {
                  setReviewKey(g.key);
                  setConfirmed(false);
                }}
              >
                {g.rows.some((r) => r.status === 'draft')
                  ? 'Review and send'
                  : 'View'}
              </button>
            </article>
          ))
        ) : (
          <p>No saved emails yet.</p>
        )}

        <details className="email-stop">
          <summary>Stop list ({data?.stopped.length ?? 0})</summary>
          <p className="email-hint">
            When someone replies &quot;stop&quot;, add them here. The desk will
            refuse to save or send to them again.
          </p>
          <div className="ops-actions">
            <input
              type="email"
              value={stopEmail}
              onChange={(e) => setStopEmail(e.target.value)}
              placeholder="name@example.com"
              aria-label="Address that asked to stop"
            />
            <button
              disabled={busy || !stopEmail.trim()}
              onClick={() =>
                void run(async () => {
                  await post({ action: 'stop', email: stopEmail });
                  setStopEmail('');
                  return 'Added to the stop list.';
                })
              }
            >
              Add
            </button>
          </div>
          {!!data?.stopped.length && (
            <ul>
              {data.stopped.map((email) => (
                <li key={email}>{email}</li>
              ))}
            </ul>
          )}
        </details>
      </section>
    </div>
  );
}
