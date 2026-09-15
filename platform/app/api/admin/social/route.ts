import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { auditEvents } from '@/db/schema';
import { adminEmailAllowed } from '@/lib/admin-policy';
import { boundedJson } from '@/lib/bounded-json';
import { withRequestLog } from '@/lib/request-log';
import {
  cleanSocialWorkspace,
  socialProviders,
  socialWorkspace,
} from '@/lib/social-context';

async function requireAdmin() {
  const user = await getChatGPTUser();
  if (!user)
    return {
      error: NextResponse.json({ error: 'Sign in required.' }, { status: 401 }),
    };
  if (!adminEmailAllowed(user.email))
    return {
      error: NextResponse.json({ error: 'Not authorized.' }, { status: 403 }),
    };
  return { user };
}

async function GETHandler() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  return NextResponse.json(await socialWorkspace(auth.user.userId), {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}

async function PATCHHandler(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  let body: Record<string, unknown>;
  try {
    body = await boundedJson(request, 12_000);
  } catch {
    return NextResponse.json(
      { error: 'A valid Social Hub update is required.' },
      { status: 400 },
    );
  }

  const workspace = cleanSocialWorkspace(body);
  const emptyContext = Object.values(workspace.context).some((value) => !value);
  if (emptyContext)
    return NextResponse.json(
      { error: 'Complete every AI context field before saving.' },
      { status: 400 },
    );

  // Reject a non-empty URL that was cleaned away, rather than silently saving
  // an empty profile after a typo or a link to the wrong network.
  const rawProfiles =
    body.profiles && typeof body.profiles === 'object'
      ? (body.profiles as Record<string, unknown>)
      : {};
  for (const provider of socialProviders) {
    const raw = rawProfiles[provider];
    const supplied =
      typeof raw === 'string' ? Boolean(raw.trim()) : raw != null;
    if (supplied && !workspace.profiles[provider])
      return NextResponse.json(
        { error: `Use a valid HTTPS ${provider} profile URL.` },
        { status: 400 },
      );
  }

  const db = getDb();
  try {
    await db.execute(sql`
      INSERT INTO workspace_settings(owner_id,social_profiles,social_context)
      VALUES(
        ${auth.user.userId},
        ${JSON.stringify(workspace.profiles)}::jsonb,
        ${JSON.stringify(workspace.context)}::jsonb
      )
      ON CONFLICT(owner_id) DO UPDATE SET
        social_profiles=EXCLUDED.social_profiles,
        social_context=EXCLUDED.social_context,
        updated_at=now()`);
  } catch {
    return NextResponse.json(
      {
        error:
          'Social Hub could not save. Run scripts/migrate-social-hub.mjs once for this deployment.',
      },
      { status: 503 },
    );
  }

  await db
    .insert(auditEvents)
    .values({
      id: crypto.randomUUID(),
      actorId: auth.user.userId,
      actorType: 'user',
      action: 'social.context_updated',
      entityType: 'workspace',
      entityId: auth.user.userId,
      details: {
        profiles: socialProviders.filter(
          (provider) => workspace.profiles[provider],
        ),
      },
    })
    .catch(() => null);

  return NextResponse.json(workspace);
}

export const GET = withRequestLog('/api/admin/social', GETHandler);
export const PATCH = withRequestLog('/api/admin/social', PATCHHandler);
