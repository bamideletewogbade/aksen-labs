/**
 * When an automated lead search is allowed to run.
 *
 * The decision is a pure function of the stored schedule and the current time,
 * with no database and no clock of its own, so it can be tested directly
 * rather than by waiting for tomorrow morning.
 *
 * The design is a dumb heartbeat and a strict gate. Something outside calls in
 * regularly and asks "is anything due?", and everything about whether the
 * answer is yes lives here and in the database. Changing the schedule is then
 * an edit in the admin rather than a deploy, and a heartbeat that fires too
 * often costs nothing because the gate refuses.
 */

export const CADENCES = ['manual', 'daily', 'weekdays', 'weekly'] as const;
export type Cadence = (typeof CADENCES)[number];

export const CADENCE_LABEL: Record<Cadence, string> = {
  manual: 'Only when I press the button',
  daily: 'Every day',
  weekdays: 'Monday to Friday',
  weekly: 'Once a week, on Monday',
};

export type Schedule = {
  cadence: Cadence;
  /** Hour of day, UTC. Accra is UTC; Lagos is one hour ahead. */
  runHour: number;
  /** Ceiling on automated runs in a single UTC day. */
  maxPerDay: number;
  enabled: boolean;
};

export function isCadence(value: unknown): value is Cadence {
  return typeof value === 'string' && CADENCES.includes(value as Cadence);
}

/** Hour and day-of-week are read in UTC, which is what the schedule stores. */
function partsOf(now: Date) {
  return {
    hour: now.getUTCHours(),
    weekday: now.getUTCDay(),
    day: now.toISOString().slice(0, 10),
  };
}

export type DueVerdict = { due: true } | { due: false; reason: string };

/**
 * Whether a run should start now.
 *
 * Every refusal names itself. A schedule that silently does nothing is
 * indistinguishable from a broken one, and this is the answer the admin shows
 * when someone asks why last night produced nothing.
 */
export function isDue(
  schedule: Schedule,
  now: Date,
  state: {
    /** When the automation last fired, not when a manual run happened. */
    lastScheduledAt: Date | null;
    /** Automated runs already started during the current UTC day. */
    runsToday: number;
    /** A run currently in flight holds this until it finishes. */
    runningUntil: Date | null;
  },
): DueVerdict {
  if (!schedule.enabled) return { due: false, reason: 'Searching is paused.' };
  if (schedule.cadence === 'manual')
    return { due: false, reason: 'Set to run only when you press the button.' };

  if (state.runningUntil && state.runningUntil.getTime() > now.getTime())
    return { due: false, reason: 'A search is already running.' };

  const { hour, weekday, day } = partsOf(now);

  if (schedule.cadence === 'weekdays' && (weekday === 0 || weekday === 6))
    return { due: false, reason: 'Weekdays only, and today is the weekend.' };
  if (schedule.cadence === 'weekly' && weekday !== 1)
    return { due: false, reason: 'Weekly, and that is Mondays.' };

  // Before the hour, not yet. After it, still yes: a heartbeat that missed
  // 09:00 because nothing was awake should still run the day's search at 11,
  // rather than skip the day entirely for being late.
  if (hour < schedule.runHour)
    return {
      due: false,
      reason: `Scheduled for ${String(schedule.runHour).padStart(2, '0')}:00 UTC.`,
    };

  if (state.runsToday >= schedule.maxPerDay)
    return {
      due: false,
      reason: `Already ran ${state.runsToday} ${state.runsToday === 1 ? 'time' : 'times'} today.`,
    };

  // The same UTC day is the unit. Two heartbeats an hour apart must not both
  // fire, and maxPerDay above is what permits more than one deliberately.
  if (
    state.lastScheduledAt &&
    state.lastScheduledAt.toISOString().slice(0, 10) === day &&
    state.runsToday >= schedule.maxPerDay
  )
    return { due: false, reason: 'Already run today.' };

  return { due: true };
}

/** Plain English for the admin, so the setting reads back as a sentence. */
export function describeSchedule(schedule: Schedule): string {
  if (!schedule.enabled) return 'Paused. Nothing runs on its own.';
  if (schedule.cadence === 'manual')
    return 'Runs only when you press Find businesses.';
  const at = `${String(schedule.runHour).padStart(2, '0')}:00 UTC`;
  const times =
    schedule.maxPerDay > 1 ? `, up to ${schedule.maxPerDay} times a day` : '';
  const when =
    schedule.cadence === 'daily'
      ? 'Every day'
      : schedule.cadence === 'weekdays'
        ? 'Monday to Friday'
        : 'Every Monday';
  return `${when} from ${at}${times}.`;
}
