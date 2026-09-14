import { withRequestLog } from '@/lib/request-log';
import { adminEmailAllowed } from '@/lib/admin-policy';
import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { generateImage } from '@/lib/openrouter';
import { logAgentRun } from '@/lib/agent-runs';
import { getDb } from '@/db';
import { auditEvents, mediaAssets } from '@/db/schema';

const MAX_REFERENCE_BYTES = 8 * 1024 * 1024;
const ASPECT_RATIOS = new Set(['1:1', '16:9', '9:16', '4:3', '3:4']);

async function POSTHandler(request: Request) {
  const user = await getChatGPTUser();
  if (!user)
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  if (!adminEmailAllowed(user.email))
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });

  const body = (await request.json()) as Record<string, unknown>;
  const prompt =
    typeof body.prompt === 'string' ? body.prompt.trim().slice(0, 2000) : '';
  if (!prompt)
    return NextResponse.json(
      { error: 'A prompt is required.' },
      { status: 400 },
    );

  const aspectRatio =
    typeof body.aspectRatio === 'string' && ASPECT_RATIOS.has(body.aspectRatio)
      ? body.aspectRatio
      : undefined;
  const referenceUrls = Array.isArray(body.referenceImages)
    ? body.referenceImages.filter((v): v is string => typeof v === 'string')
    : [];
  for (const ref of referenceUrls) {
    if (ref.length > MAX_REFERENCE_BYTES)
      return NextResponse.json(
        { error: 'A reference image is too large. Keep each one under 8MB.' },
        { status: 400 },
      );
  }
  if (referenceUrls.length > 4)
    return NextResponse.json(
      { error: 'Use at most 4 reference images.' },
      { status: 400 },
    );

  const startedAt = Date.now();
  try {
    const image = await generateImage({
      prompt,
      aspectRatio,
      referenceImages: referenceUrls.map((url) => ({ url })),
    });
    const dataUrl = `data:${image.mediaType};base64,${image.base64}`;
    const db = getDb();
    const assetId = crypto.randomUUID();
    await db
      .insert(mediaAssets)
      .values({
        id: assetId,
        createdBy: user.userId,
        kind: 'image',
        prompt,
        model: image.model,
        aspectRatio: aspectRatio || null,
        url: dataUrl,
        referenceCount: referenceUrls.length,
      })
      .catch(() => null);
    await db
      .insert(auditEvents)
      .values({
        id: crypto.randomUUID(),
        actorId: user.userId,
        actorType: 'user',
        action: 'media.image_generated',
        entityType: 'media_asset',
        entityId: assetId,
        details: { model: image.model, referenceCount: referenceUrls.length },
      })
      .catch(() => null);
    await logAgentRun({
      agentName: 'Creative Studio (image)',
      channel: 'admin',
      status: 'success',
      outcome: prompt.slice(0, 160),
      durationMs: Date.now() - startedAt,
      costMicros: image.costMicros,
    });
    return NextResponse.json({ id: assetId, dataUrl, model: image.model });
  } catch {
    await logAgentRun({
      agentName: 'Creative Studio (image)',
      channel: 'admin',
      status: 'error',
      outcome: 'Generation failed',
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json(
      {
        error:
          'The image could not be generated right now. Try a simpler prompt or fewer reference images.',
      },
      { status: 502 },
    );
  }
}

export const POST = withRequestLog('/api/admin/media/image', POSTHandler);
