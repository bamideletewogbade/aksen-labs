'use client';
import Link from 'next/link';

import { Check, Loader2, Receipt } from 'lucide-react';
import { useState } from 'react';
import {
  BILLING_LABEL,
  PROJECT_STAGES,
  STAGE_LABEL,
  needsInvoicing,
  type Billing,
} from '@/lib/project-stages';
import { AdminProjectItems } from '@/components/admin-project-items';

export type Project = {
  id: string;
  name: string;
  clientName: string;
  stage: string;
  health: string;
  progress: number;
  nextGate: string;
  billing: Billing;
};

export function AdminProjectList({
  initialProjects,
}: {
  initialProjects: Project[];
}) {
  const [query, setQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [items, setItems] = useState(initialProjects);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [failedId, setFailedId] = useState<string | null>(null);

  async function save(
    project: Project,
    patch: Partial<Pick<Project, 'stage' | 'nextGate'>>,
  ) {
    const before = project;
    setBusyId(project.id);
    setFailedId(null);
    setItems((current) =>
      current.map((item) =>
        item.id === project.id ? { ...item, ...patch } : item,
      ),
    );
    try {
      const response = await fetch(`/api/admin/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!response.ok) throw new Error('save failed');
      setSavedId(project.id);
      setTimeout(
        () =>
          setSavedId((current) => (current === project.id ? null : current)),
        1800,
      );
    } catch {
      setItems((current) =>
        current.map((item) => (item.id === project.id ? before : item)),
      );
      setFailedId(project.id);
    } finally {
      setBusyId(null);
    }
  }

  const unbilled = items.filter((project) =>
    needsInvoicing(project.stage, project.billing),
  ).length;

  const visible = items.filter(
    (project) =>
      (stageFilter === 'all' || project.stage === stageFilter) &&
      [project.name, project.clientName, project.nextGate]
        .join(' ')
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );

  return (
    <>
      <div className="admin-record-toolbar">
        <label>
          Search projects
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search the loaded records"
          />
        </label>
        <label>
          Stage
          <select
            value={stageFilter}
            onChange={(event) => setStageFilter(event.target.value)}
          >
            <option value="all">All stages</option>
            {PROJECT_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {STAGE_LABEL[stage]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <output className="admin-filter-count">
        {visible.length} matching projects
      </output>
      {visible.length === 0 && (
        <div className="empty-admin">
          <strong>No matching projects.</strong>
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
        {items.length} project{items.length === 1 ? '' : 's'}
        {unbilled > 0 && (
          <b className="tag-overdue">{unbilled} accepted, not invoiced</b>
        )}
      </p>
      <div className="project-list">
        {visible.map((project) => (
          <article
            key={project.id}
            className={
              needsInvoicing(project.stage, project.billing)
                ? 'needs-invoice'
                : ''
            }
          >
            <header>
              <div>
                <strong>{project.name}</strong>
                <span>{project.clientName}</span>
              </div>
              <b className={`health-${project.health}`}>
                {String(project.health).replace('_', ' ')}
              </b>
            </header>
            <div className="project-progress">
              <i style={{ width: `${project.progress}%` }} />
            </div>
            <div className="project-controls">
              <label>
                <span className="sr-only">Stage for {project.name}</span>
                <select
                  value={project.stage}
                  disabled={busyId === project.id}
                  onChange={(event) =>
                    void save(project, { stage: event.target.value })
                  }
                >
                  {PROJECT_STAGES.map((stage) => (
                    <option key={stage} value={stage}>
                      {STAGE_LABEL[stage]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="project-gate">
                <span className="sr-only">Next gate for {project.name}</span>
                <input
                  key={project.nextGate}
                  defaultValue={project.nextGate || ''}
                  placeholder="What has to happen next?"
                  disabled={busyId === project.id}
                  onBlur={(event) => {
                    const value = event.target.value.trim();
                    if (!value || value === project.nextGate) {
                      event.target.value = project.nextGate || '';
                      return;
                    }
                    void save(project, { nextGate: value });
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') event.currentTarget.blur();
                  }}
                />
              </label>
              <span className="lead-state" aria-live="polite">
                {busyId === project.id && (
                  <Loader2 size={14} className="icon-spin" />
                )}
                {savedId === project.id && <Check size={14} />}
                {failedId === project.id && <em>Not saved</em>}
              </span>
            </div>
            <AdminProjectItems projectId={project.id} />
            <footer>
              <span className={`billing-${project.billing}`}>
                <Receipt size={13} /> {BILLING_LABEL[project.billing]}
              </span>
              {needsInvoicing(project.stage, project.billing) ? (
                <Link
                  prefetch={false}
                  className="invoice-prompt"
                  href="/admin/workspaces"
                >
                  Raise an invoice →
                </Link>
              ) : (
                <small>{project.progress}% complete</small>
              )}
            </footer>
          </article>
        ))}
      </div>
    </>
  );
}
