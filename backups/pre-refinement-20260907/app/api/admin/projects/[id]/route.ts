import { eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { auditEvents, projects } from '@/db/schema';
import { PROJECT_STAGES } from '@/lib/project-stages';

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

  const patch: Record<string, unknown> = { updatedAt: sql`now()` };

  if (body.stage !== undefined) {
    const stage = String(body.stage);
    if (!PROJECT_STAGES.includes(stage as typeof PROJECT_STAGES[number])) {
      return NextResponse.json({ error: 'That is not a project stage.' }, { status: 400 });
    }
    patch.stage = stage;
  }

  if (body.nextGate !== undefined) {
    const gate = String(body.nextGate).trim().slice(0, 200);
    if (!gate) return NextResponse.json({ error: 'A next gate cannot be empty.' }, { status: 400 });
    patch.nextGate = gate;
  }

  if (patch.stage === undefined && patch.nextGate === undefined) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  }

  const db = getDb();
  const [updated] = await db.update(projects).set(patch).where(eq(projects.id, id))
    .returning({ id: projects.id, stage: projects.stage, nextGate: projects.nextGate });
  if (!updated) return NextResponse.json({ error: 'Project not found.' }, { status: 404 });

  await db.insert(auditEvents).values({
    id: crypto.randomUUID(), actorId: user.userId, actorType: 'user',
    action: patch.stage ? `project.${patch.stage}` : 'project.gate_set',
    entityType: 'project', entityId: id,
    details: patch.stage ? { stage: patch.stage } : { nextGate: patch.nextGate },
  }).catch(() => null);

  return NextResponse.json(updated);
}
