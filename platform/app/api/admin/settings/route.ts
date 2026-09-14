import { withRequestLog } from '@/lib/request-log';
import { adminEmailAllowed } from '@/lib/admin-policy';
import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { auditEvents } from '@/db/schema';
import { boundedJson } from '@/lib/bounded-json';
import {
  cleanName,
  displayNameLimit,
  fullNameLimit,
  workspaceProfile,
} from '@/lib/workspace-settings';

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
  const profile = await workspaceProfile(auth.user.userId);
  return NextResponse.json(
    {
      displayName: profile?.displayName ?? '',
      fullName: profile?.fullName ?? '',
      email: auth.user.email,
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}

async function PATCHHandler(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  let body: Record<string, unknown>;
  try {
    body = await boundedJson(request, 2000);
  } catch {
    return NextResponse.json(
      { error: 'A valid update is required.' },
      { status: 400 },
    );
  }

  const fullName = cleanName(body.fullName, fullNameLimit);
  const displayName = cleanName(body.displayName, displayNameLimit);
  // One of the two is enough. Requiring both would mean anyone with a single
  // name could not fill the form in, which is most of the world.
  if (!fullName && !displayName)
    return NextResponse.json(
      { error: 'Give a name to be addressed by.' },
      { status: 400 },
    );

  const db = getDb();
  try {
    await db.execute(
      sql`INSERT INTO workspace_settings(owner_id,display_name,full_name)
          VALUES(${auth.user.userId},${displayName || null},${fullName || null})
          ON CONFLICT(owner_id) DO UPDATE
            SET display_name=EXCLUDED.display_name,
                full_name=EXCLUDED.full_name,
                updated_at=now()`,
    );
  } catch {
    // Named rather than generic, because the likely cause is one specific
    // thing: the migration has not been run against this database.
    return NextResponse.json(
      {
        error:
          'Settings could not be saved. If this is a new deployment, run scripts/migrate-settings.mjs first.',
      },
      { status: 503 },
    );
  }

  // The names themselves are not written to the audit trail. safeLogDetails
  // would drop them anyway, and a record that someone changed their own name
  // is the useful part, not what it was before.
  await db
    .insert(auditEvents)
    .values({
      id: crypto.randomUUID(),
      actorId: auth.user.userId,
      actorType: 'user',
      action: 'settings.profile_updated',
      entityType: 'workspace',
      entityId: auth.user.userId,
    })
    .catch(() => null);

  return NextResponse.json({ displayName, fullName });
}

export const GET = withRequestLog('/api/admin/settings', GETHandler);
export const PATCH = withRequestLog('/api/admin/settings', PATCHHandler);
