import { withRequestLog } from '@/lib/request-log';
import { adminEmailAllowed } from '@/lib/admin-policy';
import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { mediaAssets, auditEvents } from '@/db/schema';

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
  const kind = body.kind === 'image' || body.kind === 'video' ? body.kind : '';
  const prompt =
    typeof body.prompt === 'string' ? body.prompt.trim().slice(0, 2000) : '';
  const model =
    typeof body.model === 'string' ? body.model.slice(0, 120) : 'unknown';
  const aspectRatio =
    typeof body.aspectRatio === 'string' ? body.aspectRatio.slice(0, 20) : null;
  const url = typeof body.url === 'string' ? body.url : '';
  const referenceCount =
    typeof body.referenceCount === 'number'
      ? Math.max(0, Math.min(4, Math.round(body.referenceCount)))
      : 0;
  if (!kind || !prompt || !url)
    return NextResponse.json(
      { error: 'kind, prompt and url are required.' },
      { status: 400 },
    );

  const id = crypto.randomUUID();
  const db = getDb();
  await db.insert(mediaAssets).values({
    id,
    createdBy: user.userId,
    kind,
    prompt,
    model,
    aspectRatio,
    url,
    referenceCount,
  });
  await db
    .insert(auditEvents)
    .values({
      id: crypto.randomUUID(),
      actorId: user.userId,
      actorType: 'user',
      action: `media.${kind}_saved`,
      entityType: 'media_asset',
      entityId: id,
    })
    .catch(() => null);
  return NextResponse.json({ id }, { status: 201 });
}

async function GETHandler() {
  const user = await getChatGPTUser();
  if (!user)
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  if (!isAdmin(user.email))
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });

  const db = getDb();
  const rows = await db
    .select()
    .from(mediaAssets)
    .orderBy(desc(mediaAssets.createdAt))
    .limit(24);
  return NextResponse.json({ assets: rows });
}

/**
 * Removes a generated asset from the gallery.
 *
 * Generation produces plenty that is simply wrong, and the gallery had no way
 * to drop any of it: the only lever was to make more and push the bad ones past
 * the twenty-four row limit, where they stayed in the table for ever. Image
 * data is stored inline, so this is the one place in the admin where deleting
 * genuinely reclaims space.
 *
 * A hard delete, because a rejected image is not a business record. What is
 * kept is the audit line saying it was removed and who removed it.
 */
async function DELETEHandler(request: Request) {
  const user = await getChatGPTUser();
  if (!user)
    return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  if (!isAdmin(user.email))
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  const id = typeof body?.id === 'string' ? body.id.slice(0, 100) : '';
  if (!id)
    return NextResponse.json(
      { error: 'Say which asset to remove.' },
      { status: 400 },
    );

  const db = getDb();
  const [removed] = await db
    .delete(mediaAssets)
    .where(eq(mediaAssets.id, id))
    .returning({ id: mediaAssets.id, kind: mediaAssets.kind });
  if (!removed)
    return NextResponse.json({ error: 'Asset not found.' }, { status: 404 });

  await db
    .insert(auditEvents)
    .values({
      id: crypto.randomUUID(),
      actorId: user.userId,
      actorType: 'user',
      action: `media.${removed.kind}_removed`,
      entityType: 'media_asset',
      entityId: id,
    })
    .catch(() => null);

  return NextResponse.json({ id: removed.id });
}

export const POST = withRequestLog('/api/admin/media/save', POSTHandler);

export const GET = withRequestLog('/api/admin/media/save', GETHandler);

export const DELETE = withRequestLog('/api/admin/media/save', DELETEHandler);
