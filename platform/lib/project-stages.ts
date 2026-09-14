export const PROJECT_STAGES = ['discovery', 'delivery', 'accepted', 'closed'] as const;
export type ProjectStage = typeof PROJECT_STAGES[number];

export const STAGE_LABEL: Record<string, string> = {
  discovery: 'Discovery',
  delivery: 'In delivery',
  accepted: 'Accepted by client',
  closed: 'Closed',
};

export type Billing = 'none' | 'awaiting' | 'paid';

export const BILLING_LABEL: Record<Billing, string> = {
  none: 'Not invoiced',
  awaiting: 'Awaiting payment',
  paid: 'Paid',
};

/**
 * Accepted work with no invoice is the money equivalent of an unanswered enquiry:
 * the job is done and nobody has asked to be paid for it.
 */
export function needsInvoicing(stage: string, billing: Billing): boolean {
  return (stage === 'accepted' || stage === 'closed') && billing === 'none';
}
