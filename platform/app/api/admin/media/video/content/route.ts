import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { mediaRenderJobs } from '@/db/schema';
import { adminEmailAllowed } from '@/lib/admin-policy';
import { withRequestLog } from '@/lib/request-log';

async function GETHandler(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  if (!adminEmailAllowed(user.email)) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!/^[a-zA-Z0-9_-]{1,150}$/.test(id)) return NextResponse.json({ error: 'Invalid job id.' }, { status: 400 });
  try {
    const [job] = await getDb().select({ id: mediaRenderJobs.id, status: mediaRenderJobs.status })
      .from(mediaRenderJobs).where(and(eq(mediaRenderJobs.ownerId, user.userId), eq(mediaRenderJobs.providerJobId, id))).limit(1);
    if (!job || job.status !== 'completed') return NextResponse.json({ error: 'Video is not available.' }, { status: 404 });
    const range = request.headers.get('range');
    const upstream = await fetch(`https://openrouter.ai/api/v1/videos/${encodeURIComponent(id)}/content`, {
      headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY || ''}`, ...(range ? { Range: range } : {}) },
    });
    if (!upstream.ok || !upstream.body) return NextResponse.json({ error: 'Provider video is no longer available.' }, { status: 502 });
    const headers = new Headers({ 'Content-Type': upstream.headers.get('content-type') || 'video/mp4', 'Cache-Control': 'private, no-store', 'Content-Disposition': `inline; filename="aksen-${id}.mp4"` });
    for (const name of ['content-length', 'content-range', 'accept-ranges']) {
      const value = upstream.headers.get(name);
      if (value) headers.set(name, value);
    }
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch {
    return NextResponse.json({ error: 'Could not fetch the video.' }, { status: 502 });
  }
}

export const GET = withRequestLog('/api/admin/media/video/content', GETHandler);
