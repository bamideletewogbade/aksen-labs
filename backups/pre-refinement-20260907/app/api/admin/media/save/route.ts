import { NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { mediaAssets, auditEvents } from '@/db/schema';

function isAdmin(email: string) {
  const allowlist = (process.env.ADMIN_EMAILS || '').split(',').map((v) => v.trim().toLowerCase()).filter(Boolean);
  return !allowlist.length || allowlist.includes(email.toLowerCase());
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  if (!isAdmin(user.email)) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });

  const body = await request.json() as Record<string, unknown>;
  const kind = body.kind === 'image' || body.kind === 'video' ? body.kind : '';
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim().slice(0, 2000) : '';
  const model = typeof body.model === 'string' ? body.model.slice(0, 120) : 'unknown';
  const aspectRatio = typeof body.aspectRatio === 'string' ? body.aspectRatio.slice(0, 20) : null;
  const url = typeof body.url === 'string' ? body.url : '';
  const referenceCount = typeof body.referenceCount === 'number' ? Math.max(0, Math.min(4, Math.round(body.referenceCount))) : 0;
  if (!kind || !prompt || !url) return NextResponse.json({ error: 'kind, prompt and url are required.' }, { status: 400 });

  const id = crypto.randomUUID();
  const db = getDb();
  await db.insert(mediaAssets).values({ id, createdBy: user.userId, kind, prompt, model, aspectRatio, url, referenceCount });
  await db.insert(auditEvents).values({ id: crypto.randomUUID(), actorId: user.userId, actorType: 'user', action: `media.${kind}_saved`, entityType: 'media_asset', entityId: id }).catch(() => null);
  return NextResponse.json({ id }, { status: 201 });
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  if (!isAdmin(user.email)) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });

  const db = getDb();
  const rows = await db.select().from(mediaAssets).orderBy(desc(mediaAssets.createdAt)).limit(24);
  return NextResponse.json({ assets: rows });
}
