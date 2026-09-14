import { withRequestLog } from '@/lib/request-log';
import { adminEmailAllowed } from '@/lib/admin-policy';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { approvals, auditEvents, blogPosts } from '@/db/schema';

function isAdmin(email: string) {
  return adminEmailAllowed(email);
}

async function POSTHandler(request: Request) {
  const user = await getChatGPTUser();
  if (!user)
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  if (!isAdmin(user.email))
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });

  const body = (await request.json()) as Record<string, unknown>;
  const postId = typeof body.postId === 'string' ? body.postId : '';
  if (!postId)
    return NextResponse.json(
      { error: 'A post id is required.' },
      { status: 400 },
    );

  const db = getDb();
  const [post] = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.id, postId))
    .limit(1);
  if (!post)
    return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
  if (post.status === 'published')
    return NextResponse.json(
      { error: 'That article is already published.' },
      { status: 409 },
    );

  const [existing] = await db
    .select({ id: approvals.id })
    .from(approvals)
    .where(
      and(
        eq(approvals.entityType, 'blog_post'),
        eq(approvals.entityId, postId),
        eq(approvals.status, 'pending'),
      ),
    )
    .limit(1);
  if (existing)
    return NextResponse.json({
      id: existing.id,
      status: 'pending',
      duplicate: true,
    });

  const id = crypto.randomUUID();
  await db.insert(approvals).values({
    id,
    action: `Publish "${post.title}"`,
    context: `${post.category} by ${post.authorName}. Publishes at /blog/${post.slug} for this site's current audience.`,
    risk: 'medium',
    status: 'pending',
    requestedBy: user.userId,
    entityType: 'blog_post',
    entityId: postId,
  });

  await db
    .insert(auditEvents)
    .values({
      id: crypto.randomUUID(),
      actorId: user.userId,
      actorType: 'user',
      action: 'approval.requested',
      entityType: 'blog_post',
      entityId: postId,
      details: { approvalId: id },
    })
    .catch(() => null);
  return NextResponse.json({ id, status: 'pending' }, { status: 201 });
}

export const POST = withRequestLog('/api/admin/approvals/request', POSTHandler);
