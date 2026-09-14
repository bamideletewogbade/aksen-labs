import { withRequestLog } from '@/lib/request-log';
import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { workspaceUser } from '@/lib/workspace-access';
import { emailConfig, validEmail, sendResendEmail } from '@/lib/resend';
async function GETHandler() {
  try {
    const user = await workspaceUser();
    const rows = await getDb().execute(
      sql`SELECT * FROM agency_email_outbox WHERE owner_id=${user.userId} ORDER BY created_at DESC LIMIT 40`,
    );
    const drafts = await getDb().execute(
      sql`SELECT id,agent_name,trace->>'content' AS content FROM agent_runs WHERE channel='operations' AND trace->>'ownerId'=${user.userId} AND trace->>'task'='followup' ORDER BY created_at DESC LIMIT 20`,
    );
    return NextResponse.json(
      { items: rows.rows, drafts: drafts.rows, ...emailConfig() },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch {
    return NextResponse.json(
      {
        error:
          'Outbox unavailable. Check admin access, database and operations migration.',
      },
      { status: 503 },
    );
  }
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
  const clean = (value: unknown, max: number) =>
    typeof value === 'string' ? value.trim().slice(0, max) : '';
  try {
    if (body.action === 'draft') {
      const recipient = clean(body.recipient, 200).toLowerCase(),
        subject = clean(body.subject, 180),
        content = clean(body.body, 12000),
        note = clean(body.relationshipNote, 1000);
      if (
        !validEmail(recipient) ||
        !subject ||
        /[\r\n]/.test(subject) ||
        !content ||
        !note ||
        !['service', 'test'].includes(
          typeof body.purpose === 'string' ? body.purpose : '',
        )
      )
        return NextResponse.json(
          {
            error:
              'Add a valid recipient, subject, message and relationship / test context.',
          },
          { status: 400 },
        );
      if (
        body.purpose === 'test' &&
        recipient !== emailConfig().replyTo.toLowerCase()
      )
        return NextResponse.json(
          { error: 'Test drafts must use the configured reply-to address.' },
          { status: 400 },
        );
      const id = crypto.randomUUID();
      await db.execute(
        sql`WITH draft AS (INSERT INTO agency_email_outbox(id,owner_id,recipient,subject,body,purpose,relationship_note) VALUES(${id},${user.userId},${recipient},${subject},${content},${body.purpose},${note}) RETURNING id) INSERT INTO audit_events(id,actor_id,actor_type,action,entity_type,entity_id) SELECT ${crypto.randomUUID()},${user.userId},'user','email.drafted','email',id FROM draft`,
      );
      return NextResponse.json({ id }, { status: 201 });
    }
    if (body.action !== 'send' || body.confirmed !== true)
      return NextResponse.json(
        {
          error:
            'Review and explicitly confirm the saved email before sending.',
        },
        { status: 400 },
      );
    if (!emailConfig().configured)
      return NextResponse.json(
        {
          error:
            'Configure RESEND_API_KEY and a verified RESEND_FROM_EMAIL before sending.',
        },
        { status: 503 },
      );
    const id = clean(body.id, 100);
    const claim = await db.execute(
      sql`UPDATE agency_email_outbox SET status='sending' WHERE id=${id} AND owner_id=${user.userId} AND status='draft' RETURNING recipient,subject,body`,
    );
    if (!claim.rows.length)
      return NextResponse.json(
        {
          error:
            'This email is no longer a draft. Refresh its status; do not recreate an uncertain send.',
        },
        { status: 409 },
      );
    try {
      const row = claim.rows[0];
      const providerId = await sendResendEmail({
        id,
        recipient: String(row.recipient),
        subject: String(row.subject),
        body: String(row.body),
      });
      await db.execute(
        sql`WITH sent AS (UPDATE agency_email_outbox SET status='sent',provider_id=${providerId},sent_at=now() WHERE id=${id} AND owner_id=${user.userId} RETURNING id) INSERT INTO audit_events(id,actor_id,actor_type,action,entity_type,entity_id) SELECT ${crypto.randomUUID()},${user.userId},'user','email.accepted_by_provider','email',id FROM sent`,
      );
      return NextResponse.json({ id, status: 'sent', providerId });
    } catch {
      await db
        .execute(
          sql`UPDATE agency_email_outbox SET status='uncertain' WHERE id=${id} AND owner_id=${user.userId}`,
        )
        .catch(() => null);
      return NextResponse.json(
        {
          error:
            'Delivery acceptance could not be confirmed. Check this email in Resend before any retry; the outbox will not send it again automatically.',
        },
        { status: 502 },
      );
    }
  } catch {
    return NextResponse.json(
      {
        error:
          'Outbox action could not be saved. Check the database and reload.',
      },
      { status: 503 },
    );
  }
}

export const GET = withRequestLog('/api/admin/email', GETHandler);

export const POST = withRequestLog('/api/admin/email', POSTHandler);
