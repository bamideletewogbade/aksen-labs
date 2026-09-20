import { withRequestLog } from '@/lib/request-log';
import { adminEmailAllowed } from '@/lib/admin-policy';
import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { pollVideo } from '@/lib/openrouter';
import { getDb } from '@/db';
import { mediaRenderJobs } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

async function GETHandler(request: Request) {
  const user = await getChatGPTUser();
  if (!user)
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  if (!adminEmailAllowed(user.email))
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });

  const id = new URL(request.url).searchParams.get('id') || '';
  if (!/^[a-zA-Z0-9_-]{1,150}$/.test(id))
    return NextResponse.json(
      { error: 'A valid job id is required.' },
      { status: 400 },
    );

  try {
    const db = getDb();
    const [job] = await db.select().from(mediaRenderJobs)
      .where(and(eq(mediaRenderJobs.providerJobId, id), eq(mediaRenderJobs.ownerId, user.userId))).limit(1);
    if (!job) return NextResponse.json({ error: 'Render job not found.' }, { status: 404 });
    if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled' || job.status === 'expired')
      return NextResponse.json({ status: job.status, url: job.status === 'completed' ? `/api/admin/media/video/content?id=${encodeURIComponent(id)}` : undefined, error: job.error });
    const status = await pollVideo(`https://openrouter.ai/api/v1/videos/${encodeURIComponent(id)}`);
    const final = ['completed', 'failed', 'cancelled', 'expired'].includes(status.status);
    await db.update(mediaRenderJobs).set({
      status: status.status,
      ...(final ? { outputUrl: status.unsignedUrls?.[0] || null, error: status.error || null } : {}),
      ...(typeof status.costMicros === 'number' ? { costMicros: status.costMicros } : {}),
      updatedAt: new Date(),
    }).where(eq(mediaRenderJobs.id, job.id));
    return NextResponse.json({ status: status.status, url: status.status === 'completed' ? `/api/admin/media/video/content?id=${encodeURIComponent(id)}` : undefined, error: status.error });
  } catch {
    return NextResponse.json(
      { error: 'Could not check the video status right now.' },
      { status: 502 },
    );
  }
}

export const GET = withRequestLog('/api/admin/media/video/status', GETHandler);
