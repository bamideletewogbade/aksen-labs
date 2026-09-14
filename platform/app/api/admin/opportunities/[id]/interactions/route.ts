import { withRequestLog } from '@/lib/request-log';
import { adminEmailAllowed } from '@/lib/admin-policy';
import { and, desc, eq, isNull, or } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { auditEvents, leadInteractions, opportunities } from '@/db/schema';
import { boundedJson } from '@/lib/bounded-json';
import { isChannel, isDirection } from '@/lib/lead-interactions';
import { validDate } from '@/lib/workspace-rules';

const text = (value: unknown, limit: number) =>
  (typeof value === 'string' ? value : '').trim().slice(0, limit);

async function requireAdmin() {
  const user = await getChatGPTUser();
  if (!user)
    return {
      error: NextResponse.json({ error: 'Sign in required.' }, { status: 401 }),
    };
  if (!adminEmailAllowed(user.email))
    return {
      error: NextResponse.json({ error: 'Not authorized.' }, { status: 403 }),
    };
  return { user };
}

/**
 * Only a lead in this workspace, so history cannot be read or written by id.
 *
 * Unowned rows count as ours, matching what the pipeline lists. A strict match
 * here meant a lead visible in the list answered 404 when its history was
 * opened, which looks like the record is broken rather than like a rule being
 * enforced.
 */
async function ownedLead(id: string, owner: string) {
  const [row] = await getDb()
    .select({ id: opportunities.id })
    .from(opportunities)
    .where(
      and(
        eq(opportunities.id, id),
        or(eq(opportunities.ownerId, owner), isNull(opportunities.ownerId)),
      ),
    )
    .limit(1);
  return row?.id;
}

async function GETHandler(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;
  if (!(await ownedLead(id, auth.user.userId)))
    return NextResponse.json({ error: 'Enquiry not found.' }, { status: 404 });

  const rows = await getDb()
    .select({
      id: leadInteractions.id,
      occurredAt: leadInteractions.occurredAt,
      channel: leadInteractions.channel,
      direction: leadInteractions.direction,
      summary: leadInteractions.summary,
      shared: leadInteractions.shared,
    })
    .from(leadInteractions)
    .where(eq(leadInteractions.opportunityId, id))
    .orderBy(desc(leadInteractions.occurredAt))
    .limit(100);

  return NextResponse.json(
    { interactions: rows },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}

async function POSTHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;
  if (!(await ownedLead(id, auth.user.userId)))
    return NextResponse.json({ error: 'Enquiry not found.' }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await boundedJson(request, 4000);
  } catch {
    return NextResponse.json(
      { error: 'A valid entry is required.' },
      { status: 400 },
    );
  }

  const summary = text(body.summary, 500);
  if (!summary)
    return NextResponse.json({ error: 'Say what happened.' }, { status: 400 });
  if (!isChannel(body.channel))
    return NextResponse.json(
      { error: 'Choose how you spoke to them.' },
      { status: 400 },
    );
  if (!isDirection(body.direction))
    return NextResponse.json(
      { error: 'Say who contacted whom.' },
      { status: 400 },
    );
  const occurredAt = text(body.occurredAt, 10);
  if (occurredAt && !validDate(occurredAt))
    return NextResponse.json(
      { error: 'Use a real date in YYYY-MM-DD form.' },
      { status: 400 },
    );

  const entryId = crypto.randomUUID();
  const day = occurredAt || new Date().toISOString().slice(0, 10);
  const shared = text(body.shared, 300) || null;
  const db = getDb();
  await db.insert(leadInteractions).values({
    id: entryId,
    opportunityId: id,
    ownerId: auth.user.userId,
    occurredAt: day,
    channel: body.channel,
    direction: body.direction,
    summary,
    shared,
  });
  await db
    .insert(auditEvents)
    .values({
      id: crypto.randomUUID(),
      actorId: auth.user.userId,
      actorType: 'user',
      action: 'opportunity.interaction_logged',
      entityType: 'opportunity',
      entityId: id,
      details: { channel: body.channel, direction: body.direction },
    })
    .catch(() => null);

  return NextResponse.json(
    {
      id: entryId,
      occurredAt: day,
      channel: body.channel,
      direction: body.direction,
      summary,
      shared,
    },
    { status: 201 },
  );
}

/**
 * Removes one entry. Contact history is typed quickly between other work, so
 * it collects entries logged against the wrong lead or with the wrong date,
 * and until now every one of those was permanent.
 *
 * A hard delete rather than a hidden flag: this is a note about a conversation,
 * not a business record, and a history that quietly keeps what you asked it to
 * forget is worse than one that loses a line. The audit trail records that a
 * deletion happened without preserving what was written.
 */
async function DELETEHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;
  if (!(await ownedLead(id, auth.user.userId)))
    return NextResponse.json({ error: 'Enquiry not found.' }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await boundedJson(request, 1000);
  } catch {
    return NextResponse.json(
      { error: 'Say which entry to remove.' },
      { status: 400 },
    );
  }
  const entryId = text(body.entryId, 100);
  if (!entryId)
    return NextResponse.json(
      { error: 'Say which entry to remove.' },
      { status: 400 },
    );

  const db = getDb();
  // Scoped by the lead as well as the entry, so an id from one lead's history
  // cannot delete a line from another's.
  const [removed] = await db
    .delete(leadInteractions)
    .where(
      and(
        eq(leadInteractions.id, entryId),
        eq(leadInteractions.opportunityId, id),
      ),
    )
    .returning({ id: leadInteractions.id });
  if (!removed)
    return NextResponse.json({ error: 'Entry not found.' }, { status: 404 });

  await db
    .insert(auditEvents)
    .values({
      id: crypto.randomUUID(),
      actorId: auth.user.userId,
      actorType: 'user',
      action: 'opportunity.interaction_removed',
      entityType: 'opportunity',
      entityId: id,
    })
    .catch(() => null);

  return NextResponse.json({ id: removed.id });
}

export const GET = withRequestLog(
  '/api/admin/opportunities/[id]/interactions',
  GETHandler,
);
export const POST = withRequestLog(
  '/api/admin/opportunities/[id]/interactions',
  POSTHandler,
);
export const DELETE = withRequestLog(
  '/api/admin/opportunities/[id]/interactions',
  DELETEHandler,
);
