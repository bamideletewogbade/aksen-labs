import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { auditEvents, mediaEpisodes } from '@/db/schema';
import { adminEmailAllowed } from '@/lib/admin-policy';
import { boundedJson } from '@/lib/bounded-json';
import { cleanEpisodeInput } from '@/lib/media-episodes';
import { withRequestLog } from '@/lib/request-log';

async function requireAdmin() {
  const user = await getChatGPTUser();
  if (!user) return { error: NextResponse.json({ error: 'Sign in required.' }, { status: 401 }) };
  if (!adminEmailAllowed(user.email)) return { error: NextResponse.json({ error: 'Not authorized.' }, { status: 403 }) };
  return { user };
}

async function GETHandler() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  try {
    const episodes = await getDb().select().from(mediaEpisodes)
      .where(eq(mediaEpisodes.ownerId, auth.user.userId))
      .orderBy(desc(mediaEpisodes.updatedAt)).limit(50);
    return NextResponse.json({ episodes }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ error: 'Episode storage is unavailable. Apply the Media Studio migration.' }, { status: 503 });
  }
}

async function POSTHandler(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const body = await boundedJson(request, 32_000).catch(() => null);
  const input = cleanEpisodeInput(body);
  if (!input) return NextResponse.json({ error: 'Check the title, scenes, script and HTTPS sources.' }, { status: 400 });
  const id = crypto.randomUUID();
  try {
    const [episode] = await getDb().insert(mediaEpisodes).values({
      id, ownerId: auth.user.userId, ...input,
    }).returning();
    await getDb().insert(auditEvents).values({
      id: crypto.randomUUID(), actorId: auth.user.userId, actorType: 'user',
      action: 'media.episode_created', entityType: 'media_episode', entityId: id,
    }).catch(() => null);
    return NextResponse.json({ episode }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Episode could not be saved. Apply the Media Studio migration.' }, { status: 503 });
  }
}

async function PATCHHandler(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const body = await boundedJson(request, 32_000).catch(() => null) as Record<string, unknown> | null;
  const id = typeof body?.id === 'string' ? body.id : '';
  const input = cleanEpisodeInput(body);
  if (!id || !input) return NextResponse.json({ error: 'Check the episode fields.' }, { status: 400 });
  try {
    const [episode] = await getDb().update(mediaEpisodes).set({ ...input, status: 'draft', updatedAt: new Date() })
      .where(and(eq(mediaEpisodes.id, id), eq(mediaEpisodes.ownerId, auth.user.userId))).returning();
    if (!episode) return NextResponse.json({ error: 'Episode not found.' }, { status: 404 });
    return NextResponse.json({ episode });
  } catch {
    return NextResponse.json({ error: 'Episode could not be saved.' }, { status: 503 });
  }
}

async function DELETEHandler(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const body = await boundedJson(request, 1000).catch(() => null) as Record<string, unknown> | null;
  const id = typeof body?.id === 'string' ? body.id : '';
  if (!id) return NextResponse.json({ error: 'Episode id is required.' }, { status: 400 });
  try {
    const [deleted] = await getDb().delete(mediaEpisodes)
      .where(and(eq(mediaEpisodes.id, id), eq(mediaEpisodes.ownerId, auth.user.userId)))
      .returning({ id: mediaEpisodes.id });
    if (!deleted) return NextResponse.json({ error: 'Episode not found.' }, { status: 404 });
    return NextResponse.json({ id });
  } catch {
    return NextResponse.json({ error: 'Episode could not be removed.' }, { status: 503 });
  }
}

export const GET = withRequestLog('/api/admin/media/episodes', GETHandler);
export const POST = withRequestLog('/api/admin/media/episodes', POSTHandler);
export const PATCH = withRequestLog('/api/admin/media/episodes', PATCHHandler);
export const DELETE = withRequestLog('/api/admin/media/episodes', DELETEHandler);
