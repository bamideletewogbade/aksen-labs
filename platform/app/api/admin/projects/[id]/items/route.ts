import { withRequestLog } from '@/lib/request-log';
import { adminEmailAllowed } from '@/lib/admin-policy';
import { and, asc, eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { auditEvents, projectItems, projects } from '@/db/schema';
import { boundedJson } from '@/lib/bounded-json';
import { isKind, isStatus } from '@/lib/project-items';
import { validDate } from '@/lib/workspace-rules';

const text = (value: unknown, limit: number) =>
  (typeof value === 'string' ? value : '').trim().slice(0, limit);

/**
 * Resolves the project only when it belongs to the signed-in workspace, so an
 * item can never be read from or attached to somebody else's project by id.
 */
async function ownedProject(id: string, owner: string) {
  const [row] = await getDb()
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.ownerId, owner)))
    .limit(1);
  return row?.id;
}

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

async function GETHandler(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;
  if (!(await ownedProject(id, auth.user.userId)))
    return NextResponse.json({ error: 'Project not found.' }, { status: 404 });

  const rows = await getDb()
    .select({
      id: projectItems.id,
      kind: projectItems.kind,
      title: projectItems.title,
      description: projectItems.description,
      status: projectItems.status,
      dueAt: projectItems.dueAt,
      evidence: projectItems.evidence,
    })
    .from(projectItems)
    .where(eq(projectItems.projectId, id))
    .orderBy(asc(projectItems.createdAt))
    .limit(100);

  return NextResponse.json(
    {
      items: rows.map((row) => ({
        ...row,
        dueAt: row.dueAt ? row.dueAt.toISOString().slice(0, 10) : null,
      })),
    },
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
  if (!(await ownedProject(id, auth.user.userId)))
    return NextResponse.json({ error: 'Project not found.' }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await boundedJson(request, 4000);
  } catch {
    return NextResponse.json(
      { error: 'A valid item is required.' },
      { status: 400 },
    );
  }

  const title = text(body.title, 200);
  if (!title)
    return NextResponse.json(
      { error: 'Give the item a title.' },
      { status: 400 },
    );
  if (!isKind(body.kind))
    return NextResponse.json(
      { error: 'Choose a task, deliverable, decision or risk.' },
      { status: 400 },
    );
  const due = text(body.dueAt, 10);
  if (due && !validDate(due))
    return NextResponse.json(
      { error: 'Use a real date in YYYY-MM-DD form.' },
      { status: 400 },
    );

  const itemId = crypto.randomUUID();
  const db = getDb();
  await db.insert(projectItems).values({
    id: itemId,
    projectId: id,
    kind: body.kind,
    title,
    description: text(body.description, 1000) || null,
    status: 'open',
    ownerId: auth.user.userId,
    dueAt: due ? new Date(`${due}T00:00:00Z`) : null,
  });
  await db
    .insert(auditEvents)
    .values({
      id: crypto.randomUUID(),
      actorId: auth.user.userId,
      actorType: 'user',
      action: 'project.item_added',
      entityType: 'project',
      entityId: id,
      details: { itemId, kind: body.kind },
    })
    .catch(() => null);

  return NextResponse.json(
    {
      id: itemId,
      kind: body.kind,
      title,
      description: text(body.description, 1000) || null,
      status: 'open',
      dueAt: due || null,
      evidence: null,
    },
    { status: 201 },
  );
}

async function PATCHHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;
  if (!(await ownedProject(id, auth.user.userId)))
    return NextResponse.json({ error: 'Project not found.' }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await boundedJson(request, 4000);
  } catch {
    return NextResponse.json(
      { error: 'A valid update is required.' },
      { status: 400 },
    );
  }

  const itemId = text(body.itemId, 100);
  if (!itemId)
    return NextResponse.json({ error: 'Which item?' }, { status: 400 });

  const patch: Record<string, unknown> = { updatedAt: sql`now()` };
  if (body.status !== undefined) {
    if (!isStatus(body.status))
      return NextResponse.json(
        { error: 'That is not an item status.' },
        { status: 400 },
      );
    patch.status = body.status;
  }
  if (body.evidence !== undefined)
    patch.evidence = text(body.evidence, 500) || null;
  if (patch.status === undefined && patch.evidence === undefined)
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });

  const db = getDb();
  const [updated] = await db
    .update(projectItems)
    .set(patch)
    // Scoped by project as well as item, so an id from another project cannot
    // be edited through a project this workspace does own.
    .where(and(eq(projectItems.id, itemId), eq(projectItems.projectId, id)))
    .returning({
      id: projectItems.id,
      status: projectItems.status,
      evidence: projectItems.evidence,
    });
  if (!updated)
    return NextResponse.json({ error: 'Item not found.' }, { status: 404 });

  await db
    .insert(auditEvents)
    .values({
      id: crypto.randomUUID(),
      actorId: auth.user.userId,
      actorType: 'user',
      action: 'project.item_updated',
      entityType: 'project',
      entityId: id,
      details: { itemId, ...(patch.status ? { status: patch.status } : {}) },
    })
    .catch(() => null);

  return NextResponse.json(updated);
}

