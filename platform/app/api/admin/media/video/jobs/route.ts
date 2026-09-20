import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { mediaRenderJobs } from '@/db/schema';
import { adminEmailAllowed } from '@/lib/admin-policy';
import { withRequestLog } from '@/lib/request-log';

async function GETHandler() {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  if (!adminEmailAllowed(user.email)) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  try {
    const jobs = await getDb().select({
      id: mediaRenderJobs.providerJobId, status: mediaRenderJobs.status,
      prompt: mediaRenderJobs.prompt, model: mediaRenderJobs.model,
      createdAt: mediaRenderJobs.createdAt, error: mediaRenderJobs.error,
      costMicros: mediaRenderJobs.costMicros,
    }).from(mediaRenderJobs).where(eq(mediaRenderJobs.ownerId, user.userId))
      .orderBy(desc(mediaRenderJobs.createdAt)).limit(20);
    return NextResponse.json({ jobs }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ error: 'Render history is unavailable. Apply the Media Studio migration.' }, { status: 503 });
  }
}

export const GET = withRequestLog('/api/admin/media/video/jobs', GETHandler);
