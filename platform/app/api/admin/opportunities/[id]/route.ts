import { withRequestLog } from '@/lib/request-log';
import { adminEmailAllowed } from '@/lib/admin-policy';
import { and, eq, isNull, or, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import {
  auditEvents,
  conversations,
  leadInteractions,
  opportunities,
  projects,
} from '@/db/schema';
import { validDate } from '@/lib/workspace-rules';

export const PIPELINE_STAGES = [
  'new',
  'qualified',
  'proposal',
  'won',
  'lost',
] as const;

function isAdmin(email: string) {
  return adminEmailAllowed(email);
}

async function PATCHHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getChatGPTUser();
  if (!user)
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  if (!isAdmin(user.email))
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body)
    return NextResponse.json(
      { error: 'A valid update is required.' },
      { status: 400 },
    );

  // Database time, not app time: created_at comes from Postgres, so a skewed
  // server clock could otherwise stamp an update as older than the record.
  const patch: Record<string, unknown> = { updatedAt: sql`now()` };

  if (body.status !== undefined) {
    const stage = typeof body.status === 'string' ? body.status : '';
    if (!PIPELINE_STAGES.includes(stage as (typeof PIPELINE_STAGES)[number])) {
      return NextResponse.json(
        { error: 'That is not a pipeline stage.' },
        { status: 400 },
      );
    }
    patch.status = stage;
  }

  if (body.nextAction !== undefined) {
    const next = (typeof body.nextAction === 'string' ? body.nextAction : '')
      .trim()
      .slice(0, 200);
    if (!next)
      return NextResponse.json(
        { error: 'A next action cannot be empty.' },
        { status: 400 },
      );
    patch.nextAction = next;
  }

  if (body.followUpAt !== undefined) {
    // Empty clears the date. A plain date, not a timestamp, so a follow-up on the
    // 10th stays the 10th regardless of where anyone is reading it.
    if (body.followUpAt === null || body.followUpAt === '') {
      patch.followUpAt = null;
    } else {
      const day = typeof body.followUpAt === 'string' ? body.followUpAt : '';
      if (!validDate(day))
        return NextResponse.json(
          { error: 'Use a real date in YYYY-MM-DD form.' },
          { status: 400 },
        );
      patch.followUpAt = day;
    }
  }

  if (
    patch.status === undefined &&
    patch.nextAction === undefined &&
    patch.followUpAt === undefined
  ) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  }

  const db = getDb();
  const [updated] = await db
    .update(opportunities)
    .set(patch)
    .where(eq(opportunities.id, id))
    .returning({
      id: opportunities.id,
      status: opportunities.status,
      nextAction: opportunities.nextAction,
      followUpAt: opportunities.followUpAt,
    });
  if (!updated)
    return NextResponse.json({ error: 'Enquiry not found.' }, { status: 404 });

  const action = patch.status
    ? `opportunity.${typeof patch.status === 'string' ? patch.status : ''}`
    : patch.followUpAt !== undefined
      ? patch.followUpAt
        ? 'opportunity.follow_up_set'
        : 'opportunity.follow_up_cleared'
      : 'opportunity.next_action_set';
  const details = patch.status
    ? { stage: patch.status }
    : patch.followUpAt !== undefined
      ? { followUpAt: patch.followUpAt }
      : { nextAction: patch.nextAction };

  await db
    .insert(auditEvents)
    .values({
      id: crypto.randomUUID(),
      actorId: user.userId,
      actorType: 'user',
      action,
      entityType: 'opportunity',
      entityId: id,
      details,
    })
    .catch(() => null);

  return NextResponse.json(updated);
}

/**
 * Two different acts, kept apart on purpose.
 *
 * `erase` is what we do when a person asks us to delete their information, a
 * thing the privacy notice promises twice and which, until now, could only
 * have been done by hand-writing SQL against production. It removes the
 * identifiers and the conversation content and keeps the business record: that
 * a company enquired, at what stage it ended, and that an erasure happened.
 *
 * `remove` deletes the row. It is for test rows and duplicates, not for
 * people, and it refuses when a project was created from the enquiry, because
 * that is the origin of real delivered work.
 *
 * Neither writes the erased values into the audit trail. `safeLogDetails`
 * already drops anything outside its allowlist, so the record proves the act
 * without preserving what the act removed.
 */
async function DELETEHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getChatGPTUser();
  if (!user)
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  if (!isAdmin(user.email))
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  const mode = body?.mode === 'remove' ? 'remove' : 'erase';

  const db = getDb();
  // Matches what the pipeline shows, including rows this application failed to
  // stamp with an owner. A lead visible in the list must be actionable from it.
  const ownerMatches = or(
    eq(opportunities.ownerId, user.userId),
    isNull(opportunities.ownerId),
  );
  const [existing] = await db
    .select({ id: opportunities.id, company: opportunities.company })
    .from(opportunities)
    .where(and(eq(opportunities.id, id), ownerMatches));
  if (!existing)
    return NextResponse.json({ error: 'Enquiry not found.' }, { status: 404 });

  // Nothing here is a real foreign key, so a delete would not fail on a
  // reference: it would leave rows pointing at an enquiry that no longer
  // exists, and nothing would say so. Each one is handled explicitly.
  const linkedProjects = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.opportunityId, id));

  if (mode === 'remove' && linkedProjects.length) {
    return NextResponse.json(
      {
        error:
          'A project was created from this enquiry, so removing it would cut that work loose from where it came from. Erase the personal details instead, which keeps the link.',
        projects: linkedProjects.length,
      },
      { status: 409 },
    );
  }

  // The conversation content is the personal part, and it goes in both modes.
  const removedInteractions = await db
    .delete(leadInteractions)
    .where(eq(leadInteractions.opportunityId, id))
    .returning({ id: leadInteractions.id });

  const unlinkedConversations = await db
    .update(conversations)
    .set({ opportunityId: null, updatedAt: sql`now()` })
    .where(eq(conversations.opportunityId, id))
    .returning({ id: conversations.id });

  if (mode === 'remove') {
    await db.delete(opportunities).where(eq(opportunities.id, id));
  } else {
    await db
      .update(opportunities)
      .set({
        // Markers rather than blanks: a row of empty fields reads as a broken
        // record, and someone will eventually try to "fix" it.
        name: 'Erased at their request',
        email: '',
        website: null,
        summary: null,
        consentStatus: 'erased',
        nextAction: 'Erased at their request. No further contact.',
        followUpAt: null,
        updatedAt: sql`now()`,
      })
      .where(eq(opportunities.id, id));
  }

  await db
    .insert(auditEvents)
    .values({
      id: crypto.randomUUID(),
      actorId: user.userId,
      actorType: 'user',
      action: mode === 'remove' ? 'opportunity.removed' : 'opportunity.erased',
      entityType: 'opportunity',
      entityId: id,
    })
    .catch(() => null);

  // Reported back rather than assumed, so whoever handled the request can say
  // truthfully what was removed and what was kept.
  return NextResponse.json({
    id,
    mode,
    interactionsDeleted: removedInteractions.length,
    conversationsUnlinked: unlinkedConversations.length,
    projectsKept: linkedProjects.length,
  });
}

export const PATCH = withRequestLog(
  '/api/admin/opportunities/[id]',
  PATCHHandler,
);

export const DELETE = withRequestLog(
  '/api/admin/opportunities/[id]',
  DELETEHandler,
);
