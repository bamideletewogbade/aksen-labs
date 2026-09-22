import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { auditEvents, mediaEpisodes } from '@/db/schema';
import { adminEmailAllowed } from '@/lib/admin-policy';
import { boundedJson } from '@/lib/bounded-json';
import { CHANNELS, cleanEpisodeInput, type EpisodeInput } from '@/lib/media-episodes';
import { withRequestLog } from '@/lib/request-log';

async function POSTHandler(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  if (!adminEmailAllowed(user.email)) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  const body = await boundedJson(request, 100_000).catch(() => null) as Record<string, unknown> | null;
  const id = typeof body?.id === 'string' ? body.id : '';
  const action = body?.action;
  if (!/^[a-zA-Z0-9-]{1,100}$/.test(id) || (action !== 'submit' && action !== 'approve' && action !== 'reopen')) {
    return NextResponse.json({ error: 'Invalid review action.' }, { status: 400 });
  }
  try {
    const db = getDb();
    const [episode] = await db.select().from(mediaEpisodes).where(and(eq(mediaEpisodes.id, id), eq(mediaEpisodes.ownerId, user.userId))).limit(1);
    if (!episode) return NextResponse.json({ error: 'Episode not found.' }, { status: 404 });
    const currentDraft = cleanEpisodeInput(body?.currentDraft);
    const saved = { title: episode.title, topic: episode.topic, script: episode.script, scenes: episode.scenes, sources: episode.sources, aspectRatio: episode.aspectRatio, channelPosts: episode.channelPosts, proofChecks: episode.proofChecks, originEvaluationId: episode.originEvaluationId };
    if (!currentDraft || JSON.stringify(currentDraft) !== JSON.stringify(cleanEpisodeInput(saved))) return NextResponse.json({ error: 'Save your latest changes before review.' }, { status: 409 });
    const scenes = episode.scenes as EpisodeInput['scenes'];
    const posts = episode.channelPosts as EpisodeInput['channelPosts'];
    const proofChecks = episode.proofChecks as EpisodeInput['proofChecks'];
    if (action === 'submit' && episode.status !== 'draft') return NextResponse.json({ error: 'Save a draft before submitting it.' }, { status: 409 });
    if (action === 'approve' && episode.status !== 'in_review') return NextResponse.json({ error: 'Submit this episode for review first.' }, { status: 409 });
    if (action !== 'reopen') {
      const blockers = [
        !episode.script.trim() ? 'Add a spoken script.' : '',
        !scenes.length ? 'Add at least one scene.' : '',
        ...scenes.filter((scene) => !scene.asset).map((_, index) => `Scene ${index + 1} needs an asset.`),
        !CHANNELS.some((channel) => posts?.[channel]?.caption) ? 'Write at least one channel caption.' : '',
        ...proofChecks.filter((check) => check.status === 'open').map((check) => `Resolve proof check: ${check.question}`),
      ].filter(Boolean);
      if (blockers.length) return NextResponse.json({ error: 'Complete the episode before review.', blockers }, { status: 409 });
    }
    const status = action === 'submit' ? 'in_review' : action === 'approve' ? 'approved' : 'draft';
    const [updated] = await db.update(mediaEpisodes).set({ status, updatedAt: new Date() })
      .where(and(eq(mediaEpisodes.id, id), eq(mediaEpisodes.ownerId, user.userId), eq(mediaEpisodes.status, episode.status))).returning();
    if (!updated) return NextResponse.json({ error: 'The episode changed. Reload and try again.' }, { status: 409 });
    await db.insert(auditEvents).values({ id: crypto.randomUUID(), actorId: user.userId, actorType: 'user', action: `media.episode_${status}`, entityType: 'media_episode', entityId: id }).catch(() => null);
    return NextResponse.json({ episode: updated });
  } catch {
    return NextResponse.json({ error: 'Could not update episode review.' }, { status: 503 });
  }
}

export const POST = withRequestLog('/api/admin/media/episodes/review', POSTHandler);
