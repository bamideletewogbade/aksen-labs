import { and, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { mediaEpisodes, mediaJevEvaluations } from '@/db/schema';
import { adminEmailAllowed } from '@/lib/admin-policy';
import { boundedJson } from '@/lib/bounded-json';
import { cleanJevOutcome, jevSummary } from '@/lib/media-jev';
import { withRequestLog } from '@/lib/request-log';

async function owner() {
  const user = await getChatGPTUser();
  if (!user) return { error: NextResponse.json({ error: 'Sign in required.' }, { status: 401 }) };
  if (!adminEmailAllowed(user.email)) return { error: NextResponse.json({ error: 'Not authorized.' }, { status: 403 }) };
  return { user };
}

async function GETHandler() {
  const auth = await owner();
  if (auth.error) return auth.error;
  try {
    const db = getDb();
    const rows = await db.select({ id: mediaJevEvaluations.id, referenceUrl: mediaJevEvaluations.referenceUrl,
      status: mediaJevEvaluations.status, provider: mediaJevEvaluations.provider, model: mediaJevEvaluations.model, promptVersion: mediaJevEvaluations.promptVersion,
      answers: mediaJevEvaluations.answers, suggestion: mediaJevEvaluations.suggestion, selectedAngle: mediaJevEvaluations.selectedAngle,
      outcome: mediaJevEvaluations.outcome, inputTokens: mediaJevEvaluations.inputTokens, outputTokens: mediaJevEvaluations.outputTokens,
      latencyMs: mediaJevEvaluations.latencyMs, costMicros: mediaJevEvaluations.costMicros, createdAt: mediaJevEvaluations.createdAt })
      .from(mediaJevEvaluations).where(eq(mediaJevEvaluations.ownerId, auth.user.userId))
      .orderBy(desc(mediaJevEvaluations.createdAt)).limit(100);
    const episodes = await db.select({ id: mediaEpisodes.id, title: mediaEpisodes.title, status: mediaEpisodes.status,
      originEvaluationId: mediaEpisodes.originEvaluationId }).from(mediaEpisodes)
      .where(eq(mediaEpisodes.ownerId, auth.user.userId)).orderBy(desc(mediaEpisodes.updatedAt)).limit(100);
    const episodeByEvaluation = new Map(episodes.filter((episode) => episode.originEvaluationId).map((episode) => [episode.originEvaluationId, episode]));
    return NextResponse.json({ summary: jevSummary(rows), evaluations: rows.map((row) => ({ ...row,
      episode: episodeByEvaluation.get(row.id) || null })) }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ error: 'Evaluation history is unavailable. Apply the Jev migration.' }, { status: 503 });
  }
}

async function PATCHHandler(request: Request) {
  const auth = await owner();
  if (auth.error) return auth.error;
  const body = await boundedJson(request, 3000).catch(() => null) as Record<string, unknown> | null;
  const id = typeof body?.id === 'string' ? body.id : '';
  const outcome = cleanJevOutcome(body?.outcome);
  if (!/^[a-f0-9-]{36}$/i.test(id) || !outcome) return NextResponse.json({ error: 'Invalid outcome.' }, { status: 400 });
  try {
    const [updated] = await getDb().update(mediaJevEvaluations).set({ outcome, updatedAt: new Date() })
      .where(and(eq(mediaJevEvaluations.id, id), eq(mediaJevEvaluations.ownerId, auth.user.userId)))
      .returning({ id: mediaJevEvaluations.id });
    return updated ? NextResponse.json({ saved: true }) : NextResponse.json({ error: 'Evaluation not found.' }, { status: 404 });
  } catch {
    return NextResponse.json({ error: 'Could not save this outcome.' }, { status: 503 });
  }
}

export const GET = withRequestLog('/api/admin/media/jev-evaluations', GETHandler);
export const PATCH = withRequestLog('/api/admin/media/jev-evaluations', PATCHHandler);
