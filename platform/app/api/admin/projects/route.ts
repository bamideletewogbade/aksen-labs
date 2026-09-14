import { withRequestLog } from '@/lib/request-log';
import { adminEmailAllowed } from '@/lib/admin-policy';
import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { auditEvents, projects } from '@/db/schema';

async function POSTHandler(request: Request) {
  const user = await getChatGPTUser();
  if (!user)
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  if (!adminEmailAllowed(user.email))
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  const body = (await request.json()) as Record<string, unknown>;
  const text = (value: unknown) =>
    typeof value === 'string' ? value.trim() : '';
  const name = text(body.name);
  const clientName = text(body.clientName);
  const objective = text(body.objective);
  if (!name || !clientName || !objective)
    return NextResponse.json(
      { error: 'Project, client and objective are required.' },
      { status: 400 },
    );
  const id = crypto.randomUUID();
  const db = getDb();
  await db.insert(projects).values({
    id,
    name: name.slice(0, 160),
    clientName: clientName.slice(0, 160),
    objective: objective.slice(0, 500),
    nextGate: 'Confirm discovery owner and baseline',
    ownerId: user.userId,
  });
  await db.insert(auditEvents).values({
    id: crypto.randomUUID(),
    actorId: user.userId,
    actorType: 'user',
    action: 'project.created',
    entityType: 'project',
    entityId: id,
  });
  return NextResponse.json({ id }, { status: 201 });
}

export const POST = withRequestLog('/api/admin/projects', POSTHandler);
