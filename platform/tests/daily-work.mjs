import assert from 'node:assert/strict';
import { dailyActions, dateOnly, invoiceHref } from '../lib/daily-work.ts';
import { adminModules, moduleForPath } from '../lib/admin-navigation.ts';

const today = '2026-10-10';
const lead = (overrides = {}) => ({
  id: 'lead',
  name: 'Fictional shop',
  status: 'qualified',
  nextAction: 'Review the brief',
  followUpAt: today,
  ...overrides,
});
const project = (overrides = {}) => ({
  id: 'project',
  name: 'Fictional website',
  stage: 'delivery',
  health: 'on_track',
  progress: 50,
  nextGate: 'Review homepage',
  blocked: 0,
  dueAt: null,
  ...overrides,
});
const invoice = (overrides = {}) => ({
  id: 'invoice',
  businessId: 'client',
  client: 'Fictional client',
  number: 'TEST-1',
  currency: 'GHS',
  balance: 40000,
  dueDate: today,
  ...overrides,
});
const actions = (overrides = {}) =>
  dailyActions({ leads: [], projects: [], invoices: [], today, ...overrides });

assert.equal(dateOnly('2026-02-30'), null);
assert.equal(dateOnly('2026-00-10'), null);
assert.equal(dateOnly('2026-10-10T00:00:00Z'), null);
assert.equal(dateOnly('2024-02-29'), '2024-02-29');
assert.deepEqual(
  actions({
    leads: [
      lead({ status: 'won' }),
      lead({ status: 'lost' }),
      lead({ followUpAt: '2026-10-11' }),
    ],
    projects: [project({ stage: 'closed' })],
    invoices: [invoice({ balance: 0 }), invoice({ dueDate: '2026-10-11' })],
  }),
  [],
);
const ordered = actions({
  leads: [
    lead({ id: 'new', status: 'new', followUpAt: null }),
    lead({ id: 'old', followUpAt: '2026-10-01' }),
  ],
  projects: [
    project({ id: 'blocked', blocked: 1 }),
    project({ id: 'review', progress: 100 }),
  ],
  invoices: [invoice()],
});
assert.equal(ordered[0].id, 'lead-old');
assert.ok(
  ordered.findIndex((item) => item.id === 'project-blocked') <
    ordered.findIndex((item) => item.id === 'lead-new'),
);
assert.match(
  ordered.find((item) => item.id === 'project-review').reason,
  /client review still needed/,
);
assert.equal(
  actions({ leads: [lead({ followUpAt: null })] }).length,
  1,
  'undated open work must not disappear',
);
assert.match(
  actions({ invoices: [invoice({ dueDate: '2026-02-30' })] })[0].reason,
  /Confirm/,
  'invalid dates do not assert overdue money',
);
assert.match(
  actions({ projects: [project({ stage: 'accepted', progress: 100 })] })[0]
    .reason,
  /handover/,
);
assert.match(
  invoiceHref(invoice({ id: 'a&b', businessId: 'c?d' })),
  /businessId=c%3Fd&financialId=a%26b/,
);
assert.deepEqual(
  adminModules.map((item) => item.label),
  ['Today', 'Sales', 'Work', 'Money', 'Marketing', 'Company', 'Settings'],
);
for (const [path, label] of [
  ['/admin', 'Today'],
  ['/admin/assessment/client', 'Sales'],
  ['/admin/support/knowledge', 'Sales'],
  ['/admin/workspaces', 'Work'],
  ['/admin/studio', 'Marketing'],
  ['/admin/approvals', 'Marketing'],
  ['/admin/money', 'Money'],
  ['/admin/agents', 'Settings'],
])
  assert.equal(moduleForPath(path)?.label, label);
console.log(
  'PASS daily priority ordering, closed/future exclusions, honest handover states, safe deep links and navigation ownership',
);
