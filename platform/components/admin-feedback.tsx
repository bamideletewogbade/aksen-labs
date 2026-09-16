'use client';
import { useState } from 'react';
import {
  ArrowUpRight,
  Check,
  Eye,
  EyeOff,
  GitMerge,
  Send,
  ListChecks,
} from 'lucide-react';
import {
  changelogKinds,
  ideaStatuses,
  statusLabel,
} from '@/lib/feedback-board';

export type AdminIdea = {
  id: string;
  createdAt: string;
  title: string;
  body: string | null;
  authorEmail: string | null;
  status: string;
  statusNote: string | null;
  voteCount: number;
  published: boolean;
  mergedInto: string | null;
  triageSummary: string | null;
  triageSize: string | null;
  triagedAt: string | null;
};

export type TriageState = {
  configured: boolean;
  enabled: boolean;
  maxPerDay: number;
  lastRunAt: string | null;
  lastNote: string | null;
  running: boolean;
  waiting: number;
  reason: string | null;
};

/**
 * The triage desk.
 *
 * Every control here is a decision, and none of them run on their own. Triage
 * fills in the summary and the size before you arrive; publishing it, moving it
 * and writing what shipped are yours. That split is the whole design, so the
 * panel shows the agent's reading beside the idea rather than in place of it.
 */
