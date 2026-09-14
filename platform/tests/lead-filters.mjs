// Run: node tests/lead-filters.mjs
//
// A filter that quietly drops a lead is worse than no filter, because the
// missing row looks like a search that found nothing rather than a rule that
// hid it. These check each facet in isolation and then together.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const mod = await import(
  'data:text/javascript;base64,' +
    Buffer.from(
      ts
        .transpileModule(fs.readFileSync('lib/lead-filters.ts', 'utf8'), {
          compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2022,
          },
        })
        .outputText.replace(/from '\.\/prospect-evidence';?/, ''),
    ).toString('base64')
);
const {
  filterLeads,
  matchesFilter,
  statusCounts,
  runsPresent,
  filterIsActive,
  reachable,
  sourceCount,
  EMPTY_FILTER,
} = mod;

const now = new Date('2026-09-14T12:00:00Z').getTime();
const daysAgo = (n) => new Date(now - n * 86_400_000).toISOString();

const leads = [
  {
    id: 'a',
    company: 'Ansaah Realty',
    website: 'https://ansaahrealty.com',
    domain: 'ansaahrealty.com',
    status: 'new',
    run_id: 'run-2',
    created_at: daysAgo(0),
    opportunity_id: null,
    data: {
      description: 'Real estate in East Legon, Accra',
      opportunity: 'Property management systems',
      contacts: [{ kind: 'email', value: 'info@ansaahrealty.com' }],
      sources: [{}, {}, {}, {}, {}],
    },
  },
  {
    id: 'b',
    company: 'Aducraft Furniture',
    website: 'https://aducraft.com',
    domain: 'aducraft.com',
    status: 'shortlisted',
    run_id: 'run-1',
    created_at: daysAgo(3),
    opportunity_id: null,
    data: {
      description: 'Accra furniture maker',
      opportunity: 'Order tracking',
      contacts: [{ kind: 'phone', value: '+233200000000' }],
      sources: [{}, {}],
    },
  },
  {
    id: 'c',
    company: 'Quiet Workshop',
    website: 'https://quiet.example',
    domain: 'quiet.example',
    status: 'new',
    run_id: null,
    created_at: daysAgo(40),
    opportunity_id: null,
    data: {
      description: 'No way in',
      opportunity: '',
      contacts: [],
      sources: [{}],
    },
  },
  {
    id: 'd',
    company: 'Dismissed Co',
    website: 'https://dismissed.example',
    domain: 'dismissed.example',
    status: 'dismissed',
    run_id: 'run-1',
    created_at: daysAgo(3),
    opportunity_id: null,
    data: {
      description: 'Not a fit',
      opportunity: '',
      contacts: [
        { kind: 'email', value: 'x@dismissed.example' },
        { kind: 'phone', value: '+2340000' },
      ],
      sources: [{}, {}, {}],
    },
  },
];

const ids = (list) =>
  list
    .map((lead) => lead.id)
    .sort()
    .join('');

// ---- nothing set shows everything ----
assert.equal(ids(filterLeads(leads, EMPTY_FILTER, now)), 'abcd');
assert.equal(filterIsActive(EMPTY_FILTER), false);

// ---- status ----
assert.equal(
  ids(filterLeads(leads, { ...EMPTY_FILTER, status: 'new' }, now)),
  'ac',
);
assert.equal(
  ids(filterLeads(leads, { ...EMPTY_FILTER, status: 'dismissed' }, now)),
  'd',
);

// ---- contactability, which is what decides if a lead is actionable ----
assert.equal(
  ids(filterLeads(leads, { ...EMPTY_FILTER, contact: 'email' }, now)),
  'ad',
);
assert.equal(
  ids(filterLeads(leads, { ...EMPTY_FILTER, contact: 'phone' }, now)),
  'bd',
);
assert.equal(
  ids(filterLeads(leads, { ...EMPTY_FILTER, contact: 'none' }, now)),
  'c',
  'the unreachable lead is the one worth finding, and it is the easiest to lose',
);
assert.equal(reachable(leads[2]), false);
assert.equal(reachable(leads[0]), true);