/**
 * Removes one item. Tasks, deliverables, decisions and risks get added in a
 * hurry and sometimes to the wrong project, and until now every mistake stayed
 * on the plan for ever, where it either got worked or quietly ignored. Both
 * are worse than deleting it.
 *
 * A done deliverable carrying evidence is refused. That is a record of work
 * delivered and what proved it, and losing it silently is not a tidy-up. Marking
 * it open first is the way through, which is a deliberate moment of friction
 * rather than an obstacle.
 */
async function DELETEHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;
  if (!(await ownedProject(id, auth.user.userId)))
    return NextResponse.json({ error: 'Project not found.' }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await boundedJson(request, 1000);
  } catch {
    return NextResponse.json(
      { error: 'Say which item to remove.' },
      { status: 400 },
    );
  }
  const itemId = text(body.itemId, 100);
  if (!itemId)
    return NextResponse.json(
      { error: 'Say which item to remove.' },
      { status: 400 },
    );

  const db = getDb();
  const [existing] = await db
    .select({
      id: projectItems.id,
      kind: projectItems.kind,
      status: projectItems.status,
      evidence: projectItems.evidence,
    })
    .from(projectItems)
    .where(and(eq(projectItems.id, itemId), eq(projectItems.projectId, id)))
    .limit(1);
  if (!existing)
    return NextResponse.json({ error: 'Item not found.' }, { status: 404 });

  if (
    existing.kind === 'deliverable' &&
    existing.status === 'done' &&
    existing.evidence
  ) {
    return NextResponse.json(
      {
        error:
          'This deliverable is marked done and carries evidence of it. Set it back to open first if you really mean to remove the record.',
      },
      { status: 409 },
    );
  }

  const [removed] = await db
    .delete(projectItems)
    .where(and(eq(projectItems.id, itemId), eq(projectItems.projectId, id)))
    .returning({ id: projectItems.id });

  await db
    .insert(auditEvents)
    .values({
      id: crypto.randomUUID(),
      actorId: auth.user.userId,
      actorType: 'user',
      action: 'project.item_removed',
      entityType: 'project',
      entityId: id,
    })
    .catch(() => null);

  return NextResponse.json({ id: removed.id });
}

export const GET = withRequestLog('/api/admin/projects/[id]/items', GETHandler);
export const POST = withRequestLog(
  '/api/admin/projects/[id]/items',
  POSTHandler,
);
export const PATCH = withRequestLog(
  '/api/admin/projects/[id]/items',
  PATCHHandler,
);
export const DELETE = withRequestLog(
  '/api/admin/projects/[id]/items',
  DELETEHandler,
);
