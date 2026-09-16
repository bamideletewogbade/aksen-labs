'use client';

import Link from 'next/link';
import { ArrowRight, Check, Loader2, Mail } from 'lucide-react';
import { useState } from 'react';
import { urgency } from '@/lib/pipeline-order';
import { AdminLeadHistory } from '@/components/admin-lead-history';
import { ConfirmAction } from '@/components/ui/confirm-action';
import { StatusNote } from '@/components/ui/activity';

export type Lead = {
  id: string;
  company: string;
  name: string;
  email: string;
  recommendation: string;
  status: string;
  desiredOutcome: string;
  nextAction: string;
  followUpAt: string | null;
};

const STAGES = ['new', 'qualified', 'proposal', 'won', 'lost'];
const STAGE_LABEL: Record<string, string> = {
  new: 'New',
  qualified: 'Qualified',
  proposal: 'Proposal out',
  won: 'Won',
  lost: 'Lost',
};
// The stage used to be a two pixel stripe down the left edge, which is a legend
// you have to be told about. Said in words beside the name it needs no legend,
// and the date only earns a badge when it is asking for something today.
const DUE_LABEL: Record<string, string> = {
  overdue: 'Overdue',
  today: 'Due today',
};

export function AdminPipelineList({
  initialLeads,
  today,
  initialQuery = '',
}: {
  initialLeads: Lead[];
  today: string;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [stageFilter, setStageFilter] = useState('all');
  const [leads, setLeads] = useState(initialLeads);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [failedId, setFailedId] = useState<string | null>(null);
  const [erasingId, setErasingId] = useState<string | null>(null);
  const [destroyNote, setDestroyNote] = useState<{
    id: string;
    failed: boolean;
    message: string;
  } | null>(null);

  async function destroy(lead: Lead, mode: 'erase' | 'remove') {
    setErasingId(lead.id);
    setDestroyNote(null);
    try {
      const response = await fetch(`/api/admin/opportunities/${lead.id}`, {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      const data = (await response.json()) as {
        error?: string;
        interactionsDeleted?: number;
        projectsKept?: number;
      };
      // The refusal to remove an enquiry a project came from explains what to
      // do instead, so it is shown rather than replaced with a generic failure.
      if (!response.ok) throw new Error(data.error || 'That did not work.');

      if (mode === 'remove') {
        setLeads((current) => current.filter((row) => row.id !== lead.id));
        return;
      }
      // Erasure keeps the row, so the list has to show what it now holds
      // rather than what it held when the page loaded.
      setLeads((current) =>
        current.map((row) =>
          row.id === lead.id
            ? {
                ...row,
                name: 'Erased at their request',
                email: '',
                nextAction: 'Erased at their request. No further contact.',
                followUpAt: null,
              }
            : row,
        ),
      );
      setDestroyNote({
        id: lead.id,
        failed: false,
        message: `Erased. ${data.interactionsDeleted ?? 0} history ${
          data.interactionsDeleted === 1 ? 'entry' : 'entries'
        } removed.`,
      });
    } catch (e) {
      setDestroyNote({
        id: lead.id,
        failed: true,
        message: e instanceof Error ? e.message : 'That did not work.',
      });
    } finally {
      setErasingId(null);
    }
  }

  async function startProject(lead: Lead) {
    setBusyId(lead.id);
    setFailedId(null);
    try {
      const response = await fetch(
        `/api/admin/opportunities/${encodeURIComponent(lead.id)}/project`,
        { method: 'POST' },
      );
      if (!response.ok) throw Error('Project creation failed');
      window.location.assign('/admin/projects');
    } catch {
      setFailedId(lead.id);
    } finally {
      setBusyId(null);
    }
  }

  async function save(
    lead: Lead,
    patch: Partial<Pick<Lead, 'status' | 'nextAction' | 'followUpAt'>>,
  ) {
    const before = lead;
    setBusyId(lead.id);
    setFailedId(null);
    setLeads((current) =>
      current.map((item) =>
        item.id === lead.id ? { ...item, ...patch } : item,
      ),
    );
    try {
      const response = await fetch(`/api/admin/opportunities/${lead.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!response.ok) throw new Error('save failed');
      setSavedId(lead.id);
      setTimeout(
        () => setSavedId((current) => (current === lead.id ? null : current)),
        1800,
      );
    } catch {
      setLeads((current) =>
        current.map((item) => (item.id === lead.id ? before : item)),
      );
      setFailedId(lead.id);
    } finally {
      setBusyId(null);
    }
  }

  const open = leads.filter(
    (lead) => lead.status !== 'won' && lead.status !== 'lost',
  ).length;
  const overdue = leads.filter(
    (lead) => urgency(lead, today) === 'overdue',
  ).length;
  const dueToday = leads.filter(
    (lead) => urgency(lead, today) === 'today',
  ).length;
  const unscheduled = leads.filter(
    (lead) =>
      lead.status !== 'won' && lead.status !== 'lost' && !lead.followUpAt,
  ).length;

  const visible = leads.filter(
    (lead) =>
      (stageFilter === 'all' || lead.status === stageFilter) &&
      [lead.company, lead.name, lead.email, lead.recommendation]
        .join(' ')
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );

  return (
    <>
      <div className="admin-record-toolbar">
        <label>
          Search enquiries
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search the loaded records"
          />
        </label>
      </div>
      {/* Stages as chips with counts, instead of a select that hid how many
          enquiries sat in each stage until you opened it. */}
      <fieldset className="lead-stage-chips">
        <legend className="sr-only">Filter by stage</legend>
        {['all', ...STAGES].map((stage) => {
          const count =
            stage === 'all'
              ? leads.length
              : leads.filter((lead) => lead.status === stage).length;
          return (
            <button
              key={stage}
              type="button"
              aria-pressed={stageFilter === stage}
              className="lead-stage-chip"
              onClick={() => setStageFilter(stage)}
            >
              {stage === 'all' ? 'All' : STAGE_LABEL[stage]}
              <span>{count}</span>
            </button>
          );
        })}
      </fieldset>
      <output className="admin-filter-count">
        {visible.length} matching{' '}
        {visible.length === 1 ? 'enquiry' : 'enquiries'}
      </output>
      {visible.length === 0 && (
        <div className="empty-admin">
          <strong>No matching enquiries.</strong>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setStageFilter('all');
            }}
          >
            Clear filters
          </button>
        </div>
      )}
      <p className="content-count">
        {open} still open of {leads.length}
        {overdue > 0 && <b className="tag-overdue">{overdue} overdue</b>}
        {dueToday > 0 && <b className="tag-today">{dueToday} due today</b>}
        {unscheduled > 0 && (
          <b className="tag-unset">{unscheduled} with no date</b>
        )}
      </p>
      <div className="pipeline-list">
        {visible.map((lead) => {
          const due = urgency(lead, today);
          return (
            <article
              key={lead.id}
              className={`lead-row stage-${lead.status} due-${due}`}
            >
              <div className="company-mark">{lead.company.slice(0, 1)}</div>
              <div className="lead-who">
                <div className="lead-title">
                  <strong>{lead.company}</strong>
                  <span className="lead-tag" data-stage={lead.status}>
                    {STAGE_LABEL[lead.status]}
                  </span>
                  {DUE_LABEL[due] && (
                    <span className="lead-tag" data-due={due}>
                      {DUE_LABEL[due]}
                    </span>
                  )}
                </div>
                <span className="lead-person">
                  {lead.name} · {lead.recommendation}
                </span>
                {lead.email && (
                  <a className="lead-mail" href={`mailto:${lead.email}`}>
                    <Mail size={13} /> {lead.email}
                  </a>
                )}
              </div>
              {/* What you came to do sits beside the name; history and the two
                  destructive options fold away, because they are opened a few
                  times a month and made every row three times taller. */}
              <div className="lead-quick">
                <Link
                  className="lead-prepare"
                  href={`/admin/operations?lead=${encodeURIComponent(lead.id)}`}
                >
                  Prepare with AI
                  <ArrowRight size={14} />
                </Link>
                {lead.status === 'won' && (
                  <button
                    className="lead-project"
                    disabled={busyId === lead.id}
                    onClick={() => void startProject(lead)}
                  >
                    Create / open project
                  </button>
                )}
              </div>
              <div className="lead-controls">
                <label className="lead-stage">
                  {/* The short caption is what you read; the company keeps the
                    control's accessible name unique across thirty rows. */}
                  <span className="lead-field-label">
                    Stage<span className="sr-only"> for {lead.company}</span>
                  </span>
                  <select
                    value={lead.status}
                    disabled={busyId === lead.id}
                    onChange={(event) =>
                      void save(lead, { status: event.target.value })
                    }
                  >
                    {STAGES.map((stage) => (
                      <option key={stage} value={stage}>
                        {STAGE_LABEL[stage]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="lead-next">
                  <span className="lead-field-label">
                    Next action
                    <span className="sr-only"> for {lead.company}</span>
                  </span>
                  <input
                    key={lead.nextAction}
                    defaultValue={lead.nextAction || ''}
                    placeholder="What happens next?"
                    disabled={busyId === lead.id}
                    onBlur={(event) => {
                      const value = event.target.value.trim();
                      if (!value || value === lead.nextAction) {
                        event.target.value = lead.nextAction || '';
                        return;
                      }
                      void save(lead, { nextAction: value });
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') event.currentTarget.blur();
                    }}
                  />
                </label>
                <label className="lead-when">
                  <span className="lead-field-label">
                    Follow up
                    <span className="sr-only"> date for {lead.company}</span>
                  </span>
                  <input
                    type="date"
                    value={lead.followUpAt || ''}
                    disabled={busyId === lead.id}
                    onChange={(event) =>
                      void save(lead, {
                        followUpAt: event.target.value || null,
                      })
                    }
                  />
                </label>
                <span className="lead-state" aria-live="polite">
                  {busyId === lead.id && (
                    <Loader2 size={14} className="icon-spin" />
                  )}
                  {savedId === lead.id && <Check size={14} />}
                  {failedId === lead.id && <em>Not saved</em>}
                </span>
              </div>
              <details className="lead-more">
                <summary>History and record options</summary>
                <AdminLeadHistory leadId={lead.id} today={today} />
                {/* Two different acts, kept visibly apart. Erasing is what we do
                  when a person asks, and the privacy notice promises it.
                  Removing is for a test row or a duplicate and destroys the
                  record. A single "delete" would have quietly made one of those
                  do the other's job. */}
                <div className="lead-destructive">
                  <ConfirmAction
                    className="lead-erase"
                    label="Erase their details"
                    confirmLabel="Erase"
                    pendingLabel="Erasing"
                    title="Remove name, email and conversation history. Keeps that this company enquired."
                    pending={erasingId === lead.id}
                    disabled={erasingId !== null}
                    onConfirm={() => void destroy(lead, 'erase')}
                  />
                  <ConfirmAction
                    className="lead-remove"
                    label="Delete the record"
                    confirmLabel="Delete"
                    pendingLabel="Deleting"
                    title="Remove the row entirely. For test rows and duplicates."
                    pending={erasingId === lead.id}
                    disabled={erasingId !== null}
                    onConfirm={() => void destroy(lead, 'remove')}
                  />
                  {destroyNote?.id === lead.id && (
                    <StatusNote tone={destroyNote.failed ? 'error' : 'done'}>
                      {destroyNote.message}
                    </StatusNote>
                  )}
                </div>
              </details>
            </article>
          );
        })}
      </div>
    </>
  );
}
