import { sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { auditEvents } from '@/db/schema';
import { workspaceOwnerId } from '@/app/chatgpt-auth';
import { enqueue } from '@/lib/outbox';
import {
  acknowledgementMessage,
  canAcknowledgeSenders,
  deliveryConfigured,
  founderMessage,
  leadNotificationAddress,
} from '@/lib/lead-notification';
import { validEmail } from '@/lib/resend';

/**
 * One way into this business.
 *
 * Every lead, from wherever, lands in the same table, with the same owner, the
 * same audit trail and the same two messages queued. The enquiry form was the
 * only path that did all of that; the free tools did none of it, which is why
 * somebody could run a business agent, describe their company in writing, read
 * a useful draft, and leave without the business ever knowing they existed.
 *
 * `source` is the point. It is the difference between "we got eleven leads" and
 * "the free tools produced eight of our eleven leads", and the second sentence
 * is the one the revenue ledger is asking for.
 */

export const leadSources = [
  'website_mapper',
  'website_pricing',
  'website_direct',
  'business_agent',
  'waitlist',
] as const;
export type LeadSource = (typeof leadSources)[number];

export type LeadIntake = {
  source: LeadSource;
  name: string;
  email: string;
  company: string;
  summary: string;
  /** What the visitor was shown, when there was something. */
  recommendation?: string;
  work?: string;
  channel?: string;
  desiredOutcome?: string;
  nextAction?: string;
  /**
   * Makes the capture safe to retry. Derived from the event by the caller, so
   * the same submission arriving twice is one lead.
   */
  intakeKey?: string;
  /** Extra context for the audit trail, never for the customer. */
  detail?: Record<string, unknown>;
  /**
   * A message written for this source, in place of the generic acknowledgement.
   * Somebody who pressed "send this to yourself" is expecting the thing they
   * were reading, not a note saying their enquiry arrived.
   */
  acknowledgement?: { subject: string; body: string };
};

export type IntakeResult = {
  id: string;
  duplicate: boolean;
  notified: boolean;
  acknowledged: boolean;
};

const trim = (value: string | undefined, limit: number) =>
  (value ?? '').replace(/\s+/g, ' ').trim().slice(0, limit);

/**
 * Capture a lead and queue the two messages that have to follow it.
 *
 * Nothing after the insert may throw. The lead is the asset; a queue that is
 * not migrated yet, an audit write that fails, a provider that is down, none of
 * those are worth losing a customer over.
 */
export async function captureLead(input: LeadIntake): Promise<IntakeResult> {
  const db = getDb();
  const email = input.email.trim().toLowerCase().slice(0, 200);
  const name = trim(input.name, 120) || 'Not given';
  const company = trim(input.company, 160) || 'Not given';
  const summary = trim(input.summary, 2000);
  const recommendation = trim(input.recommendation, 200) || 'Founder review';
  const ownerId = workspaceOwnerId() || null;
  const id = crypto.randomUUID();

  // ON CONFLICT DO NOTHING on the intake key, so a visitor who presses the
  // button again after a dropped connection gets the lead they already have
  // rather than a duplicate the founder has to work out.
  //
  // The WHERE repeats the unique index's own predicate. The index is partial,
  // because every lead captured before this column existed has a null key and a
  // plain unique index would have had to be built over them; without the
  // matching predicate Postgres cannot tell which index this targets and
  // rejects the statement outright.
  const inserted = await db.execute(sql`
    INSERT INTO opportunities
      (id, name, email, company, work, channel, desired_outcome,
       recommendation, summary, next_action, source, owner_id, intake_key)
    VALUES
      (${id}, ${name}, ${email}, ${company},
       ${trim(input.work, 160) || summary.slice(0, 160)},
       ${trim(input.channel, 160) || input.source},
       ${trim(input.desiredOutcome, 160) || recommendation},
       ${recommendation}, ${summary},
       ${trim(input.nextAction, 160) || 'Founder review and personal follow-up'},
       ${input.source}, ${ownerId}, ${input.intakeKey ?? null})
    ON CONFLICT (intake_key) WHERE intake_key IS NOT NULL DO NOTHING
    RETURNING id`);

  if (inserted.rows.length === 0 && input.intakeKey) {
    const existing = await db.execute(
      sql`SELECT id FROM opportunities WHERE intake_key=${input.intakeKey} LIMIT 1`,
    );
    const prior: unknown = existing.rows[0]?.id;
    const priorId = typeof prior === 'string' ? prior : id;
    return {
      id: priorId,
      duplicate: true,
      notified: true,
      acknowledged: true,
    };
  }

  await db
    .insert(auditEvents)
    .values({
      id: crypto.randomUUID(),
      actorType: 'visitor',
      action: 'lead.created',
      entityType: 'opportunity',
      entityId: id,
      details: {
        source: input.source,
        consent: 'provided',
        ...input.detail,
      },
    })
    .catch(() => null);

  const lead = { id, name, email, company, summary, recommendation };

  // The subject is what the founder sees in a list of unread mail, so it has to
  // identify the sender by whatever they actually gave. Somebody who pressed
  // "send this to yourself" supplied an address and nothing else, and "New
  // enquiry: Not given" is not a thing anyone will open first.
  const label =
    company !== 'Not given' ? company : name !== 'Not given' ? name : email;

  const founder = await enqueue({
    dedupeKey: `lead-${id}`,
    recipient: leadNotificationAddress(),
    subject: `New enquiry (${input.source}): ${label}`,
    body: founderMessage(lead),
    entityType: 'opportunity',
    entityId: id,
    ownerId,
  });

  // Withheld on the shared sandbox sender, which accepts a send to anyone and
  // then delivers only to the account owner. Queueing it would have the site
  // tell a visitor a confirmation is coming when nothing will arrive.
  const acknowledgeable = canAcknowledgeSenders() && validEmail(email);
  const sender = acknowledgeable
    ? await enqueue({
        dedupeKey: `lead-ack-${id}`,
        recipient: email,
        subject:
          input.acknowledgement?.subject ?? 'We have your enquiry | Aksen Labs',
        body: input.acknowledgement?.body ?? acknowledgementMessage(lead),
        entityType: 'opportunity',
        entityId: id,
        ownerId,
      })
    : null;

  await db
    .insert(auditEvents)
    .values({
      id: crypto.randomUUID(),
      actorType: 'system',
      action:
        founder.status === 'unconfigured' ? 'lead.queue_failed' : 'lead.queued',
      entityType: 'opportunity',
      entityId: id,
      details: {
        founder: founder.status,
        acknowledgement: sender?.status ?? 'withheld',
      },
    })
    .catch(() => null);

  return {
    id,
    duplicate: false,
    notified: founder.status !== 'unconfigured',
    // Queued is not sent. With no provider key the message sits in the outbox
    // and drains the moment one is set, which is the right behaviour, but a
    // visitor told a copy is on its way when none can leave has been lied to.
    // The queue is allowed to be optimistic. The page is not.
    acknowledged: sender?.status === 'queued' && deliveryConfigured(),
  };
}

/**
 * A stable key from the things that identify one submission. Same visitor, same
 * address, same words, same hour is one lead however many times the button was
 * pressed.
 */
export async function intakeKey(
  source: string,
  email: string,
  body: string,
): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(
      `${source}|${email.trim().toLowerCase()}|${body.trim().slice(0, 500)}|${new Date()
        .toISOString()
        .slice(0, 13)}`,
    ),
  );
  return Array.from(new Uint8Array(digest).slice(0, 16))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
