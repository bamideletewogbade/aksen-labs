'use client';

import { Check, Loader2, Mail } from 'lucide-react';
import { useState } from 'react';
import { urgency } from '@/lib/pipeline-order';

export type Lead = {
  id: string; company: string; name: string; email: string; recommendation: string;
  status: string; desiredOutcome: string; nextAction: string; followUpAt: string | null;
};

const STAGES = ['new', 'qualified', 'proposal', 'won', 'lost'];
const STAGE_LABEL: Record<string, string> = {
  new: 'New', qualified: 'Qualified', proposal: 'Proposal out', won: 'Won', lost: 'Lost',
};


export function AdminPipelineList({ initialLeads, today }: { initialLeads: Lead[]; today: string }) {
  const [leads, setLeads] = useState(initialLeads);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [failedId, setFailedId] = useState<string | null>(null);

  async function save(lead: Lead, patch: Partial<Pick<Lead, 'status' | 'nextAction' | 'followUpAt'>>) {
    const before = lead;
    setBusyId(lead.id); setFailedId(null);
    setLeads((current) => current.map((item) => item.id === lead.id ? { ...item, ...patch } : item));
    try {
      const response = await fetch(`/api/admin/opportunities/${lead.id}`, {
        method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(patch),
      });
      if (!response.ok) throw new Error('save failed');
      setSavedId(lead.id);
      setTimeout(() => setSavedId((current) => current === lead.id ? null : current), 1800);
    } catch {
      setLeads((current) => current.map((item) => item.id === lead.id ? before : item));
      setFailedId(lead.id);
    } finally {
      setBusyId(null);
    }
  }

  const open = leads.filter((lead) => lead.status !== 'won' && lead.status !== 'lost').length;
  const overdue = leads.filter((lead) => urgency(lead, today) === 'overdue').length;
  const dueToday = leads.filter((lead) => urgency(lead, today) === 'today').length;
  const unscheduled = leads.filter((lead) => lead.status !== 'won' && lead.status !== 'lost' && !lead.followUpAt).length;

  return (
    <>
      <p className="content-count">
        {open} still open of {leads.length}
        {overdue > 0 && <b className="tag-overdue">{overdue} overdue</b>}
        {dueToday > 0 && <b className="tag-today">{dueToday} due today</b>}
        {unscheduled > 0 && <b className="tag-unset">{unscheduled} with no date</b>}
      </p>
      <div className="pipeline-list">
        {leads.map((lead) => (
          <article key={lead.id} className={`lead-row stage-${lead.status} due-${urgency(lead, today)}`}>
            <div className="company-mark">{lead.company.slice(0, 1)}</div>
            <div className="lead-who">
              <strong>{lead.company}</strong>
              <span>{lead.name} · {lead.recommendation}</span>
              <a className="lead-mail" href={`mailto:${lead.email}`}><Mail size={13} /> {lead.email}</a>
            </div>
            <div className="lead-controls">
              <label className="lead-stage">
                <span className="sr-only">Stage for {lead.company}</span>
                <select value={lead.status} disabled={busyId === lead.id} onChange={(event) => save(lead, { status: event.target.value })}>
                  {STAGES.map((stage) => <option key={stage} value={stage}>{STAGE_LABEL[stage]}</option>)}
                </select>
              </label>
              <label className="lead-next">
                <span className="sr-only">Next action for {lead.company}</span>
                <input
                  defaultValue={lead.nextAction || ''}
                  placeholder="What happens next?"
                  disabled={busyId === lead.id}
                  onBlur={(event) => {
                    const value = event.target.value.trim();
                    if (!value || value === lead.nextAction) { event.target.value = lead.nextAction || ''; return; }
                    save(lead, { nextAction: value });
                  }}
                  onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }}
                />
              </label>
              <label className="lead-when">
                <span className="sr-only">Follow up date for {lead.company}</span>
                <input
                  type="date"
                  value={lead.followUpAt || ''}
                  disabled={busyId === lead.id}
                  onChange={(event) => save(lead, { followUpAt: event.target.value || null })}
                />
              </label>
              <span className="lead-state" aria-live="polite">
                {busyId === lead.id && <Loader2 size={14} className="icon-spin" />}
                {savedId === lead.id && <Check size={14} />}
                {failedId === lead.id && <em>Not saved</em>}
              </span>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
