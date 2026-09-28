import { withRequestLog } from '@/lib/request-log';
import { adminEmailAllowed } from '@/lib/admin-policy';
import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { auditEvents, opportunities } from '@/db/schema';
import { parseGoals } from '@/lib/business-goals';

function isAdmin(email: string) {
  return adminEmailAllowed(email);
}

const text = (value: unknown, max: number) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

async function POSTHandler(request: Request) {
  const user = await getChatGPTUser();
  if (!user)
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  if (!isAdmin(user.email))
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body)
    return NextResponse.json(
      { error: 'Lead details are required.' },
      { status: 400 },
    );

  const name = text(body.name, 120);
  const company = text(body.company, 160);
  const email = text(body.email, 200).toLowerCase();
  const goals = parseGoals(body.goals);
  // Either the boxes or their words is enough. Most owners can say what they
  // want more of before they can describe the problem behind it.
  const need = text(body.need, 200) || goals.join(', ');
  if (!name || !company || !need)
    return NextResponse.json(
      {
        error:
          'Add their name, business, and what they want: tick a box or describe it.',
      },
      { status: 400 },
    );
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json(
      { error: 'Enter a valid email or leave it blank.' },
      { status: 400 },
    );

  const id = crypto.randomUUID();
  const db = getDb();
  await db.insert(opportunities).values({
    id,
    name,
    company,
    email,
    work: need,
    channel: text(body.channel, 160) || 'Added by hand',
    // A lead you added yourself has not answered the mapper. What they want is
    // recorded only if you ticked it, never invented on their behalf.
    desiredOutcome: goals.length ? goals.join(', ') : 'To be agreed',
    recommendation: 'To be scoped',
    summary: `${need} (added by ${user.displayName})`,
    source: 'manual',
    consentStatus: 'unknown',
    ownerId: user.userId,
    nextAction: text(body.nextAction, 200) || 'Have the first conversation',
    followUpAt: text(body.followUpAt, 10) || null,
  });

  await db
    .insert(auditEvents)
    .values({
      id: crypto.randomUUID(),
      actorId: user.userId,
      actorType: 'user',
      action: 'lead.added_by_hand',
      entityType: 'opportunity',
      entityId: id,
      details: { company },
    })
    .catch(() => null);

  return NextResponse.json({ id }, { status: 201 });
}

export const POST = withRequestLog('/api/admin/opportunities', POSTHandler);
