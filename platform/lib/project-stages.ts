export const PROJECT_STAGES = [
  'discovery',
  'delivery',
  'accepted',
  'closed',
] as const;
export type ProjectStage = (typeof PROJECT_STAGES)[number];

export const STAGE_LABEL: Record<string, string> = {
  discovery: 'Discovery',
  delivery: 'In delivery',
  accepted: 'Accepted by client',
  closed: 'Closed',
};

export type Billing = 'none' | 'awaiting' | 'paid' | 'received';

export const BILLING_LABEL: Record<Billing, string> = {
  none: 'Not invoiced',
  awaiting: 'Awaiting payment',
  paid: 'Paid',

  received: 'Payment recorded',
};

/**
 * Accepted work with no invoice is the money equivalent of an unanswered enquiry:
 * the job is done and nobody has asked to be paid for it.
 */
export function needsInvoicing(stage: string, billing: Billing): boolean {
  return (stage === 'accepted' || stage === 'closed') && billing === 'none';
}

/** Receipts can precede invoicing. An unknown contract total is not a zero balance. */

export function projectBilling({
  invoiced,
  outstanding,
  received,
  settled,
}: {
  invoiced: boolean;
  outstanding: number;
  received: number;
  settled: boolean;
}): Billing {
  if (invoiced) return outstanding > 0 ? 'awaiting' : 'paid';

  if (received > 0) return settled ? 'paid' : 'received';

  return 'none';
}
