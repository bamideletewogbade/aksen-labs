import { withRequestLog } from '@/lib/request-log';
import { adminEmailAllowed } from '@/lib/admin-policy';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { auditEvents, conversations } from '@/db/schema';

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
  const body = (await request.json()) as Record<string, unknown>;
  const status =
    body.status === 'resolved' || body.status === 'open' ? body.status : '';
  if (!status)
    return NextResponse.json(
      { error: 'A valid status is required.' },
      { status: 400 },
    );

  const db = getDb();
  const [updated] = await db
    .update(conversations)
    .set({ status, updatedAt: new Date() })
    .where(eq(conversations.id, id))
    .returning({ id: conversations.id, status: conversations.status });
  if (!updated)
    return NextResponse.json(
      { error: 'Conversation not found.' },
      { status: 404 },
    );

  await db
    .insert(auditEvents)
    .values({
      id: crypto.randomUUID(),
      actorId: user.userId,
      actorType: 'user',
      action: `conversation.${status}`,
      entityType: 'conversation',
      entityId: id,
    })
    .catch(() => null);
  return NextResponse.json({ id: updated.id, status: updated.status });
}

export const PATCH = withRequestLog(
  '/api/admin/conversations/[id]',
  PATCHHandler,
);