export function AdminFeedback({
  ideas,
  triage: initialTriage,
}: {
  ideas: AdminIdea[];
  triage: TriageState;
}) {
  const [rows, setRows] = useState(ideas);
  const [triage, setTriage] = useState(initialTriage);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [shipping, setShipping] = useState('');
  const [merging, setMerging] = useState('');
  const [view, setView] = useState<'waiting' | 'live' | 'all'>('waiting');

  async function refresh() {
    const [listed, state] = await Promise.all([
      fetch('/api/admin/feedback'),
      fetch('/api/admin/feedback/triage'),
    ]);
    if (listed.ok) {
      const next = (await listed.json()) as { ideas: AdminIdea[] };
      setRows(next.ideas);
    }
    if (state.ok) setTriage((await state.json()) as TriageState);
  }

  async function triageAction(payload: Record<string, unknown>) {
    setBusy('triage');
    setError('');
    try {
      const response = await fetch('/api/admin/feedback/triage', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { error?: string; note?: string };
      if (!response.ok) {
        setError(data.error || 'That did not work.');
        return;
      }
      await refresh();
    } catch {
      setError('That did not work. Check your connection.');
    } finally {
      setBusy('');
    }
  }

  async function act(id: string, payload: Record<string, unknown>) {
    setBusy(id);
    setError('');
    try {
      const response = await fetch('/api/admin/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, ...payload }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error || 'That did not save.');
        return false;
      }
      // Refetch rather than patch the row by hand: shipping changes three
      // fields at once and guessing which ones is how a list starts lying.
      await refresh();
      return true;
    } catch {
      setError('That did not save. Check your connection.');
      return false;
    } finally {
      setBusy('');
    }
  }

  const shown = rows.filter((row) =>
    view === 'all' ? true : view === 'waiting' ? !row.published : row.published,
  );

  /** Candidates to merge into: published, not themselves merged, not this one. */
  const mergeTargets = (id: string) =>
    rows.filter((row) => row.id !== id && row.published && !row.mergedInto);

  return (
    <div className="admin-feedback">
      {/* On by default, with a switch, which is the shape a helpful automation
          should have. It says what it did last, what is waiting, and why it is
          not running when it is not. An automation that silently does nothing is
          indistinguishable from a broken one. */}
      <section className="admin-triage" aria-labelledby="triage-title">
        <div className="admin-triage-head">
          <div>
            <small>AUTOMATIC TRIAGE</small>
            <h3 id="triage-title">
              {!triage.configured
                ? 'Not set up on this deployment'
                : triage.enabled
                  ? 'Reading new suggestions as they arrive'
                  : 'Switched off'}
            </h3>
            <p>
              {!triage.configured
                ? 'Run scripts/migrate-feedback-triage.mjs, then reload.'
                : triage.running
                  ? 'A pass is running now.'
                  : (triage.lastNote ??
                    'It has not run yet. Press Read them now, or wait for the next heartbeat.')}
            </p>
          </div>
          <div className="admin-triage-actions">
            <button
              type="button"
              className="is-primary"
              disabled={
                busy === 'triage' || !triage.configured || triage.waiting === 0
              }
              onClick={() => void triageAction({ action: 'run' })}
            >
              <ListChecks size={14} />
              {busy === 'triage'
                ? 'Reading…'
                : triage.waiting > 0
                  ? `Read ${triage.waiting} now`
                  : 'Nothing waiting'}
            </button>
            <label className="admin-triage-switch">
              <input
                type="checkbox"
                checked={triage.enabled}
                disabled={busy === 'triage' || !triage.configured}
                onChange={(event) =>
                  void triageAction({
                    action: 'settings',
                    enabled: event.target.checked,
                    maxPerDay: triage.maxPerDay,
                  })
                }
              />
              Run on its own
            </label>
            <label>
              Max per day
              <input
                type="number"
                min={1}
                max={200}
                defaultValue={triage.maxPerDay}
                disabled={busy === 'triage' || !triage.configured}
                onBlur={(event) => {
                  const next = Number(event.target.value);
                  if (next === triage.maxPerDay) return;
                  void triageAction({
                    action: 'settings',
                    enabled: triage.enabled,
                    maxPerDay: next,
                  });
                }}
              />
            </label>
          </div>
        </div>
        {triage.reason && !triage.running && (
          <p className="admin-triage-reason">{triage.reason}</p>
        )}
        <p className="admin-triage-limit">
          Triage writes a summary, a size and a recommendation. It cannot
          publish, cannot move a status and cannot write a changelog entry.
        </p>
      </section>

      <div className="admin-feedback-views">
        {(
          [
            ['waiting', 'Waiting on you'],
            ['live', 'On the board'],
            ['all', 'Everything'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={view === id}
            className={view === id ? 'is-current' : ''}
            onClick={() => setView(id)}
          >
            {label}
            <span>
              {
                rows.filter((row) =>
                  id === 'all'
                    ? true
                    : id === 'waiting'
                      ? !row.published
                      : row.published,
                ).length
              }
            </span>
          </button>
        ))}
      </div>

      {error && (
        <p className="admin-feedback-error" role="alert">
          {error}
        </p>
      )}

      {shown.length === 0 ? (
        <div className="empty-admin">
          <Check />
          <strong>Nothing here.</strong>
          <span>
            {view === 'waiting'
              ? 'Every suggestion has been read and decided.'
              : 'Nothing has been published to the board yet.'}
          </span>
        </div>
      ) : (
        <ol className="admin-feedback-list">
          {shown.map((idea) => (
            <li key={idea.id} data-status={idea.status}>
              <div className="admin-feedback-top">
                <span className="admin-feedback-votes">
                  {idea.voteCount} {idea.voteCount === 1 ? 'vote' : 'votes'}
                </span>
                <span className="board-status">{statusLabel(idea.status)}</span>
                {idea.published ? (
                  <span className="admin-feedback-live">
                    <Eye size={13} /> On the board
                  </span>
                ) : (
                  <span className="admin-feedback-hidden">
                    <EyeOff size={13} /> Not published
                  </span>
                )}
                {idea.mergedInto && (
                  <span className="admin-feedback-merged">
                    <GitMerge size={13} /> Merged
                  </span>
                )}
                {/* Distinguishes "triage has not got to it" from "triage read it
                    and had nothing to add", which look identical otherwise. */}
                {!idea.triagedAt && (
                  <span className="admin-feedback-untriaged">Not read yet</span>
                )}
                <time>{idea.createdAt.slice(0, 10)}</time>
              </div>

              <h3>{idea.title}</h3>
              {idea.body && <p className="admin-feedback-body">{idea.body}</p>}
              {idea.authorEmail && (
                <p className="admin-feedback-from">
                  From{' '}
                  <a href={`mailto:${idea.authorEmail}`}>{idea.authorEmail}</a>
                </p>
              )}

              {/* The agent's reading, clearly marked as the agent's. It is a
                  suggestion attached to text a stranger wrote, so it is never
                  presented as a finding. */}
              {idea.triageSummary && (
                <div className="admin-feedback-triage">
                  <small>
                    TRIAGE SUGGESTION
                    {idea.triageSize ? ` · ${idea.triageSize}` : ''}
                  </small>
                  <p>{idea.triageSummary}</p>
                </div>
              )}

              <div className="admin-feedback-actions">
                <button
                  type="button"
                  disabled={busy === idea.id}
                  onClick={() =>
                    void act(idea.id, {
                      action: idea.published ? 'hide' : 'publish',
                    })
                  }
                >
                  {idea.published
                    ? 'Take off the board'
                    : 'Publish to the board'}
                </button>
                <label>
                  Status
                  <select
                    value={idea.status}
                    disabled={busy === idea.id}
                    onChange={(event) => {
                      const status = event.target.value;
                      // Declining needs a reason, and the reason belongs to the
                      // person deciding, so it is asked for here rather than
                      // invented by the form.
                      const note =
                        status === 'declined'
                          ? window.prompt(
                              'Why not? This goes on the public card.',
                            )
                          : '';
                      if (status === 'declined' && !note) return;
                      void act(idea.id, { action: 'status', status, note });
                    }}
                  >
                    {ideaStatuses.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="is-primary"
                  disabled={busy === idea.id}
                  onClick={() =>
                    setShipping(shipping === idea.id ? '' : idea.id)
                  }
                >
                  <Send size={14} /> Mark shipped
                </button>
                {/* Only offered where it can do something: a request already
                    merged, or one with nothing to merge into, would be a button
                    that opens an empty list. */}
                {!idea.mergedInto && mergeTargets(idea.id).length > 0 && (
                  <button
                    type="button"
                    disabled={busy === idea.id}
                    onClick={() =>
                      setMerging(merging === idea.id ? '' : idea.id)
                    }
                  >
                    <GitMerge size={14} /> Duplicate of…
                  </button>
                )}
              </div>

              {merging === idea.id && (
                <form
                  className="admin-feedback-ship"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const fields = new FormData(event.currentTarget);
                    void act(idea.id, {
                      action: 'merge',
                      targetId: fields.get('targetId'),
                      note: fields.get('note'),
                    }).then((ok) => {
                      if (ok) setMerging('');
                    });
                  }}
                >
                  <p>
                    The votes move across rather than being thrown away, and
                    this card comes off the board pointing at the one it
                    repeats.
                  </p>
                  <label>
                    Merge into
                    <select name="targetId" required defaultValue="">
                      <option value="" disabled>
                        Choose the earlier request
                      </option>
                      {mergeTargets(idea.id).map((target) => (
                        <option key={target.id} value={target.id}>
                          {target.title.slice(0, 80)} ({target.voteCount})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Note for this card
                    <input
                      name="note"
                      maxLength={400}
                      placeholder="Merged into an earlier request asking the same thing."
                    />
                  </label>
                  <button className="is-primary" disabled={busy === idea.id}>
                    Merge and move the votes
                  </button>
                </form>
              )}

              {idea.statusNote && (
                <p className="admin-feedback-note">
                  On the card: {idea.statusNote}
                </p>
              )}

              {shipping === idea.id && (
                <form
                  className="admin-feedback-ship"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const fields = new FormData(event.currentTarget);
                    void act(idea.id, {
                      action: 'ship',
                      title: fields.get('title'),
                      body: fields.get('body'),
                      kind: fields.get('kind'),
                    }).then((ok) => {
                      if (ok) setShipping('');
                    });
                  }}
                >
                  <p>
                    This writes the changelog entry and moves the card to
                    Shipped in one step, so the two cannot disagree.
                  </p>
                  <label>
                    Headline
                    <input
                      name="title"
                      defaultValue={idea.title}
                      maxLength={110}
                    />
                  </label>
                  <label>
                    What shipped
                    <textarea
                      name="body"
                      rows={3}
                      required
                      maxLength={1200}
                      placeholder="Plain English. What someone can now do that they could not do before."
                    />
                  </label>
                  <label>
                    Kind
                    <select name="kind" defaultValue="improvement">
                      {changelogKinds.map((kind) => (
                        <option key={kind.id} value={kind.id}>
                          {kind.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button className="is-primary" disabled={busy === idea.id}>
                    Publish to the changelog <ArrowUpRight size={14} />
                  </button>
                </form>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
