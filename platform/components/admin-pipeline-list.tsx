'use client';

import Link from 'next/link';
import {
  Check,
  ChevronDown,
  FolderOpen,
  Loader2,
  Mail,
  MoreHorizontal,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { urgency } from '@/lib/pipeline-order';
import { companyName } from '@/lib/company-name';
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
const OPEN_STAGES = ['new', 'qualified', 'proposal'];
const STAGE_LABEL: Record<string, string> = {
  new: 'New',
  qualified: 'Qualified',
  proposal: 'Proposal out',
  won: 'Won',
  lost: 'Lost',
};
// The date only earns a badge when it is asking for something today.
const DUE_LABEL: Record<string, string> = {
  overdue: 'Overdue',
  today: 'Due today',
};

// One Draft menu instead of three buttons on every row. The old buttons were
// "Prepare draft", "Gap audit" and "Jev follow-up", which all opened the same
// drafting page with a different task, and the first did not say which task
// it was (qualify). These are the lead tasks in lib/operations-catalog.ts,
// named as that page names them, with the one that fits the stage first.
const DRAFT_TASKS = [
  { id: 'qualify', label: 'Qualify the enquiry' },
  { id: 'lead_audit', label: 'Enquiry gap audit' },
  { id: 'discovery', label: 'Prepare discovery' },
  { id: 'proposal', label: 'Draft a proposal' },
  { id: 'followup', label: 'Follow-up email' },
  { id: 'jev_followup', label: 'Follow-up, three angles' },
];
const SUGGESTED_TASK: Record<string, string> = {
  new: 'qualify',
  qualified: 'discovery',
  proposal: 'followup',
};

// Stages and dates are one set of filters. The overdue, due-today and undated
// counts used to sit under the list as badges that looked clickable and were
// not, while four separate lines repeated the total.
type Filter =
  | 'all'
  | 'new'
  | 'qualified'
  | 'proposal'
  | 'overdue'
  | 'today'
  | 'undated';

const isOpen = (lead: Lead) => OPEN_STAGES.includes(lead.status);

function leadTitle(lead: Lead) {
  return companyName(lead.company) || lead.name || 'Unnamed enquiry';
}

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
  const [filter, setFilter] = useState<Filter>('all');
  const [leads, setLeads] = useState(initialLeads);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [failedId, setFailedId] = useState<string | null>(null);
  const [erasingId, setErasingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [closedOpen, setClosedOpen] = useState(false);
  const [destroyNote, setDestroyNote] = useState<{
    id: string;
    failed: boolean;
    message: string;
  } | null>(null);

  // The Draft menu closes on a click anywhere else or on Escape, like any
  // menu. Focus goes back to its button on Escape so a keyboard user is not
  // left at the top of the page.
  useEffect(() => {
    if (!menuId) return;
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!target?.closest(`[data-menu="${menuId}"]`)) setMenuId(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      document
        .querySelector<HTMLButtonElement>(`[data-menu="${menuId}"] > button`)
        ?.focus();
      setMenuId(null);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuId]);

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
        setExpandedId(null);
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

  const needle = query.trim().toLowerCase();
  const matchesQuery = (lead: Lead) =>
    !needle ||
    [lead.company, lead.name, lead.email, lead.recommendation, lead.nextAction]
      .join(' ')
      .toLowerCase()
      .includes(needle);

  const openLeads = leads.filter(isOpen);
  const closedLeads = leads.filter((lead) => !isOpen(lead));
  const count = (test: (lead: Lead) => boolean) =>
    openLeads.filter(test).length;
  const filterTest: Record<Filter, (lead: Lead) => boolean> = {
    all: () => true,
    new: (lead) => lead.status === 'new',
    qualified: (lead) => lead.status === 'qualified',
    proposal: (lead) => lead.status === 'proposal',
    overdue: (lead) => urgency(lead, today) === 'overdue',
    today: (lead) => urgency(lead, today) === 'today',
    undated: (lead) => !lead.followUpAt,
  };
  const stageChips: [Filter, string][] = [
    ['all', 'All open'],
    ['new', 'New'],
    ['qualified', 'Qualified'],
    ['proposal', 'Proposal out'],
  ];
  const attentionChips: [Filter, string][] = [
    ['overdue', 'Overdue'],
    ['today', 'Due today'],
    ['undated', 'No date'],
  ];

  const visibleOpen = openLeads.filter(
    (lead) => filterTest[filter](lead) && matchesQuery(lead),
  );
  // Closed leads are reference, so they only appear under the unfiltered view.
  // A search that finds one opens the section, or the match would be hidden.
  const visibleClosed =
    filter === 'all' ? closedLeads.filter(matchesQuery) : [];
  const showClosed = closedOpen || (needle !== '' && visibleClosed.length > 0);
  const won = closedLeads.filter((lead) => lead.status === 'won').length;
  const lost = closedLeads.length - won;

  function chip([id, label]: [Filter, string], tone?: string) {
    const n = count(filterTest[id]);
    const pressed = filter === id;
    return (
      <button
        key={id}
        type="button"
        aria-pressed={pressed}
        disabled={!pressed && id !== 'all' && n === 0}
        className="pl-chip"
        data-tone={tone}
        onClick={() => setFilter(pressed && id !== 'all' ? 'all' : id)}
      >
        {label}
        <span>{n}</span>
      </button>
    );
  }

  function row(lead: Lead) {
    const due = urgency(lead, today);
    const open = isOpen(lead);
    const title = leadTitle(lead);
    const company = companyName(lead.company);
    const expanded = expandedId === lead.id;
    const busy = busyId === lead.id;
    const suggested = SUGGESTED_TASK[lead.status];
    const tasks = [
      ...DRAFT_TASKS.filter((task) => task.id === suggested),
      ...DRAFT_TASKS.filter((task) => task.id !== suggested),
    ];
    return (
      <li
        key={lead.id}
        className={`pl-row${open ? '' : ' is-closed'}${expanded ? ' is-expanded' : ''}`}
        data-due={due}
      >
        <div className="pl-who">
          <div className="pl-title">
            <strong title={title}>{title}</strong>
            {DUE_LABEL[due] && (
              <span className="pl-due" data-due={due}>
                {DUE_LABEL[due]}
              </span>
            )}
          </div>
          <div className="pl-sub">
            <span>{company ? lead.name : 'No company given'}</span>
            {lead.email && (
              <a href={`mailto:${lead.email}`} title={`Email ${lead.email}`}>
                <Mail size={12} aria-hidden="true" />
                {lead.email}
              </a>
            )}
          </div>
        </div>

        {/* Visible captions live in the column header; these keep each control's
            accessible name unique across every row. */}
        <label className="pl-stage" data-stage={lead.status}>
          <span className="sr-only">Stage for {title}</span>
          <select
            value={lead.status}
            disabled={busy}
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

        <label className="pl-next">
          <span className="sr-only">Next action for {title}</span>
          <input
            key={lead.nextAction}
            defaultValue={lead.nextAction || ''}
            placeholder="What happens next?"
            disabled={busy}
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

        {/* A closed lead is not being chased, so it has no date to set. */}
        {open ? (
          <label className="pl-when">
            <span className="sr-only">Follow-up date for {title}</span>
            <input
              type="date"
              value={lead.followUpAt || ''}
              disabled={busy}
              onChange={(event) =>
                void save(lead, { followUpAt: event.target.value || null })
              }
            />
          </label>
        ) : (
          <span className="pl-when is-empty" aria-hidden="true" />
        )}

        <div className="pl-actions">
          <span className="pl-state" aria-live="polite">
            {busy && <Loader2 size={14} className="icon-spin" />}
            {savedId === lead.id && (
              <>
                <Check size={14} />
                <span className="sr-only">Saved</span>
              </>
            )}
            {failedId === lead.id && <em>Not saved</em>}
          </span>
          {open && (
            <div className="pl-menu" data-menu={lead.id}>
              <button
                type="button"
                className="pl-draft"
                aria-expanded={menuId === lead.id}
                aria-controls={`pl-draft-${lead.id}`}
                onClick={() => setMenuId(menuId === lead.id ? null : lead.id)}
              >
                Draft <ChevronDown size={14} aria-hidden="true" />
                <span className="sr-only"> for {title}</span>
              </button>
              {menuId === lead.id && (
                <ul id={`pl-draft-${lead.id}`} className="pl-menu-list">
                  {tasks.map((task) => (
                    <li key={task.id}>
                      <Link
                        href={`/admin/operations?lead=${encodeURIComponent(lead.id)}&task=${task.id}`}
                        onClick={() => setMenuId(null)}
                      >
                        {task.label}
                        {task.id === suggested && <small>Suggested</small>}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {lead.status === 'won' && (
            <button
              type="button"
              className="pl-project"
              disabled={busy}
              onClick={() => void startProject(lead)}
            >
              <FolderOpen size={14} aria-hidden="true" /> Open project
            </button>
          )}
          <button
            type="button"
            className="pl-more"
            aria-expanded={expanded}
            aria-controls={`pl-detail-${lead.id}`}
            title="Details, history and record options"
            onClick={() => setExpandedId(expanded ? null : lead.id)}
          >
            <MoreHorizontal size={16} aria-hidden="true" />
            <span className="sr-only">Details and history for {title}</span>
          </button>
        </div>

        {expanded && (
          <div className="pl-detail" id={`pl-detail-${lead.id}`}>
            {(lead.recommendation || lead.desiredOutcome) && (
              <dl className="pl-facts">
                {lead.recommendation && (
                  <div>
                    <dt>Recommended first step</dt>
                    <dd>{lead.recommendation}</dd>
                  </div>
                )}
                {lead.desiredOutcome && (
                  <div>
                    <dt>What they want</dt>
                    <dd>{lead.desiredOutcome}</dd>
                  </div>
                )}
              </dl>
            )}
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
          </div>
        )}
      </li>
    );
  }

  return (
    <div className="pl">
      <div className="pl-toolbar">
        <label className="pl-search">
          <span className="sr-only">Search enquiries</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by company, name or email"
          />
        </label>
        <fieldset className="pl-chips">
          <legend className="sr-only">Show</legend>
          {stageChips.map((item) => chip(item))}
          <span className="pl-chip-divider" aria-hidden="true" />
          {chip(attentionChips[0], 'overdue')}
          {chip(attentionChips[1], 'today')}
          {chip(attentionChips[2])}
        </fieldset>
      </div>
      <p className="sr-only" aria-live="polite">
        {visibleOpen.length} open{' '}
        {visibleOpen.length === 1 ? 'enquiry' : 'enquiries'} shown
      </p>

      {visibleOpen.length > 0 ? (
        <>
          <div className="pl-head" aria-hidden="true">
            <span>Lead</span>
            <span>Stage</span>
            <span>Next action</span>
            <span>Follow up</span>
            <span />
          </div>
          <ul className="pl-list">{visibleOpen.map(row)}</ul>
        </>
      ) : (
        <div className="empty-admin">
          <strong>
            {openLeads.length
              ? 'No open enquiries match.'
              : 'No open enquiries. Everything is won or lost.'}
          </strong>
          {(needle || filter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setFilter('all');
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Won and lost leads used to sit among the live ones with the same
          controls, so the list never got shorter as deals closed. */}
      {visibleClosed.length > 0 && (
        <details
          className="pl-closed"
          open={showClosed}
          onToggle={(event) => setClosedOpen(event.currentTarget.open)}
        >
          <summary>
            Closed
            <span>
              {won} won · {lost} lost
            </span>
          </summary>
          <ul className="pl-list">{visibleClosed.map(row)}</ul>
        </details>
      )}
    </div>
  );
}
