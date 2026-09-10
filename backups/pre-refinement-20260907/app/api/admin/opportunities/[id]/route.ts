import { eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { auditEvents, opportunities } from '@/db/schema';
import { validDate } from '@/lib/workspace-rules';

export const PIPELINE_STAGES = ['new', 'qualified', 'proposal', 'won', 'lost'] as const;

function isAdmin(email: string) {
  const allowlist = (process.env.ADMIN_EMAILS || '').split(',').map((v) => v.trim().toLowerCase()).filter(Boolean);
  return !allowlist.length || allowlist.includes(email.toLowerCase());
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  if (!isAdmin(user.email)) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: 'A valid update is required.' }, { status: 400 });

  // Database time, not app time: created_at comes from Postgres, so a skewed
  // server clock could otherwise stamp an update as older than the record.
  const patch: Record<string, unknown> = { updatedAt: sql`now()` };

  if (body.status !== undefined) {
    const stage = String(body.status);
    if (!PIPELINE_STAGES.includes(stage as typeof PIPELINE_STAGES[number])) {
      return NextResponse.json({ error: 'That is not a pipeline stage.' }, { status: 400 });
    }
    patch.status = stage;
  }

  if (body.nextAction !== undefined) {
    const next = String(body.nextAction).trim().slice(0, 200);
    if (!next) return NextResponse.json({ error: 'A next action cannot be empty.' }, { status: 400 });
    patch.nextAction = next;
  }

  if (body.followUpAt !== undefined) {
    // Empty clears the date. A plain date, not a timestamp, so a follow-up on the
    // 10th stays the 10th regardless of where anyone is reading it.
    if (body.followUpAt === null || body.followUpAt === '') {
      patch.followUpAt = null;
    } else {
      const day = String(body.followUpAt);
      if (!validDate(day)) return NextResponse.json({ error: 'Use a real date in YYYY-MM-DD form.' }, { status: 400 });
      patch.followUpAt = day;
    }
  }

  if (patch.status === undefined && patch.nextAction === undefined && patch.followUpAt === undefined) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  }

  const db = getDb();
  const [updated] = await db.update(opportunities).set(patch).where(eq(opportunities.id, id))
    .returning({ id: opportunities.id, status: opportunities.status, nextAction: opportunities.nextAction, followUpAt: opportunities.followUpAt });
  if (!updated) return NextResponse.json({ error: 'Enquiry not found.' }, { status: 404 });

  const action = patch.status ? `opportunity.${patch.status}`
    : patch.followUpAt !== undefined ? (patch.followUpAt ? 'opportunity.follow_up_set' : 'opportunity.follow_up_cleared')
    : 'opportunity.next_action_set';
  const details = patch.status ? { stage: patch.status }
    : patch.followUpAt !== undefined ? { followUpAt: patch.followUpAt }
    : { nextAction: patch.nextAction };

  await db.insert(auditEvents).values({
    id: crypto.randomUUID(), actorId: user.userId, actorType: 'user',
    action, entityType: 'opportunity', entityId: id, details,
  }).catch(() => null);

  return NextResponse.json(updated);
}
