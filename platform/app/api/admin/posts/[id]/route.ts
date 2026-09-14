import { withRequestLog } from '@/lib/request-log';
import { adminEmailAllowed } from '@/lib/admin-policy';
import { eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { auditEvents, blogPosts } from '@/db/schema';

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
  // Publishing runs through the approvals queue instead; taking something down stays immediate.
  if (body.status === 'published')
    return NextResponse.json(
      {
        error: 'Publishing needs an approved request. Use Request publication.',
      },
      { status: 409 },
    );
  const status = body.status === 'draft' ? body.status : '';
  if (!status)
    return NextResponse.json(
      { error: 'A valid status is required.' },
      { status: 400 },
    );

  const db = getDb();
  const [updated] = await db
    .update(blogPosts)
    .set({ status, publishedAt: null, updatedAt: sql`now()` })
    .where(eq(blogPosts.id, id))
    .returning({ id: blogPosts.id, status: blogPosts.status });
  if (!updated)
    return NextResponse.json({ error: 'Post not found.' }, { status: 404 });

  await db
    .insert(auditEvents)
    .values({
      id: crypto.randomUUID(),
      actorId: user.userId,
      actorType: 'user',
      action: `post.${status}`,
      entityType: 'blog_post',
      entityId: id,
    })
    .catch(() => null);
  return NextResponse.json({ id: updated.id, status: updated.status });
}

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
  const db = getDb();
  const [deleted] = await db
    .delete(blogPosts)
    .where(eq(blogPosts.id, id))
    .returning({ id: blogPosts.id });
  if (!deleted)
    return NextResponse.json({ error: 'Post not found.' }, { status: 404 });

  await db
    .insert(auditEvents)
    .values({
      id: crypto.randomUUID(),
      actorId: user.userId,
      actorType: 'user',
      action: 'post.deleted',
      entityType: 'blog_post',
      entityId: id,
    })
    .catch(() => null);
  return NextResponse.json({ id: deleted.id });
}

export const PATCH = withRequestLog('/api/admin/posts/[id]', PATCHHandler);

export const DELETE = withRequestLog('/api/admin/posts/[id]', DELETEHandler);
