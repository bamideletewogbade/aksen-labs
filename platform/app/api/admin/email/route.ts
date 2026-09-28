import { withRequestLog } from '@/lib/request-log';
import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { workspaceUser } from '@/lib/workspace-access';
import { emailConfig, sendResendBatch } from '@/lib/resend';
import {
  MAX_GROUP,
  findTemplate,
  renderForRecipient,
  validAddress,
  type Recipient,
} from '@/lib/email-templates';

/**
 * The email desk. A person writes, the desk saves, the person reads every copy
 * and confirms, and only then does anything leave. AI may have drafted the
 * words; it never presses send (operating brief, section 2, rule 4).
 *
 * A send is a group: one row per person sharing a batch_id. Rows saved before
 * groups existed have no batch_id, so the group key is COALESCE(batch_id, id)
 * everywhere and an old single draft is simply a group of one.
 */

const MIGRATION_HINT =
  'Run node scripts/migrate-email-groups.mjs, then reload.';

async function GETHandler() {
  try {
    const user = await workspaceUser();
    const db = getDb();
    const rows = await db.execute(
      sql`SELECT id, COALESCE(batch_id,id) AS batch_key, recipient, recipient_name, subject, body, status, purpose, relationship_note, template_key, provider_id, created_at, sent_at
            FROM agency_email_outbox
           WHERE owner_id=${user.userId}
           ORDER BY created_at DESC, recipient
           LIMIT 300`,
    );
    const drafts = await db.execute(
      sql`SELECT id,agent_name,trace->>'content' AS content FROM agent_runs WHERE channel='operations' AND trace->>'ownerId'=${user.userId} AND trace->>'task'='followup' ORDER BY created_at DESC LIMIT 20`,
    );
    // Enquiries are shared between admins, so any admin can write to any of
    // them. Only rows with a usable address are worth offering.
    const contacts = await db.execute(
      sql`SELECT id, name, email, company, status FROM opportunities WHERE email LIKE '%@%' ORDER BY created_at DESC LIMIT 200`,
    );
    const stopped = await db.execute(
      sql`SELECT email FROM email_suppressions ORDER BY created_at DESC LIMIT 500`,
    );
    return NextResponse.json(
      {
        items: rows.rows,
        drafts: drafts.rows,
        contacts: contacts.rows,
        stopped: stopped.rows.map((r) => String(r.email)),
        maxGroup: MAX_GROUP,
        ...emailConfig(),
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch {
    return NextResponse.json(
      {
        error: `Email desk unavailable. Check admin access and the database. ${MIGRATION_HINT}`,
      },
      { status: 503 },
    );
  }
}

const clean = (value: unknown, max: number) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

function readRecipients(value: unknown): Recipient[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: Recipient[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const email = clean(row.email, 200).toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    out.push({
      email,
      name: clean(row.name, 120) || undefined,
      business: clean(row.business, 160) || undefined,
    });
  }
  return out;
}

async function POSTHandler(request: Request) {
  let user;
  try {
    user = await workspaceUser();
  } catch {
    return NextResponse.json(
      { error: 'Admin access required.' },
      { status: 403 },
    );
  }
  if (
    request.headers.get('origin') &&
    request.headers.get('origin') !== new URL(request.url).origin
  )
    return NextResponse.json(
      { error: 'Invalid request origin.' },
      { status: 403 },
    );
  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body)
    return NextResponse.json(
      { error: 'A valid request is required.' },
      { status: 400 },
    );
  const db = getDb();
  try {
    if (body.action === 'draft') return await saveDraft(db, user.userId, body);
    if (body.action === 'send') return await sendGroup(db, user.userId, body);
    if (body.action === 'discard') {
      const key = clean(body.batchKey, 100);
      const done = await db.execute(
        sql`UPDATE agency_email_outbox SET status='discarded' WHERE owner_id=${user.userId} AND COALESCE(batch_id,id)=${key} AND status='draft' RETURNING id`,
      );
      return NextResponse.json({ discarded: done.rows.length });
    }
    if (body.action === 'stop') {
      const email = clean(body.email, 200).toLowerCase();
      if (!validAddress(email))
        return NextResponse.json(
          { error: 'Enter the address that asked to stop.' },
          { status: 400 },
        );
      await db.execute(
        sql`WITH added AS (INSERT INTO email_suppressions(email,added_by) VALUES(${email},${user.userId}) ON CONFLICT (email) DO NOTHING RETURNING email) INSERT INTO audit_events(id,actor_id,actor_type,action,entity_type,entity_id) SELECT ${crypto.randomUUID()},${user.userId},'user','email.suppressed','email_address',${crypto.randomUUID()} FROM added`,
      );
      return NextResponse.json({ stopped: email });
    }
    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  } catch {
    return NextResponse.json(
      {
        error: `The email desk could not save that. Check the database. ${MIGRATION_HINT}`,
      },
      { status: 503 },
    );
  }
}

type Db = ReturnType<typeof getDb>;

async function saveDraft(
  db: Db,
  ownerId: string,
  body: Record<string, unknown>,
) {
  const recipients = readRecipients(body.recipients);
  const subject = clean(body.subject, 180);
  const content = clean(body.body, 12000);
  const note = clean(body.relationshipNote, 1000);
  const purpose = clean(body.purpose, 20);
  const templateKey = clean(body.templateKey, 60);
  const template = templateKey ? findTemplate(templateKey) : undefined;

  if (!['service', 'test', 'outreach'].includes(purpose))
    return bad('Choose what kind of email this is.');
  if (!recipients.length) return bad('Add at least one recipient.');
  if (recipients.length > MAX_GROUP)
    return bad(
      `One send reaches at most ${MAX_GROUP} people. Split the list, and check each one is someone you have a reason to write to.`,
    );
  const invalid = recipients.filter((r) => !validAddress(r.email));
  if (invalid.length)
    return bad(
      `Fix these addresses: ${invalid.map((r) => r.email).join(', ')}`,
    );
  if (!subject || /[\r\n]/.test(subject) || !content || !note)
    return bad(
      'Add a subject, a message and why you are writing to these people.',
    );
  if (templateKey && !template) return bad('That template no longer exists.');

  const replyTo = emailConfig().replyTo.toLowerCase();
  if (purpose === 'test' && recipients.some((r) => r.email !== replyTo))
    return bad(`Test emails go only to your own reply-to address, ${replyTo}.`);

  if (purpose !== 'test') {
    const list = sql.join(
      recipients.map((r) => sql`${r.email}`),
      sql`, `,
    );
    const stopped = await db.execute(
      sql`SELECT email FROM email_suppressions WHERE email IN (${list})`,
    );
    if (stopped.rows.length)
      return bad(
        `These people asked not to be emailed. Remove them first: ${stopped.rows.map((r) => r.email).join(', ')}`,
      );
  }

  const rendered = recipients.map((r) => ({
    recipient: r,
    ...renderForRecipient({ subject, body: content, purpose }, r),
  }));
  const incomplete = rendered.filter((r) => r.missing.length);
  if (incomplete.length) {
    const needsBusiness = incomplete.filter((r) =>
      r.missing.includes('business'),
    );
    if (needsBusiness.length)
      return bad(
        `This email uses the business name. Add it for: ${needsBusiness.map((r) => r.recipient.email).join(', ')}`,
      );
    return bad(
      `Fill in these blanks before saving: ${[...new Set(incomplete.flatMap((r) => r.missing))].map((t) => `{{${t}}}`).join(', ')}`,
    );
  }

  const batchId = crypto.randomUUID();
  const values = sql.join(
    rendered.map(
      (r) =>
        sql`(${crypto.randomUUID()},${ownerId},${r.recipient.email},${r.recipient.name ?? null},${r.subject},${r.body},${purpose},${note},${batchId},${templateKey || null})`,
    ),
    sql`, `,
  );
  await db.execute(
    sql`WITH saved AS (INSERT INTO agency_email_outbox(id,owner_id,recipient,recipient_name,subject,body,purpose,relationship_note,batch_id,template_key) VALUES ${values} RETURNING id) INSERT INTO audit_events(id,actor_id,actor_type,action,entity_type,entity_id) SELECT ${crypto.randomUUID()},${ownerId},'user','email.drafted','email_batch',${batchId} WHERE EXISTS (SELECT 1 FROM saved)`,
  );
  return NextResponse.json(
    { batchKey: batchId, count: rendered.length },
    { status: 201 },
  );
}

async function sendGroup(
  db: Db,
  ownerId: string,
  body: Record<string, unknown>,
) {
  const key = clean(body.batchKey, 100);
  const expected = Number(body.count);
  if (body.confirmed !== true || !key || !Number.isInteger(expected))
    return bad('Read every copy and confirm before sending.');
  if (!emailConfig().configured)
    return NextResponse.json(
      {
        error:
          'Set RESEND_API_KEY and a verified RESEND_FROM_EMAIL before sending.',
      },
      { status: 503 },
    );

  const claim = await db.execute(
    sql`UPDATE agency_email_outbox SET status='sending' WHERE owner_id=${ownerId} AND COALESCE(batch_id,id)=${key} AND status='draft' RETURNING id, recipient, subject, body, purpose`,
  );
  const claimed = claim.rows as {
    id: string;
    recipient: string;
    subject: string;
    body: string;
    purpose: string;
  }[];
  if (!claimed.length)
    return NextResponse.json(
      {
        error:
          'Nothing in this group is still a draft. Refresh to see its status; do not recreate an uncertain send.',
      },
      { status: 409 },
    );
  // The person confirmed a number. If the group changed since they read it,
  // they did not review what is about to go, so hand it back untouched.
  if (claimed.length !== expected) {
    await db.execute(
      sql`UPDATE agency_email_outbox SET status='draft' WHERE owner_id=${ownerId} AND COALESCE(batch_id,id)=${key} AND status='sending'`,
    );
    return NextResponse.json(
      {
        error:
          'This group changed since you reviewed it. Refresh and review it again.',
      },
      { status: 409 },
    );
  }

  // Checked again at send time: someone can ask to stop after the draft was saved.
  const list = sql.join(
    claimed.map((r) => sql`${r.recipient}`),
    sql`, `,
  );
  const stopped = new Set(
    (
      await db.execute(
        sql`SELECT email FROM email_suppressions WHERE email IN (${list})`,
      )
    ).rows.map((r) => String(r.email)),
  );
  const toSend = claimed.filter(
    (r) => r.purpose === 'test' || !stopped.has(r.recipient),
  );
  const held = claimed.filter((r) => !toSend.includes(r));
  if (held.length) {
    const ids = sql.join(
      held.map((r) => sql`${r.id}`),
      sql`, `,
    );
    await db.execute(
      sql`UPDATE agency_email_outbox SET status='suppressed' WHERE id IN (${ids})`,
    );
  }
  if (!toSend.length)
    return NextResponse.json({ sent: 0, suppressed: held.length });

  const sendingIds = sql.join(
    toSend.map((r) => sql`${r.id}`),
    sql`, `,
  );
  let receipts: string[];
  try {
    receipts = await sendResendBatch(
      key,
      toSend.map((r) => ({
        recipient: r.recipient,
        subject: r.subject,
        body: r.body,
        outreach: r.purpose === 'outreach',
      })),
    );
  } catch {
    await db
      .execute(
        sql`UPDATE agency_email_outbox SET status='uncertain' WHERE id IN (${sendingIds})`,
      )
      .catch(() => null);
    return NextResponse.json(
      {
        error:
          'Resend did not confirm this group. Check the Resend dashboard before any retry; the desk will not send it again by itself.',
      },
      { status: 502 },
    );
  }
  const pairs = sql.join(
    toSend.map((r, i) => sql`(${r.id},${receipts[i]})`),
    sql`, `,
  );
  await db.execute(
    sql`WITH sent AS (UPDATE agency_email_outbox o SET status='sent', provider_id=v.pid, sent_at=now() FROM (VALUES ${pairs}) AS v(id,pid) WHERE o.id=v.id AND o.owner_id=${ownerId} RETURNING o.id) INSERT INTO audit_events(id,actor_id,actor_type,action,entity_type,entity_id) SELECT ${crypto.randomUUID()},${ownerId},'user','email.accepted_by_provider','email_batch',${key} WHERE EXISTS (SELECT 1 FROM sent)`,
  );
  return NextResponse.json({ sent: toSend.length, suppressed: held.length });
}

function bad(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

export const GET = withRequestLog('/api/admin/email', GETHandler);

export const POST = withRequestLog('/api/admin/email', POSTHandler);
