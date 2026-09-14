export const INTERACTION_CHANNELS = [
  'whatsapp',
  'call',
  'email',
  'meeting',
  'other',
] as const;
export type InteractionChannel = (typeof INTERACTION_CHANNELS)[number];

export const CHANNEL_LABEL: Record<InteractionChannel, string> = {
  whatsapp: 'WhatsApp',
  call: 'Call',
  email: 'Email',
  meeting: 'Meeting',
  other: 'Other',
};

export const DIRECTIONS = ['outbound', 'inbound'] as const;
export type Direction = (typeof DIRECTIONS)[number];
export const DIRECTION_LABEL: Record<Direction, string> = {
  outbound: 'We contacted them',
  inbound: 'They contacted us',
};

export type LeadInteraction = {
  id: string;
  occurredAt: string;
  channel: string;
  direction: string;
  summary: string;
  shared: string | null;
};

export function isChannel(value: unknown): value is InteractionChannel {
  return (
    typeof value === 'string' &&
    INTERACTION_CHANNELS.includes(value as InteractionChannel)
  );
}
export function isDirection(value: unknown): value is Direction {
  return typeof value === 'string' && DIRECTIONS.includes(value as Direction);
}

/**
 * Days since anyone last spoke to this lead. A pipeline stage says where a deal
 * is; this says whether it is actually moving. Null when nothing is recorded.
 */
export function daysSinceContact(
  interactions: LeadInteraction[],
  today: string,
): number | null {
  const latest = interactions
    .map((i) => i.occurredAt)
    .sort()
    .at(-1);
  if (!latest) return null;
  const from = Date.parse(`${latest}T00:00:00Z`);
  const to = Date.parse(`${today}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to)) return null;
  return Math.max(0, Math.round((to - from) / 86400000));
}

/**
 * Waiting on them, with nothing sent since. The case the pipeline could not
 * previously show: a lead that looks active because its stage says so.
 */
export function awaitingReply(interactions: LeadInteraction[]): boolean {
  const latest = [...interactions].sort((a, b) =>
    a.occurredAt.localeCompare(b.occurredAt),
  );
  return latest.at(-1)?.direction === 'outbound';
}
