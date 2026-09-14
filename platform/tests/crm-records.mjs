import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const uri = (text) =>
  'data:text/javascript;base64,' + Buffer.from(text).toString('base64');
const load = (file) =>
  import(
    uri(
      ts.transpileModule(fs.readFileSync(file, 'utf8'), {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
        },
      }).outputText,
    )
  );

const items = await load('lib/project-items.ts');
const history = await load('lib/lead-interactions.ts');

// Only the four kinds and three statuses the interface offers are accepted, so
// a crafted request cannot invent a state the rest of the app cannot render.
for (const good of ['task', 'deliverable', 'decision', 'risk'])
  assert.ok(items.isKind(good));
for (const bad of ['__proto__', 'constructor', 'invoice', '', 42, null])
  assert.ok(!items.isKind(bad));
for (const good of ['open', 'done', 'blocked']) assert.ok(items.isStatus(good));
for (const bad of ['closed', 'archived', '', {}])
  assert.ok(!items.isStatus(bad));

// A deliverable claimed complete with nothing to show is the delivery version
// of accepted work nobody invoiced, so it is surfaced rather than assumed fine.
const done = (over = {}) => ({
  id: 'i',
  kind: 'deliverable',
  title: 't',
  description: null,
  status: 'done',
  dueAt: null,
  evidence: null,
  ...over,
});
assert.equal(items.needsEvidence(done()), true);
assert.equal(items.needsEvidence(done({ evidence: '   ' })), true);
assert.equal(items.needsEvidence(done({ evidence: 'Signed off' })), false);
assert.equal(items.needsEvidence(done({ status: 'open' })), false);
// A task is not a deliverable; only what was promised needs proof.
assert.equal(items.needsEvidence(done({ kind: 'task' })), false);

const summary = items.itemSummary([
  done(),
  done({ status: 'open' }),
  done({ status: 'blocked' }),
  done({ evidence: 'x' }),
]);
assert.deepEqual(summary, { open: 1, blocked: 1, unevidenced: 1 });

// Channels and directions are closed sets for the same reason.
for (const good of ['whatsapp', 'call', 'email', 'meeting', 'other'])
  assert.ok(history.isChannel(good));
for (const bad of ['sms', 'telegram', '', '__proto__'])
  assert.ok(!history.isChannel(bad));
assert.ok(history.isDirection('inbound') && history.isDirection('outbound'));
assert.ok(!history.isDirection('both'));

const entry = (occurredAt, direction) => ({
  id: occurredAt,
  occurredAt,
  channel: 'whatsapp',
  direction,
  summary: 's',
  shared: null,
});

// Days since anyone spoke, counted from the most recent entry whatever order
// they arrive in. A stage says where a deal is; this says whether it moves.
assert.equal(history.daysSinceContact([], '2026-09-13'), null);
assert.equal(
  history.daysSinceContact(
    [entry('2026-09-01', 'outbound'), entry('2026-09-11', 'inbound')],
    '2026-09-13',
  ),
  2,
);
assert.equal(
  history.daysSinceContact([entry('2026-09-13', 'outbound')], '2026-09-13'),
  0,
);
assert.equal(
  history.daysSinceContact([entry('not-a-date', 'outbound')], '2026-09-13'),
  null,
);

// Waiting on them: the last thing recorded went out and nothing came back.
assert.equal(
  history.awaitingReply([
    entry('2026-09-11', 'inbound'),
    entry('2026-09-13', 'outbound'),
  ]),
  true,
);
// Unsorted input must reach the same answer as sorted input.
assert.equal(
  history.awaitingReply([
    entry('2026-09-13', 'outbound'),
    entry('2026-09-11', 'inbound'),
  ]),
  true,
);
assert.equal(
  history.awaitingReply([
    entry('2026-09-11', 'outbound'),
    entry('2026-09-13', 'inbound'),
  ]),
  false,
);
assert.equal(history.awaitingReply([]), false);

// The routes reject anything outside those sets before a write is attempted.
const itemsRoute = fs.readFileSync(
  'app/api/admin/projects/[id]/items/route.ts',
  'utf8',
);
assert.match(itemsRoute, /isKind\(body\.kind\)/);
assert.match(itemsRoute, /isStatus\(body\.status\)/);
// Both routes resolve the parent by owner first, so an id alone reaches nothing.
assert.match(itemsRoute, /eq\(projects\.ownerId, owner\)/);
const historyRoute = fs.readFileSync(
  'app/api/admin/opportunities/[id]/interactions/route.ts',
  'utf8',
);
assert.match(historyRoute, /eq\(opportunities\.ownerId, owner\)/);
assert.match(historyRoute, /isChannel\(body\.channel\)/);
assert.match(historyRoute, /isDirection\(body\.direction\)/);

console.log(
  'PASS: closed kind, status, channel and direction sets, unevidenced deliverables, item counts, days since contact from unsorted entries, awaiting-reply detection, and owner-scoped parent lookup in both routes.',
);