// ---- evidence ----
assert.equal(sourceCount(leads[0]), 5);
assert.equal(
  ids(filterLeads(leads, { ...EMPTY_FILTER, minSources: 3 }, now)),
  'ad',
);
assert.equal(
  ids(filterLeads(leads, { ...EMPTY_FILTER, minSources: 6 }, now)),
  '',
);

// ---- age ----
assert.equal(
  ids(filterLeads(leads, { ...EMPTY_FILTER, withinDays: 1 }, now)),
  'a',
);
assert.equal(
  ids(filterLeads(leads, { ...EMPTY_FILTER, withinDays: 7 }, now)),
  'abd',
);
// A lead with no date must not masquerade as recent.
const undated = {
  ...leads[0],
  id: 'z',
  created_at: undefined,
  updated_at: undefined,
};
assert.equal(
  matchesFilter(undated, { ...EMPTY_FILTER, withinDays: 7 }, now),
  false,
  'a lead with no date should not pass a recency filter',
);

// ---- by run, which is the question an unattended search creates ----
assert.equal(
  ids(filterLeads(leads, { ...EMPTY_FILTER, runId: 'run-1' }, now)),
  'bd',
);
assert.equal(
  ids(filterLeads(leads, { ...EMPTY_FILTER, runId: 'run-2' }, now)),
  'a',
);

// ---- text ----
assert.equal(
  ids(filterLeads(leads, { ...EMPTY_FILTER, text: 'accra' }, now)),
  'ab',
);
assert.equal(
  ids(filterLeads(leads, { ...EMPTY_FILTER, text: 'ACCRA' }, now)),
  'ab',
  'search should not depend on case',
);
// Every word must match, so typing more narrows. A search that widens as you
// add terms is not a search.
assert.equal(
  ids(filterLeads(leads, { ...EMPTY_FILTER, text: 'accra furniture' }, now)),
  'b',
);
// Contact values are searchable, because pasting an address you have is a
// natural way to ask whether you already have the company.
assert.equal(
  ids(filterLeads(leads, { ...EMPTY_FILTER, text: 'info@ansaahrealty' }, now)),
  'a',
);

// ---- facets combine ----
assert.equal(
  ids(
    filterLeads(
      leads,
      { ...EMPTY_FILTER, status: 'new', contact: 'email' },
      now,
    ),
  ),
  'a',
);
assert.equal(
  ids(
    filterLeads(
      leads,
      { ...EMPTY_FILTER, status: 'new', contact: 'email', minSources: 6 },
      now,
    ),
  ),
  '',
);

// ---- counts must agree with what the filter shows ----
const counts = statusCounts(leads);
assert.equal(counts.all, 4);
assert.equal(counts.new, 2);
assert.equal(counts.shortlisted, 1);
assert.equal(counts.dismissed, 1);
assert.equal(counts.promoted, 0);
for (const status of ['new', 'shortlisted', 'dismissed', 'promoted']) {
  assert.equal(
    filterLeads(leads, { ...EMPTY_FILTER, status }, now).length,
    counts[status],
    `the ${status} count disagrees with the rows the filter returns`,
  );
}

// ---- runs, newest first, ignoring leads that never recorded one ----
const runs = runsPresent(leads);
assert.equal(runs.length, 2);
assert.equal(runs[0].runId, 'run-2', 'runs should be newest first');
assert.equal(runs[1].count, 2);

// ---- malformed data must not throw ----
for (const broken of [
  { ...leads[0], data: {} },
  { ...leads[0], data: { contacts: null, sources: null } },
  { ...leads[0], data: undefined },
]) {
  assert.doesNotThrow(() => matchesFilter(broken, EMPTY_FILTER, now));
  assert.doesNotThrow(() =>
    matchesFilter(broken, { ...EMPTY_FILTER, contact: 'email' }, now),
  );
}

console.log('lead-filters: all checks passed');
