import { sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { emailConfig, redactEmails, sendResendEmail } from '@/lib/resend';

/**
 * One way out of this business.
 *
 * Everything sent to a person goes through here: enqueue during the request,
 * deliver on the heartbeat. Three things follow from that and none of them are
 * available when a route calls a provider directly.
 *
 * The visitor stops waiting for somebody else's API. Capturing a lead is an
 * insert, and an insert does not time out because a mail provider is having an
 * afternoon.
 *
 * A failed send is retried rather than mourned. It used to leave an audit row
 * saying nobody was told, which is a record of the failure, not a recovery from
 * it.
 *
 * Adding WhatsApp later is a new `channel` and a new sender function. It is not
 * a second delivery path with its own retry rules, its own logging and its own
 * bugs, which is what every system that grows a second channel by copying the
 * first ends up with.
 */

/** After this many tries a message is abandoned and a person has to look. */
const MAX_ATTEMPTS = 6;

/**
 * Backoff between attempts, in minutes, indexed by attempts already made.
 * Roughly thirteen hours end to end: long enough to ride out a provider
 * incident, short enough that a morning enquiry is answered the same day.
 */
const BACKOFF_MINUTES = [1, 5, 25, 120, 600];

/**
 * A row claimed by a worker that then died would otherwise sit in `sending`
 * for ever. Anything claimed longer ago than this is assumed dead and requeued.
 * Comfortably longer than the 20s provider timeout.
 */
const CLAIM_MINUTES = 10;

export type Enqueued = {
  id: string;
  status: 'queued' | 'duplicate' | 'unconfigured';
};

export type OutboxMessage = {
  channel?: 'email';
  /**
   * Stable and derived from the event, never random. `lead-ack-<id>` enqueued
   * twice is one acknowledgement; `crypto.randomUUID()` would be two.
   */
  dedupeKey: string;
  recipient: string;
  subject: string;
  body: string;
  entityType?: string;
  entityId?: string;
  ownerId?: string | null;
};

/**
 * Queue a message. Never throws: the caller has usually just captured something
 * worth keeping, and a queue problem must not become the visitor's problem.
 */
export async function enqueue(message: OutboxMessage): Promise<Enqueued> {
  const id = crypto.randomUUID();
  try {
    const inserted = await getDb().execute(sql`
      INSERT INTO message_outbox
        (id, channel, dedupe_key, recipient, subject, body, entity_type, entity_id, owner_id)
      VALUES
        (${id}, ${message.channel ?? 'email'}, ${message.dedupeKey},
         ${message.recipient}, ${message.subject.slice(0, 300)}, ${message.body},
         ${message.entityType ?? null}, ${message.entityId ?? null}, ${message.ownerId ?? null})
      ON CONFLICT (dedupe_key) DO NOTHING
      RETURNING id`);
    return inserted.rows.length > 0
      ? { id, status: 'queued' }
      : { id, status: 'duplicate' };
  } catch {
    // A deployment that has not run the migration should still capture leads.
    // The message is lost, which is bad, and losing the lead as well is worse.
    return { id, status: 'unconfigured' };
  }
}

type Claimed = {
  id: string;
  channel: string;
  recipient: string;
  subject: string;
  body: string;
  attempts: number;
};

export type DrainResult = {
  claimed: number;
  sent: number;
  retrying: number;
  abandoned: number;
  reason?: string;
};

/**
 * Deliver what is due. Called by the heartbeat, and safe to call as often as
 * anyone likes: the claim is what stops two runs sending the same message, not
 * the schedule.
 */
export async function drainOutbox(limit = 20): Promise<DrainResult> {
  const empty: DrainResult = {
    claimed: 0,
    sent: 0,
    retrying: 0,
    abandoned: 0,
  };
  if (!emailConfig().configured)
    return { ...empty, reason: 'Email delivery is not configured.' };

  const db = getDb();

  try {
    // Reclaim first. A worker that died mid-send left its rows claimed, and
    // nothing else will ever pick them up.
    await db.execute(sql`
      UPDATE message_outbox
         SET status='queued', updated_at=now()
       WHERE status='sending'
         AND updated_at < now() - (${CLAIM_MINUTES} * interval '1 minute')`);

    // Claim and increment in one statement. SKIP LOCKED means two heartbeats
    // that overlap take different rows instead of one of them waiting.
    const claimed = await db.execute(sql`
      UPDATE message_outbox
         SET status='sending', attempts=attempts+1, updated_at=now()
       WHERE id IN (
         SELECT id FROM message_outbox
          WHERE status='queued' AND next_attempt_at <= now()
          ORDER BY next_attempt_at
          LIMIT ${limit}
          FOR UPDATE SKIP LOCKED)
      RETURNING id, channel, recipient, subject, body, attempts`);

    const rows = claimed.rows as unknown as Claimed[];
    const result: DrainResult = { ...empty, claimed: rows.length };

    for (const row of rows) {
      try {
        const receipt = await deliver(row);
        await db.execute(sql`
          UPDATE message_outbox
             SET status='sent', sent_at=now(), updated_at=now(),
                 provider_receipt=${receipt}, last_error=NULL
           WHERE id=${row.id}`);
        result.sent += 1;
      } catch (error) {
        const reason = redactEmails(
          error instanceof Error ? error.message : 'Delivery failed.',
        ).slice(0, 400);
        const exhausted = row.attempts >= MAX_ATTEMPTS;
        const wait =
          BACKOFF_MINUTES[
            Math.min(row.attempts - 1, BACKOFF_MINUTES.length - 1)
          ];
        await db.execute(sql`
          UPDATE message_outbox
             SET status=${exhausted ? 'abandoned' : 'queued'},
                 last_error=${reason},
                 next_attempt_at=now() + (${wait} * interval '1 minute'),
                 updated_at=now()
           WHERE id=${row.id}`);
        if (exhausted) result.abandoned += 1;
        else result.retrying += 1;
      }
    }
    return result;
  } catch (error) {
    // A missing table on a deployment that has not migrated must not take the
    // rest of the heartbeat down with it.
    return {
      ...empty,
      reason: error instanceof Error ? error.message : 'Drain failed.',
    };
  }
}

async function deliver(row: Claimed) {
  if (row.channel !== 'email')
    throw new Error(`No sender for channel ${row.channel}.`);
  return sendResendEmail({
    // The provider gets the same idempotency key on every retry, so a send that
    // succeeded and then failed to report back is not delivered twice.
    id: row.id,
    recipient: row.recipient,
    subject: row.subject,
    body: row.body,
  });
}

/** What the admin needs to see: is anything stuck, and how badly. */
export async function outboxHealth() {
  try {
    const counts = await getDb().execute(sql`
      SELECT status, count(*)::int AS n,
             min(created_at) AS oldest
        FROM message_outbox
       WHERE status <> 'sent'
       GROUP BY status`);
    return { available: true, rows: counts.rows };
  } catch {
    return { available: false, rows: [] };
  }
}
