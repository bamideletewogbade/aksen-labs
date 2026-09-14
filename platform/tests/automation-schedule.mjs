// Run: node tests/automation-schedule.mjs
//
// This decides when an unattended job spends model credits. Getting it wrong
// is either silence when work was expected, or a bill. The logic is a pure
// function precisely so it can be checked here rather than by waiting until
// tomorrow morning to find out.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const { isDue, describeSchedule, isCadence, CADENCES } = await import(
  'data:text/javascript;base64,' +
    Buffer.from(
      ts.transpileModule(
        fs.readFileSync('lib/automation-schedule.ts', 'utf8'),
        {
          compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2022,
          },
        },
      ).outputText,
    ).toString('base64')
);

const clean = { lastScheduledAt: null, runsToday: 0, runningUntil: null };
const daily = { cadence: 'daily', runHour: 9, maxPerDay: 1, enabled: true };

// 2026-09-14 is a Monday; 2026-09-19 a Saturday; 2026-09-15 a Tuesday.
const monday09 = new Date('2026-09-14T09:00:00Z');
const monday08 = new Date('2026-09-14T08:59:00Z');
const monday23 = new Date('2026-09-14T23:30:00Z');
const saturday = new Date('2026-09-19T10:00:00Z');
const tuesday = new Date('2026-09-15T10:00:00Z');

// ---- the ordinary case ----
assert.equal(isDue(daily, monday09, clean).due, true);

// ---- refusals, each of which must explain itself ----
for (const { label, schedule, now, state } of [
  {
    label: 'paused',
    schedule: { ...daily, enabled: false },
    now: monday09,
    state: clean,
  },
  {
    label: 'manual',
    schedule: { ...daily, cadence: 'manual' },
    now: monday09,
    state: clean,
  },
  { label: 'before the hour', schedule: daily, now: monday08, state: clean },
  {
    label: 'weekend on weekdays',
    schedule: { ...daily, cadence: 'weekdays' },
    now: saturday,
    state: clean,
  },
  {
    label: 'not Monday on weekly',
    schedule: { ...daily, cadence: 'weekly' },
    now: tuesday,
    state: clean,
  },
  {
    label: 'already ran',
    schedule: daily,
    now: monday09,
    state: { ...clean, runsToday: 1 },
  },
  {
    label: 'still running',
    schedule: daily,
    now: monday09,
    state: { ...clean, runningUntil: new Date('2026-09-14T09:02:00Z') },
  },
]) {
  const verdict = isDue(schedule, now, state);
  assert.equal(verdict.due, false, `${label} should not be due`);
  assert.ok(
    typeof verdict.reason === 'string' && verdict.reason.length > 8,
    `${label} refused without saying why, which is indistinguishable from a bug`,
  );
}

// ---- late is still due ----
// A heartbeat that missed 09:00 because nothing was awake must still run the
// day's search at 23:30 rather than skip the day for being late.
assert.equal(isDue(daily, monday23, clean).due, true);

// ---- a finished run does not block the next one ----
assert.equal(
  isDue(daily, monday09, {
    ...clean,
    runningUntil: new Date('2026-09-14T08:50:00Z'),
  }).due,
  true,
  'a lock that has already expired should not hold the schedule shut',
);

// ---- more than one a day, when asked for ----
const twice = { ...daily, maxPerDay: 2 };
assert.equal(isDue(twice, monday09, { ...clean, runsToday: 1 }).due, true);
assert.equal(isDue(twice, monday09, { ...clean, runsToday: 2 }).due, false);

// ---- weekdays and weekly on their own days ----
assert.equal(
  isDue({ ...daily, cadence: 'weekdays' }, tuesday, clean).due,
  true,
);
assert.equal(isDue({ ...daily, cadence: 'weekly' }, monday09, clean).due, true);

// ---- the day boundary ----
// Yesterday's run must not suppress today's.
assert.equal(
  isDue(daily, monday09, {
    lastScheduledAt: new Date('2026-09-13T09:00:00Z'),
    runsToday: 0,
    runningUntil: null,
  }).due,
  true,
  "yesterday's run is suppressing today's",
);

// ---- manual never runs unattended, whatever else is set ----
for (const hour of [0, 9, 23]) {
  assert.equal(
    isDue(
      { cadence: 'manual', runHour: hour, maxPerDay: 6, enabled: true },
      monday09,
      clean,
    ).due,
    false,
    'manual must never fire on a heartbeat',
  );
}

// ---- input guarding ----
assert.ok(isCadence('daily'));
assert.ok(!isCadence('hourly'));
assert.ok(!isCadence(''));
assert.ok(!isCadence(null));
assert.equal(CADENCES[0], 'manual', 'manual must remain the safe default');

// ---- the sentence shown in the admin ----
assert.match(describeSchedule({ ...daily, enabled: false }), /Paused/);
assert.match(
  describeSchedule({ ...daily, cadence: 'manual' }),
  /only when you press/i,
);
assert.match(describeSchedule(daily), /Every day from 09:00 UTC/);
assert.match(describeSchedule(twice), /up to 2 times a day/);
assert.match(describeSchedule({ ...daily, cadence: 'weekly' }), /Every Monday/);

console.log('automation-schedule: all checks passed');
