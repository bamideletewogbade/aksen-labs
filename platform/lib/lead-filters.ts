import type { Prospect } from './prospect-evidence';

/**
 * Filtering found leads.
 *
 * Pure functions over a list, so the rules can be tested without a browser and
 * the same definition of "reachable" is used by the filter and by the counts
 * beside it. A facet whose count disagrees with what it shows is worse than no
 * count at all.
 *
 * The facets are chosen from what the data actually carries and from what
 * decides whether a lead is worth a person's time: can I contact them, is the
 * evidence real, when was this found, and have I already dealt with it.
 */

export type StoredLead = {
  id: string;
  company: string;
  website: string;
  domain: string;
  status: string;
  run_id?: string | null;
  created_at?: string;
  updated_at?: string;
  data: Prospect;
  opportunity_id: string | null;
};

export const LEAD_STATUSES = [
  'new',
  'shortlisted',
  'promoted',
  'dismissed',
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const STATUS_LABEL: Record<string, string> = {
  new: 'Not reviewed',
  shortlisted: 'Shortlisted',
  promoted: 'In the pipeline',
  dismissed: 'Dismissed',
};

export const CONTACT_FILTERS = ['any', 'email', 'phone', 'none'] as const;
export type ContactFilter = (typeof CONTACT_FILTERS)[number];

export const CONTACT_LABEL: Record<ContactFilter, string> = {
  any: 'Any contact',
  email: 'Has an email',
  phone: 'Has a phone number',
  none: 'No way to reach them',
};

export type LeadFilter = {
  status: 'all' | LeadStatus;
  contact: ContactFilter;
  /** Minimum number of cited sources. Evidence, not opinion. */
  minSources: number;
  /** Only leads found within this many days. 0 means any age. */
  withinDays: number;
  /** A run id, or the literal 'all' for every run. */
  runId: string;
  text: string;
};

export const EMPTY_FILTER: LeadFilter = {
  status: 'all',
  contact: 'any',
  minSources: 0,
  withinDays: 0,
  runId: 'all',
  text: '',
};

function contacts(lead: StoredLead) {
  return Array.isArray(lead.data?.contacts) ? lead.data.contacts : [];
}

export function hasContactKind(lead: StoredLead, kind: string): boolean {
  return contacts(lead).some((contact) => contact?.kind === kind);
}

export function reachable(lead: StoredLead): boolean {
  return contacts(lead).length > 0;
}

export function sourceCount(lead: StoredLead): number {
  return Array.isArray(lead.data?.sources) ? lead.data.sources.length : 0;
}

function ageInDays(lead: StoredLead, now: number): number {
  const stamp = lead.created_at || lead.updated_at;
  if (!stamp) return Number.POSITIVE_INFINITY;
  const time = new Date(stamp).getTime();
  if (!Number.isFinite(time)) return Number.POSITIVE_INFINITY;
  return (now - time) / 86_400_000;
}

/** Everything searchable about a lead, flattened once per call rather than per term. */
function haystack(lead: StoredLead): string {
  const data = lead.data || ({} as Prospect);
  return [
    lead.company,
    lead.website,
    lead.domain,
    data.description,
    data.opportunity,
    ...contacts(lead).map((contact) => contact?.value),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function matchesFilter(
  lead: StoredLead,
  filter: LeadFilter,
  now = Date.now(),
): boolean {
  if (filter.status !== 'all' && lead.status !== filter.status) return false;

  if (filter.contact === 'email' && !hasContactKind(lead, 'email'))
    return false;
  if (filter.contact === 'phone' && !hasContactKind(lead, 'phone'))
    return false;
  if (filter.contact === 'none' && reachable(lead)) return false;

  if (filter.minSources > 0 && sourceCount(lead) < filter.minSources)
    return false;

  if (filter.withinDays > 0 && ageInDays(lead, now) > filter.withinDays)
    return false;

  if (filter.runId !== 'all' && (lead.run_id ?? '') !== filter.runId)
    return false;

  const text = filter.text.trim().toLowerCase();
  // Every word must appear somewhere, so adding a term narrows rather than
  // widens. A search that returns more as you type more is not a search.
  if (text) {
    const found = haystack(lead);
    return text.split(/\s+/).every((term) => found.includes(term));
  }
  return true;
}

export function filterLeads(
  leads: StoredLead[],
  filter: LeadFilter,
  now = Date.now(),
): StoredLead[] {
  return leads.filter((lead) => matchesFilter(lead, filter, now));
}

/**
 * How many leads each status holds, counted from the same list the filter runs
 * over, so a chip never promises rows the list cannot show.
 */
export function statusCounts(leads: StoredLead[]): Record<string, number> {
  const counts: Record<string, number> = { all: leads.length };
  for (const status of LEAD_STATUSES) counts[status] = 0;
  for (const lead of leads)
    counts[lead.status] = (counts[lead.status] ?? 0) + 1;
  return counts;
}

/** Distinct runs present in a list, newest first, for the run picker. */
export function runsPresent(
  leads: StoredLead[],
): { runId: string; count: number; when: string | null }[] {
  const byRun = new Map<string, { count: number; when: string | null }>();
  for (const lead of leads) {
    const runId = lead.run_id;
    if (!runId) continue;
    const current = byRun.get(runId);
    const when = lead.created_at ?? null;
    if (current) {
      current.count += 1;
      if (when && (!current.when || when > current.when)) current.when = when;
    } else {
      byRun.set(runId, { count: 1, when });
    }
  }
  return [...byRun.entries()]
    .map(([runId, value]) => ({ runId, ...value }))
    .sort((a, b) => (b.when ?? '').localeCompare(a.when ?? ''));
}

export function filterIsActive(filter: LeadFilter): boolean {
  return (
    filter.status !== 'all' ||
    filter.contact !== 'any' ||
    filter.minSources > 0 ||
    filter.withinDays > 0 ||
    filter.runId !== 'all' ||
    filter.text.trim() !== ''
  );
}
