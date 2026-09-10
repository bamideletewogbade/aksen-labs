export type Urgency = 'overdue' | 'today' | 'later' | 'none';
export type Sortable = { status: string; followUpAt: string | null };

/** A won or lost lead is never chasing you, whatever its date says. */
export function urgency(lead: Sortable, today: string): Urgency {
  if (lead.status === 'won' || lead.status === 'lost') return 'none';
  if (!lead.followUpAt) return 'none';
  if (lead.followUpAt < today) return 'overdue';
  if (lead.followUpAt === today) return 'today';
  return 'later';
}

// Undated open leads sit above closed ones: they are the ones that quietly go cold.
function rank(lead: Sortable, today: string): number {
  const state = urgency(lead, today);
  if (state === 'overdue') return 0;
  if (state === 'today') return 1;
  if (state === 'later') return 2;
  return lead.status === 'won' || lead.status === 'lost' ? 4 : 3;
}

export function byUrgency<T extends Sortable>(leads: T[], today: string): T[] {
  return [...leads].sort((a, b) => {
    const difference = rank(a, today) - rank(b, today);
    if (difference !== 0) return difference;
    // Within a dated group, the one waiting longest goes first.
    if (a.followUpAt && b.followUpAt) return a.followUpAt.localeCompare(b.followUpAt);
    return 0;
  });
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
