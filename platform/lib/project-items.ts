export const ITEM_KINDS = ['task', 'deliverable', 'decision', 'risk'] as const;
export type ItemKind = (typeof ITEM_KINDS)[number];

export const ITEM_STATUSES = ['open', 'done', 'blocked'] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

export const KIND_LABEL: Record<ItemKind, string> = {
  task: 'Task',
  deliverable: 'Deliverable',
  decision: 'Decision',
  risk: 'Risk',
};

export const STATUS_LABEL: Record<ItemStatus, string> = {
  open: 'Open',
  done: 'Done',
  blocked: 'Blocked',
};

export type ProjectItem = {
  id: string;
  kind: string;
  title: string;
  description: string | null;
  status: string;
  dueAt: string | null;
  evidence: string | null;
};

export function isKind(value: unknown): value is ItemKind {
  return typeof value === 'string' && ITEM_KINDS.includes(value as ItemKind);
}
export function isStatus(value: unknown): value is ItemStatus {
  return (
    typeof value === 'string' && ITEM_STATUSES.includes(value as ItemStatus)
  );
}

/**
 * A deliverable marked done with nothing to show for it is the delivery
 * equivalent of accepted work nobody invoiced: the claim exists and the proof
 * does not. Surfaced so it can be answered before a client asks.
 */
export function needsEvidence(item: ProjectItem): boolean {
  return (
    item.kind === 'deliverable' &&
    item.status === 'done' &&
    !item.evidence?.trim()
  );
}

export function itemSummary(items: ProjectItem[]) {
  return {
    open: items.filter((i) => i.status === 'open').length,
    blocked: items.filter((i) => i.status === 'blocked').length,
    unevidenced: items.filter(needsEvidence).length,
  };
}
