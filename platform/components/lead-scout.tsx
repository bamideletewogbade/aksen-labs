'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { SkeletonRows, Spinner } from '@/components/ui/activity';
import type { Prospect } from '@/lib/prospect-evidence';
type Lead = {
  id: string;
  company: string;
  website: string;
  status: string;
  data: Prospect;
  opportunity_id: string | null;
};
type RunEvent = {
  id?: string;
  run_id?: string;
  runId?: string;
  stage: 'scout' | 'enrich' | 'verify' | 'save';
  status: 'active' | 'completed' | 'failed' | 'skipped';
  message: string;
  details?: Record<string, number | string>;
  created_at?: string;
};
type Data = {
  campaign: {
    id: string;
    target: string;
    enabled: boolean;
    next_run_at: string;
    running_until: string | null;
  } | null;
  leads: Lead[];
  runs: {
    id: string;
    status: string;
    found: number;
    note: string;
    created_at: string;
  }[];
  events: RunEvent[];
  aiConfigured: boolean;
  /** null when the workspace is uncapped, which is not the same as none left. */
  remainingRuns: number | null;
  dailyRuns: number;
  targetMaxLength: number;
};
const researchAgents = [
  {
    stage: 'scout',
    name: 'Scout',
    job: 'Finds matching businesses and official websites.',
  },
  {
    stage: 'enrich',
    name: 'Enricher',
    job: 'Collects public business facts and contact details.',
  },
  {
    stage: 'verify',
    name: 'Evidence gate',
    job: 'Rejects claims and contacts unsupported by sources.',
  },
  {
    stage: 'save',
    name: 'CRM agent',
    job: 'Deduplicates and saves records for your review.',
  },
] as const;
type Readiness = {
  database: boolean;
  missingTables: string[];
  openrouter: boolean;
  resend: boolean;
  adminAllowlist: boolean;
  notes: string[];
};
export function LeadScout() {
  const [data, setData] = useState<Data | null>(null);
  const [ready, setReady] = useState<Readiness | null>(null);
  const [target, setTarget] = useState(
    'Furniture and custom-order businesses in Ghana with a public company website.',
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('new');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState('');
  const [checkedAt, setCheckedAt] = useState(0);
  const [liveEvents, setLiveEvents] = useState<RunEvent[]>([]);
  const dirty = useRef(false);
  const locked = useRef(false);
  const targetBox = useRef<HTMLTextAreaElement>(null);
  // Falls back until the first load answers; the server remains the authority.
  const maxTarget = data?.targetMaxLength ?? 8000;
  // Grow to fit the brief instead of scrolling a small window, capped so a
  // long prompt cannot push the search buttons off the screen.
  useEffect(() => {
    const box = targetBox.current;
    if (!box) return;
    box.style.height = 'auto';
    box.style.height = `${Math.min(box.scrollHeight + 2, 520)}px`;
  }, [target]);
  const visible = (data?.leads || []).filter(
    (lead) =>
      (filter === 'all' || lead.status === filter) &&
      [lead.company, lead.website, ...lead.data.contacts.map((c) => c.value)]
        .join(' ')
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const unsaved = target.trim() !== data?.campaign?.target;
  const validTarget = target.trim().length >= 10;
  const running =
    !!data?.campaign?.running_until &&
    new Date(data.campaign.running_until).getTime() > checkedAt;
  const researchBlocked =
    !data?.campaign?.enabled ||
    !data.aiConfigured ||
    data.remainingRuns === 0 ||
    running;
  const reason = loading
    ? 'Loading your saved search…'
    : !data
      ? 'Refresh to load your saved search.'
      : !data.campaign
        ? 'Save a target to enable discovery.'
        : unsaved
          ? 'Save your target changes before searching.'
          : !data.aiConfigured
            ? 'The AI connection needs configuration.'
            : !data.campaign.enabled
              ? 'Searches are paused. Resume to discover or enrich leads.'
              : data.remainingRuns === 0
                ? 'Daily research allowance used. It resets at midnight UTC.'
                : running
                  ? 'A search is already running. Refresh to check its progress.'
                  : 'Ready to discover businesses.';
  const latestRunId = data?.runs[0]?.id;
  const shownEvents = liveEvents.length
    ? liveEvents
    : (data?.events || [])
        .filter((event) => event.run_id === latestRunId)
        .reverse();
  const load = useCallback(async () => {
    const [response, health] = await Promise.all([
      fetch('/api/admin/prospects', { signal: AbortSignal.timeout(30000) }),
      fetch('/api/admin/readiness', {
        signal: AbortSignal.timeout(30000),
      }).catch(() => null),
    ]);
    const payload = (await response.json()) as Data & { error?: string };
    if (!response.ok)
      throw new Error(payload.error || 'Lead Scout unavailable.');
    setData(payload);
    setCheckedAt(Date.now());
    if (payload.campaign && !dirty.current) setTarget(payload.campaign.target);
    if (health?.ok) setReady((await health.json()) as Readiness);
  }, []);
  useEffect(() => {
    void Promise.resolve()
      .then(load)
      .catch((e) => setError(e instanceof Error ? e.message : 'Load failed.'))
      .finally(() => setLoading(false));
  }, [load]);
  async function act(action: string, id?: string) {
    if (locked.current) return;
    locked.current = true;
    setPending(action + (id ? ':' + id : ''));
    setBusy(true);
    setError('');
    setMessage('');
    if (action === 'discover' || action === 'enrich') setLiveEvents([]);
    try {
      if (action === 'refresh') {
        await load();
        setMessage('Queue refreshed.');
        return;
      }
      const response = await fetch('/api/admin/prospects', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, target, id }),
        signal: AbortSignal.timeout(150000),
      });
      if (
        response.headers
          .get('content-type')
          ?.includes('application/x-ndjson') &&
        response.body
      ) {
        if (!response.ok) throw new Error('The research run could not start.');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let finalNote = '';
        while (true) {
          const { done, value } = await reader.read();
          buffer += decoder.decode(value || new Uint8Array(), {
            stream: !done,
          });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (!line.trim()) continue;
            const event = JSON.parse(line) as RunEvent & {
              type: string;
              error?: string;
              note?: string;
            };
            if (event.type === 'progress')
              setLiveEvents((current) => [...current, event]);
            if (event.type === 'complete')
              finalNote = event.note || 'Research complete.';
            if (event.type === 'error')
              throw new Error(event.error || 'The research run stopped.');
          }
          if (done) break;
        }
        setMessage(finalNote || 'Research complete.');
        await load();
        return;
      }
      const result = (await response.json()) as {
        error?: string;
        note?: string;
      };
      if (!response.ok)
        throw new Error(
          (result.error || 'Action failed.') +
            ' Reference: ' +
            (response.headers.get('x-request-id') || 'unavailable'),
        );
      if (action === 'configure') dirty.current = false;
      setMessage(result.note || 'Done.');
      await load().catch(() =>
        setError(
          'The action succeeded, but the queue could not refresh. Use Refresh before repeating it.',
        ),
      );
    } catch (e) {
      if (action === 'discover' || action === 'enrich')
        await load().catch(() => undefined);
      setError(
        e instanceof Error && e.name === 'TimeoutError'
          ? 'The request timed out. Refresh before retrying; the run may still finish.'
          : e instanceof Error
            ? e.message
            : 'Action failed.',
      );
    } finally {
      locked.current = false;
      setPending('');
      setLoading(false);
      setBusy(false);
    }
  }
  return (
    <div className="scout">
      <section className="scout-panel">
        <h2>Find businesses worth a conversation</h2>
        <p>
          Search public company information, review the evidence and move
          suitable prospects into Enquiries. No outreach is sent.
        </p>
        <div className="scout-target-head">
          <label htmlFor="scout-target">Target market</label>
          <span
            className={
              target.length > maxTarget * 0.9
                ? 'scout-counter is-near'
                : 'scout-counter'
            }
          >
            {target.length.toLocaleString()} / {maxTarget.toLocaleString()}
          </span>
        </div>
        <textarea
          id="scout-target"
          ref={targetBox}
          className="scout-target"
          value={target}
          maxLength={maxTarget}
          spellCheck={false}
          disabled={busy || loading}
          aria-describedby="scout-target-hint"
          placeholder={
            'Describe who you want to reach. Markdown is fine.\n\n## Objective\nFind ...\n\n## Good fit\n- ...\n\n## Avoid\n- ...'
          }
          onKeyDown={(e) => {
            // A prompt is written as an outline, so Tab should indent rather
            // than jump to the next control and lose the writer's place.
            // Shift+Tab still moves focus, which keeps keyboard navigation out.
            if (e.key !== 'Tab' || e.shiftKey) return;
            e.preventDefault();
            const box = e.currentTarget;
            const { selectionStart: from, selectionEnd: to } = box;
            const next = target.slice(0, from) + '  ' + target.slice(to);
            if (next.length > maxTarget) return;
            dirty.current = true;
            setTarget(next);
            requestAnimationFrame(() => {
              box.selectionStart = box.selectionEnd = from + 2;
            });
          }}
          onChange={(e) => {
            dirty.current = true;
            setTarget(e.target.value);
          }}
        />
        <p id="scout-target-hint" className="scout-small">
          Headings and lists are kept as written. Tab indents; Shift+Tab leaves
          the field.
        </p>
        <div className="scout-actions">
          <button
            disabled={busy || loading || !data || !validTarget || !unsaved}
            onClick={() => act('configure')}
          >
            Save target
          </button>
          <button
            className="scout-primary"
            disabled={busy || loading || researchBlocked || unsaved}
            aria-describedby="scout-search-status"
            onClick={() => act('discover')}
          >
            Find up to 5 businesses
          </button>
          {data?.campaign && (
            <button
              disabled={busy}
              onClick={() => act(data.campaign?.enabled ? 'pause' : 'resume')}
            >
              {data.campaign.enabled ? 'Pause searches' : 'Resume searches'}
            </button>
          )}
          <button disabled={busy || loading} onClick={() => act('refresh')}>
            Refresh
          </button>
        </div>
        <p id="scout-search-status" className="scout-search-status">
          {reason}
        </p>
        <p className="scout-small">
          {/* Read from the server rather than written here, so the number
              shown is the number actually enforced. */}
          {data
            ? data.remainingRuns === null
              ? 'Research runs are not capped for this workspace. '
              : `${data.remainingRuns} of ${data.dailyRuns} research runs remaining today. `
            : ''}
          Sources and contact details need human review. A saved target controls
          searches; recurring execution requires the connected scheduler.
        </p>
        {busy && (
          <output aria-live="polite" className="scout-working">
            <Spinner size={15} />
            <span>
              {pending.startsWith('enrich')
                ? 'Enriching the selected business…'
                : pending === 'discover'
                  ? 'Researching businesses…'
                  : 'Saving or refreshing…'}{' '}
              Research can take about a minute.
            </span>
          </output>
        )}
        {message && <output aria-live="polite">{message}</output>}
        {error && <p role="alert">{error}</p>}
      </section>
      <section
        className="scout-agent-board"
        aria-labelledby="research-team-heading"
      >
        <div className="scout-agent-head">
          <div>
            <span className="scout-eyebrow">RESEARCH TEAM</span>
            <h2 id="research-team-heading">
              From market search to review queue
            </h2>
          </div>
          <span
            className={
              busy &&
              ['discover', 'enrich'].some((value) => pending.startsWith(value))
                ? 'scout-live'
                : 'scout-idle'
            }
          >
            {busy &&
            ['discover', 'enrich'].some((value) => pending.startsWith(value))
              ? 'Agents working'
              : shownEvents.length
                ? 'Latest run'
                : 'Ready'}
          </span>
        </div>
        <ol className="scout-agent-flow">
          {researchAgents.map((agent, index) => {
            const event = [...shownEvents]
              .reverse()
              .find((item) => item.stage === agent.stage);
            return (
              <li
                key={agent.stage}
                className={event ? `is-${event.status}` : ''}
              >
                <span className="scout-agent-number">{index + 1}</span>
                <div>
                  <strong>{agent.name}</strong>
                  <p>{event?.message || agent.job}</p>
                </div>
                <span className="scout-agent-state">
                  {event?.status || 'waiting'}
                </span>
              </li>
            );
          })}
        </ol>
        <p className="scout-agent-note">
          Agents only use public business information. Nothing here contacts a
          prospect; you decide what enters Enquiries.
        </p>
      </section>
      {ready && (
        <details className="scout-panel">
          <summary>
            Business readiness ·{' '}
            {ready.database && !ready.missingTables.length
              ? 'database connected'
              : 'database needs attention'}
          </summary>
          <ul>
            <li>AI key: {ready.openrouter ? 'configured' : 'missing'}</li>
            <li>
              Resend sender and key:{' '}
              {ready.resend ? 'configured' : 'not configured'}
            </li>
            <li>
              Production admin allowlist:{' '}
              {ready.adminAllowlist
                ? 'configured'
                : 'not configured; production access stays closed'}
            </li>
            {ready.missingTables.length > 0 && (
              <li>Missing tables: {ready.missingTables.join(', ')}</li>
            )}
            {ready.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </details>
      )}
      <section>
        <h2>Prospect review queue</h2>
        <label htmlFor="scout-query">Search saved leads</label>
        <input
          id="scout-query"
          className="scout-query"
          type="search"
          placeholder="Company, website or contact"
          value={query}
          maxLength={200}
          onChange={(e) => setQuery(e.target.value)}
        />
        <p className="scout-small">
          {visible.length} matching leads · Latest {data?.leads.length || 0}{' '}
          records loaded (up to 100).
        </p>
        <fieldset className="scout-filters">
          <legend>Show</legend>
          {['new', 'shortlisted', 'promoted', 'dismissed', 'all'].map(
            (status) => (
              <label key={status}>
                <input
                  type="radio"
                  name="scout-filter"
                  checked={filter === status}
                  onChange={() => setFilter(status)}
                />
                {status} (
                {data?.leads.filter(
                  (l) => status === 'all' || l.status === status,
                ).length || 0}
                )
              </label>
            ),
          )}
        </fieldset>
        {!data && !error && <SkeletonRows rows={5} label="Loading saved leads" />}
        {data && !visible.length && (
          <p>No leads in this view. Run a search or choose another status.</p>
        )}
        <div className="scout-grid">
          {visible.map((lead) => (
            <article className="scout-panel" key={lead.id}>
              <span className="scout-small">
                {lead.status} · Public research, not verified buying intent
              </span>
              <h3>{lead.company}</h3>
              <a href={lead.website} target="_blank" rel="noreferrer">
                Company website ↗
              </a>
              <p>{lead.data.description}</p>
              <h4>Possible fit — AI hypothesis</h4>
              <p>{lead.data.opportunity}</p>
              <h4>Public business contacts</h4>
              {lead.data.contacts.length ? (
                <ul>
                  {lead.data.contacts.map((c, i) => (
                    <li key={i}>
                      <strong>{c.kind}: </strong>
                      {c.value}{' '}
                      <a href={c.source} target="_blank" rel="noreferrer">
                        Source ↗
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No contact details supported by the returned evidence.</p>
              )}
              <p className="scout-small">
                Checked {new Date(lead.data.checkedAt).toLocaleDateString()}.
                Public availability does not establish consent to marketing.
              </p>
              <details>
                <summary>
                  Review source evidence ({lead.data.sources.length})
                </summary>
                {lead.data.sources.map((s, i) => (
                  <div key={i}>
                    <a href={s.url} target="_blank" rel="noreferrer">
                      {s.title || s.url} ↗
                    </a>
                    <p className="scout-excerpt">
                      {s.content ||
                        'No excerpt returned. Open the source to verify.'}
                    </p>
                  </div>
                ))}
              </details>
              <div className="scout-actions">
                {['new', 'shortlisted'].includes(lead.status) && (
                  <>
                    <button
                      disabled={busy || researchBlocked}
                      onClick={() => act('enrich', lead.id)}
                    >
                      {pending === 'enrich:' + lead.id
                        ? 'Enriching…'
                        : 'Enrich public details'}
                    </button>
                    {lead.status === 'new' && (
                      <button
                        disabled={busy}
                        onClick={() => act('shortlist', lead.id)}
                      >
                        Shortlist
                      </button>
                    )}
                    {lead.status === 'shortlisted' && (
                      <button
                        disabled={busy}
                        onClick={() => act('promote', lead.id)}
                      >
                        Move to Enquiries
                      </button>
                    )}
                    <button
                      disabled={busy}
                      onClick={() => act('dismiss', lead.id)}
                    >
                      Dismiss
                    </button>
                  </>
                )}
                {lead.status === 'dismissed' && (
                  <button
                    disabled={busy}
                    onClick={() => act('restore', lead.id)}
                  >
                    Restore to new leads
                  </button>
                )}
                {lead.opportunity_id && (
                  <Link
                    href={
                      '/admin/pipeline?q=' + encodeURIComponent(lead.company)
                    }
                  >
                    Open Enquiries →
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
      <details className="scout-panel">
        <summary>Recent search runs</summary>
        <ul>
          {data?.runs.length === 0 && <li>No searches have run yet.</li>}
          {data?.runs.map((run) => (
            <li key={run.id}>
              <strong>
                {new Date(run.created_at).toLocaleString()} · {run.status}
              </strong>
              <span>
                {run.note ||
                  'In progress. A run left here after interruption needs review.'}
              </span>
              {data.events.some((event) => event.run_id === run.id) && (
                <ol className="scout-run-events">
                  {data.events
                    .filter((event) => event.run_id === run.id)
                    .reverse()
                    .map((event) => (
                      <li key={event.id}>
                        <span>{event.stage}</span>
                        <b>{event.status}</b>
                        <p>{event.message}</p>
                      </li>
                    ))}
                </ol>
              )}
            </li>
          ))}
        </ul>
        <Link href="/admin/audit">Open activity log →</Link>
      </details>
    </div>
  );
}
