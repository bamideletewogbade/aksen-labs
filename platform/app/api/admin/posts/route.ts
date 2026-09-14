import { withRequestLog } from '@/lib/request-log';
import { adminEmailAllowed } from '@/lib/admin-policy';
import { desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { auditEvents, blogPosts } from '@/db/schema';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);

function isAdmin(email: string) {
  return adminEmailAllowed(email);
}

async function GETHandler() {
  const user = await getChatGPTUser();
  if (!user)
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  if (!isAdmin(user.email))
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });

  const db = getDb();
  const posts = await db
    .select()
    .from(blogPosts)
    .orderBy(desc(blogPosts.updatedAt))
    .limit(30);
  return NextResponse.json({ posts });
}

async function POSTHandler(request: Request) {
  const user = await getChatGPTUser();
  if (!user)
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  if (!adminEmailAllowed(user.email))
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  const body = (await request.json()) as Record<string, unknown>;
  if (body.status === 'published')
    return NextResponse.json(
      { error: 'Save a draft, then request publication for review.' },
      { status: 409 },
    );
  const text = (value: unknown, fallback = '') =>
    typeof value === 'string' ? value.trim() : fallback;
  const title = text(body.title);
  const excerpt = text(body.excerpt);
  const content = text(body.content);
  const category = text(body.category, 'AI in Practice');
  if (!title || !excerpt || !content)
    return NextResponse.json(
      { error: 'Title, summary and article are required.' },
      { status: 400 },
    );
  const id = crypto.randomUUID();
  const status = 'draft';
  const db = getDb();
  await db.insert(blogPosts).values({
    id,
    title: title.slice(0, 180),
    slug: `${slugify(title)}-${id.slice(0, 6)}`,
    excerpt: excerpt.slice(0, 400),
    content: content.slice(0, 30000),
    category: category.slice(0, 80),
    status,
    authorName: user.fullName || user.displayName,
    authorId: user.userId,
    publishedAt: null,
    readingMinutes: Math.max(1, Math.ceil(content.split(/\s+/).length / 220)),
  });
  await db.insert(auditEvents).values({
    id: crypto.randomUUID(),
    actorId: user.userId,
    actorType: 'user',
    action: `post.${status}`,
    entityType: 'blog_post',
    entityId: id,
  });
  return NextResponse.json({ id }, { status: 201 });
}

export const GET = withRequestLog('/api/admin/posts', GETHandler);

export const POST = withRequestLog('/api/admin/posts', POSTHandler);
