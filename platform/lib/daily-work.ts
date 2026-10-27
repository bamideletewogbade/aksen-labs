export type DailyAction = {
  id: string;
  area: 'Sales' | 'Work' | 'Money';
  title: string;
  detail: string;
  reason: string;
  href: string;
  priority: number;
  date: string;
};
export type DailyLead = {
  id: string;
  name: string;
  status: string;
  nextAction: string;
  followUpAt: string | null;
};
export type DailyProject = {
  id: string;
  name: string;
  stage: string;
  health: string;
  progress: number;
  nextGate: string;
  blocked: number;
  dueAt: string | null;
};
export type OpenInvoice = {
  id: string;
  businessId: string;
  client: string;
  number: string;
  currency: string;
  balance: number;
  dueDate: string | null;
};

// Invalid imported dates must not turn an invoice into an overdue request.
export function dateOnly(value: unknown): string | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return null;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
    ? value
    : null;
}
export function invoiceHref(invoice: OpenInvoice) {
  return `/admin/workspaces?businessId=${encodeURIComponent(invoice.businessId)}&financialId=${encodeURIComponent(invoice.id)}&tab=finance`;
}
export function dailyActions({
  leads,
  projects,
  invoices,
  today,
}: {
  leads: DailyLead[];
  projects: DailyProject[];
  invoices: OpenInvoice[];
  today: string;
}): DailyAction[] {
  const actions: DailyAction[] = [];
  for (const lead of leads) {
    if (!['new', 'qualified', 'proposal'].includes(lead.status)) continue;
    const due = dateOnly(lead.followUpAt);
    if (due && due > today) continue;
    const overdue = due !== null && due < today;
    actions.push({
      id: `lead-${lead.id}`,
      area: 'Sales',
      title: lead.name,
      detail: lead.nextAction || 'Review the enquiry and choose the next step.',
      reason: overdue
        ? `Follow-up overdue · ${due}`
        : due === today
          ? 'Follow up today'
          : lead.status === 'new'
            ? 'New enquiry to review'
            : 'No follow-up date',
      priority: overdue ? 0 : due === today ? 1 : lead.status === 'new' ? 2 : 4,
      date: due || today,
      href: `/admin/pipeline?leadId=${encodeURIComponent(lead.id)}`,
    });
  }
  for (const project of projects) {
    if (!['discovery', 'delivery', 'accepted'].includes(project.stage))
      continue;
    const due = dateOnly(project.dueAt);
    const blocked = project.blocked > 0 || project.health === 'at_risk';
    const overdue = due !== null && due < today;
    const review = project.progress >= 100 && project.stage !== 'accepted';
    actions.push({
      id: `project-${project.id}`,
      area: 'Work',
      title: project.name,
      detail: project.nextGate || 'Set the next step for this project.',
      reason: blocked
        ? 'Delivery needs attention'
        : overdue
          ? `Work overdue · ${due}`
          : due === today
            ? 'Work due today'
            : review
              ? 'Build complete · client review still needed'
              : project.stage === 'accepted'
                ? 'Review handover and ongoing care'
                : 'Next delivery step',
      priority: blocked || overdue ? 0 : due === today ? 1 : review ? 2 : 5,
      date: due || today,
      href: `/admin/projects?projectId=${encodeURIComponent(project.id)}`,
    });
  }
  for (const invoice of invoices) {
    if (invoice.balance <= 0) continue;
    const due = dateOnly(invoice.dueDate);
    if (due && due > today) continue;
    actions.push({
      id: `invoice-${invoice.id}`,
      area: 'Money',
      title: invoice.client,
      detail: `Review invoice ${invoice.number} and its recorded balance.`,
      reason:
        due && due < today
          ? `Payment overdue · ${due}`
          : due === today
            ? 'Payment due today'
            : 'Confirm the invoice due date',
      priority: due && due < today ? 0 : due === today ? 1 : 4,
      date: due || today,
      href: invoiceHref(invoice),
    });
  }
  return actions.sort(
    (a, b) =>
      a.priority - b.priority ||
      a.date.localeCompare(b.date) ||
      a.id.localeCompare(b.id),
  );
}
