'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { LeadExportMenu } from '@/components/lead-export-menu';
import {
  CONTACT_FILTERS,
  CONTACT_LABEL,
  EMPTY_FILTER,
  LEAD_STATUSES,
  STATUS_LABEL,
  filterIsActive,
  runsPresent,
  statusCounts,
  type ContactFilter,
  type LeadFilter,
  type LeadStatus,
  type StoredLead,
} from '@/lib/lead-filters';

/**
 * The controls over the saved lead queue.
 *
 * Unattended searches mean leads arrive while nobody is looking, so the
 * question this has to answer is not "what did I just find" but "what of what
 * I have is worth my next hour". That is why status and count sit in the open
 * and the rest folds away: a screen of controls you never touch costs attention
 * on every visit, while a fold costs one click on the visits you need it.
 *
 * All rules live in lib/lead-filters so the counts on the chips come from the
 * same function that decides the rows. A chip that promises four and shows
 * three is worse than no chip.
 */

const AGES = [
  { days: 1, label: 'Today' },
  { days: 7, label: 'This week' },
  { days: 30, label: 'This month' },
];

function shortRun(runId: string) {
  return runId.slice(0, 8);
}

export function LeadFilterBar({
  leads,
  filter,
  onChange,
  shown,
}: {
  leads: StoredLead[];
  filter: LeadFilter;
  onChange: (filter: LeadFilter) => void;
  shown: number;
}) {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  // Typing should filter as you type without a round trip, but the count
  // changing under the cursor is distracting, so the number gets a short
  // highlight instead of moving anything.
  const [flash, setFlash] = useState(false);
  const firstRender = useRef(true);
  const counts = statusCounts(leads);
  const runs = runsPresent(leads);
  const active = filterIsActive(filter);
  const set = (patch: Partial<LeadFilter>) => onChange({ ...filter, ...patch });

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setFlash(true);
    const timer = setTimeout(() => setFlash(false), 420);
    return () => clearTimeout(timer);
  }, [shown]);

  // Only offer a facet that can change the result. A run picker listing one
  // run, or an evidence slider on leads that all cite two sources, is a
  // control that exists to look thorough.
  const offerRuns = runs.length > 1;

  const chips: { key: 'all' | LeadStatus; label: string; count: number }[] = [
    { key: 'all', label: 'Everything', count: counts.all },
    ...LEAD_STATUSES.map((status) => ({
      key: status,
      label: STATUS_LABEL[status],
      count: counts[status] ?? 0,
    })),
  ];

  const pills: { label: string; clear: Partial<LeadFilter> }[] = [];
  if (filter.contact !== 'any')
    pills.push({
      label: CONTACT_LABEL[filter.contact],
      clear: { contact: 'any' },
    });
  if (filter.minSources > 0)
    pills.push({
      label: `${filter.minSources}+ sources`,
      clear: { minSources: 0 },
    });
  if (filter.withinDays > 0)
    pills.push({
      label:
        AGES.find((age) => age.days === filter.withinDays)?.label ??
        `Last ${filter.withinDays} days`,
      clear: { withinDays: 0 },
    });
  if (filter.runId !== 'all')
    pills.push({
      label: `Run ${shortRun(filter.runId)}`,
      clear: { runId: 'all' },
    });

  return (
    <div className="lead-filters">
      <div className="lead-filters-top">
        <div className="lead-search">
          <input
            type="search"
            className="scout-query"
            value={filter.text}
            placeholder="Company, town, website or contact"
            aria-label="Search saved leads"
            onChange={(event) => set({ text: event.target.value })}
          />
          {filter.text && (
            <button
              type="button"
              className="lead-search-clear"
              onClick={() => set({ text: '' })}
              aria-label="Clear the search text"
            >
              ×
            </button>
          )}
        </div>
        <button
          type="button"
          className={'lead-more' + (pills.length ? ' has-filters' : '')}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen(!open)}
        >
          Refine
          {pills.length > 0 && <b>{pills.length}</b>}
          <span aria-hidden="true" className={open ? 'is-open' : ''}>
            ▾
          </span>
        </button>
      </div>

      <fieldset className="lead-chips">
        <legend className="scout-visually-hidden">
          Filter by review status
        </legend>
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            className="lead-chip"
            aria-pressed={filter.status === chip.key}
            // A status holding nothing is still worth showing, because an empty
            // shortlist is information. It is only dimmed, never hidden, so the
            // set of chips does not move around between visits.
            data-empty={chip.count === 0 ? 'true' : undefined}
            onClick={() => set({ status: chip.key })}
          >
            {chip.label}
            <span>{chip.count}</span>
          </button>
        ))}
      </fieldset>

      <div className={'lead-panel' + (open ? ' is-open' : '')} id={panelId}>
        <div className="lead-panel-inner">
          <fieldset>
            <legend>How you can reach them</legend>
            <div className="lead-options">
              {CONTACT_FILTERS.map((option: ContactFilter) => (
                <button
                  key={option}
                  type="button"
                  className="lead-option"
                  aria-pressed={filter.contact === option}
                  onClick={() => set({ contact: option })}
                >
                  {CONTACT_LABEL[option]}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>Evidence behind the record</legend>
            <div className="lead-options">
              {[0, 2, 3, 5].map((count) => (
                <button
                  key={count}
                  type="button"
                  className="lead-option"
                  aria-pressed={filter.minSources === count}
                  onClick={() => set({ minSources: count })}
                >
                  {count === 0 ? 'Any' : `${count}+ sources`}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>When it was found</legend>
            <div className="lead-options">
              <button
                type="button"
                className="lead-option"
                aria-pressed={filter.withinDays === 0}
                onClick={() => set({ withinDays: 0 })}
              >
                Any time
              </button>
              {AGES.map((age) => (
                <button
                  key={age.days}
                  type="button"
                  className="lead-option"
                  aria-pressed={filter.withinDays === age.days}
                  onClick={() => set({ withinDays: age.days })}
                >
                  {age.label}
                </button>
              ))}
            </div>
          </fieldset>

          {offerRuns && (
            <fieldset>
              <legend>From one search</legend>
              <div className="lead-options">
                <button
                  type="button"
                  className="lead-option"
                  aria-pressed={filter.runId === 'all'}
                  onClick={() => set({ runId: 'all' })}
                >
                  Every search
                </button>
                {runs.slice(0, 6).map((run) => (
                  <button
                    key={run.runId}
                    type="button"
                    className="lead-option"
                    aria-pressed={filter.runId === run.runId}
                    onClick={() => set({ runId: run.runId })}
                  >
                    {run.when
                      ? new Date(run.when).toLocaleDateString(undefined, {
                          day: 'numeric',
                          month: 'short',
                        })
                      : shortRun(run.runId)}
                    <span> · {run.count}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          )}
        </div>
      </div>

      <div className="lead-filters-foot">
        <p
          className={'lead-count' + (flash ? ' is-changed' : '')}
          aria-live="polite"
        >
          {shown === leads.length
            ? `${leads.length} saved ${leads.length === 1 ? 'lead' : 'leads'}`
            : `${shown} of ${leads.length} leads`}
        </p>
        {pills.map((pill) => (
          <button
            key={pill.label}
            type="button"
            className="lead-pill"
            onClick={() => set(pill.clear)}
          >
            {pill.label} <span aria-hidden="true">×</span>
            <span className="scout-visually-hidden">, remove this filter</span>
          </button>
        ))}
        {active && (
          <button
            type="button"
            className="lead-reset"
            onClick={() => onChange(EMPTY_FILTER)}
          >
            Clear all
          </button>
        )}
        {/* Beside the count, because what you can export is what the count
            says, and the two should never be read separately. */}
        <LeadExportMenu filter={filter} shown={shown} />
      </div>
    </div>
  );
}
