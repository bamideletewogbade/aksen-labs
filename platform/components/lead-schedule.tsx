'use client';
import { useState } from 'react';
import { PendingButton } from '@/components/ui/activity';
import {
  CADENCES,
  CADENCE_LABEL,
  describeSchedule,
  isDue,
  type Cadence,
} from '@/lib/automation-schedule';

/**
 * Deciding when the search runs without you.
 *
 * Two things had to be true for this to be worth putting on the screen. It has
 * to read back as a sentence, because a grid of dropdowns does not tell you
 * what will actually happen tonight. And when nothing happened, it has to say
 * why, because a schedule that silently does nothing looks exactly like a
 * broken one, and the support conversation that follows costs more than the
 * feature saved.
 *
 * Hours are UTC because that is what the row stores and what the heartbeat
 * compares against. Accra is UTC, so for the Ghana side the label is literal;
 * Lagos is one hour ahead, and the control says so rather than converting
 * silently and leaving two people reading the same number differently.
 */

const HOURS = [5, 6, 7, 8, 9, 12, 15, 18, 21];

export type Campaign = {
  enabled: boolean;
  cadence: Cadence;
  run_hour: number;
  max_per_day: number;
  last_scheduled_at: string | null;
  running_until: string | null;
};

function localHour(hour: number) {
  // Lagos is UTC+1 the whole year, so this is arithmetic rather than a guess
  // about daylight saving.
  return `${String((hour + 1) % 24).padStart(2, '0')}:00 Lagos`;
}

type Saved = {
  cadence: Cadence;
  runHour: number;
  maxPerDay: number;
  enabled: boolean;
};

export function LeadSchedule({
  campaign,
  busy,
  pending,
  onSave,
}: {
  campaign: Campaign | null;
  busy: boolean;
  pending: string;
  onSave: (schedule: {
    cadence: Cadence;
    runHour: number;
    maxPerDay: number;
  }) => void;
}) {
  if (!campaign)
    return (
      <section className="scout-panel lead-schedule">
        <h2>Unattended searching</h2>
        <p>
          Save a search target first, then choose when it should run on its own.
        </p>
      </section>
    );

  const saved: Saved = {
    cadence: campaign.cadence ?? 'manual',
    runHour: campaign.run_hour ?? 8,
    maxPerDay: campaign.max_per_day ?? 1,
    enabled: campaign.enabled,
  };

  // The stored row is the authority, and the key is how it reclaims the form:
  // when a reload brings back different values the controls remount holding
  // them. An effect copying props into state would do the same thing while
  // leaving a window where the two disagree.
  return (
    <ScheduleForm
      key={`${saved.cadence}:${saved.runHour}:${saved.maxPerDay}`}
      campaign={campaign}
      saved={saved}
      busy={busy}
      pending={pending}
      onSave={onSave}
    />
  );
}

function ScheduleForm({
  campaign,
  saved,
  busy,
  pending,
  onSave,
}: {
  campaign: Campaign;
  saved: Saved;
  busy: boolean;
  pending: string;
  onSave: (schedule: {
    cadence: Cadence;
    runHour: number;
    maxPerDay: number;
  }) => void;
}) {
  const [cadence, setCadence] = useState<Cadence>(saved.cadence);
  const [runHour, setRunHour] = useState(saved.runHour);
  const [maxPerDay, setMaxPerDay] = useState(saved.maxPerDay);

  const unsaved =
    cadence !== saved.cadence ||
    runHour !== saved.runHour ||
    maxPerDay !== saved.maxPerDay;

  // What the schedule says will happen, and what the gate says about right now.
  // The second is the one that answers "so why did last night produce nothing".
  const verdict = isDue(saved, new Date(), {
    lastScheduledAt: campaign.last_scheduled_at
      ? new Date(campaign.last_scheduled_at)
      : null,
    runsToday:
      campaign.last_scheduled_at &&
      campaign.last_scheduled_at.slice(0, 10) ===
        new Date().toISOString().slice(0, 10)
        ? 1
        : 0,
    runningUntil: campaign.running_until
      ? new Date(campaign.running_until)
      : null,
  });

  return (
    <section className="scout-panel lead-schedule">
      <div className="lead-schedule-head">
        <div>
          <span className="scout-eyebrow">UNATTENDED SEARCHING</span>
          <h2>When this runs without you</h2>
        </div>
        <span className={cadence === 'manual' ? 'scout-idle' : 'scout-live'}>
          {cadence === 'manual' ? 'Manual' : CADENCE_LABEL[cadence]}
        </span>
      </div>

      <p className="lead-schedule-sentence">
        {describeSchedule({
          cadence,
          runHour,
          maxPerDay,
          enabled: saved.enabled,
        })}
      </p>

      <fieldset className="lead-options-group">
        <legend>How often</legend>
        <div className="lead-options">
          {CADENCES.map((option) => (
            <button
              key={option}
              type="button"
              className="lead-option"
              aria-pressed={cadence === option}
              onClick={() => setCadence(option)}
            >
              {CADENCE_LABEL[option]}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Hidden on manual, where a start time and a daily ceiling are settings
          for something that never happens. */}
      {cadence !== 'manual' && (
        <>
          <fieldset className="lead-options-group">
            <legend>Not before</legend>
            <div className="lead-options">
              {HOURS.map((hour) => (
                <button
                  key={hour}
                  type="button"
                  className="lead-option"
                  aria-pressed={runHour === hour}
                  onClick={() => setRunHour(hour)}
                  title={localHour(hour)}
                >
                  {String(hour).padStart(2, '0')}:00
                </button>
              ))}
            </div>
            <p className="scout-small">
              UTC, which is Accra time. {String(runHour).padStart(2, '0')}:00
              UTC is {localHour(runHour)}. A search that misses its hour still
              runs later the same day rather than skipping the day.
            </p>
          </fieldset>

          <fieldset className="lead-options-group">
            <legend>At most, each day</legend>
            <div className="lead-options">
              {[1, 2, 3].map((count) => (
                <button
                  key={count}
                  type="button"
                  className="lead-option"
                  aria-pressed={maxPerDay === count}
                  onClick={() => setMaxPerDay(count)}
                >
                  {count} {count === 1 ? 'search' : 'searches'}
                </button>
              ))}
            </div>
            <p className="scout-small">
              Each search spends model credit and adds to the daily allowance
              you share with manual runs. One a day is enough for most markets.
            </p>
          </fieldset>
        </>
      )}

      <div className="scout-actions">
        <PendingButton
          className="scout-primary"
          pending={pending === 'schedule'}
          disabled={busy || !unsaved}
          pendingLabel="Saving…"
          onClick={() => onSave({ cadence, runHour, maxPerDay })}
        >
          {unsaved ? 'Save schedule' : 'Schedule saved'}
        </PendingButton>
      </div>

      <p className="lead-schedule-status">
        <b>Right now: </b>
        {verdict.due
          ? 'a search is due and the next heartbeat will start it.'
          : verdict.reason}
        {campaign.last_scheduled_at && (
          <span>
            {' '}
            Last unattended run{' '}
            {new Date(campaign.last_scheduled_at).toLocaleString()}.
          </span>
        )}
      </p>
    </section>
  );
}
