import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { submitVideo, DEFAULT_VIDEO_MODEL } from '@/lib/openrouter';
import { logAgentRun } from '@/lib/agent-runs';
import { getDb } from '@/db';
import { auditEvents } from '@/db/schema';

const MAX_REFERENCE_BYTES = 8 * 1024 * 1024;
const DURATIONS = new Set([4, 5, 8, 10, 15]);
const ASPECT_RATIOS = new Set(['1:1', '16:9', '9:16', '4:3', '3:4']);

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  const allowlist = (process.env.ADMIN_EMAILS || '').split(',').map((v) => v.trim().toLowerCase()).filter(Boolean);
  if (allowlist.length && !allowlist.includes(user.email.toLowerCase())) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });

  const body = await request.json() as Record<string, unknown>;
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim().slice(0, 2000) : '';
  if (!prompt) return NextResponse.json({ error: 'A prompt is required.' }, { status: 400 });

  const duration = typeof body.duration === 'number' && DURATIONS.has(body.duration) ? body.duration : undefined;
  const aspectRatio = typeof body.aspectRatio === 'string' && ASPECT_RATIOS.has(body.aspectRatio) ? body.aspectRatio : undefined;
  const referenceUrls = Array.isArray(body.referenceImages) ? body.referenceImages.filter((v): v is string => typeof v === 'string') : [];
  for (const ref of referenceUrls) {
    if (ref.length > MAX_REFERENCE_BYTES) return NextResponse.json({ error: 'A reference image is too large. Keep each one under 8MB.' }, { status: 400 });
  }
  if (referenceUrls.length > 4) return NextResponse.json({ error: 'Use at most 4 reference images.' }, { status: 400 });

  const startedAt = Date.now();
  try {
    const job = await submitVideo({
      prompt,
      duration,
      aspectRatio,
      referenceImages: referenceUrls.map((url) => ({ url })),
    });
    const db = getDb();
    await db.insert(auditEvents).values({ id: crypto.randomUUID(), actorId: user.userId, actorType: 'user', action: 'media.video_submitted', entityType: 'media', entityId: job.id, details: { referenceCount: referenceUrls.length } }).catch(() => null);
    await logAgentRun({ agentName: 'Creative Studio (video)', channel: 'admin', status: 'success', outcome: `Job submitted: ${prompt.slice(0, 140)}`, durationMs: Date.now() - startedAt });
    return NextResponse.json({ id: job.id, pollingUrl: job.pollingUrl, status: job.status, model: DEFAULT_VIDEO_MODEL });
  } catch {
    await logAgentRun({ agentName: 'Creative Studio (video)', channel: 'admin', status: 'error', outcome: 'Job submission failed', durationMs: Date.now() - startedAt });
    return NextResponse.json({ error: 'The video job could not be started right now.' }, { status: 502 });
  }
}
