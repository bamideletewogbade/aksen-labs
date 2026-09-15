import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { adminEmailAllowed } from '@/lib/admin-policy';
import { isCadence } from '@/lib/automation-schedule';
import { draftEditorialIdea, runEditorialScout } from '@/lib/editorial-agent';
import { withRequestLog } from '@/lib/request-log';

async function owner() {
  const user = await getChatGPTUser();
  if (!user)
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: 'Sign in required.' },
        { status: 401 },
      ),
    };
  if (!adminEmailAllowed(user.email))
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: 'Not authorized.' },
        { status: 403 },
      ),
    };
  const db = getDb();
  await db.execute(sql`
    INSERT INTO editorial_settings(owner_id)
    VALUES(${user.userId})
    ON CONFLICT(owner_id) DO NOTHING`);
  return { ok: true as const, userId: user.userId, db };
}

async function GETHandler() {
  const auth = await owner();
  if (!auth.ok) return auth.response;
  const [settings, ideas, runs] = await Promise.all([
    auth.db.execute(
      sql`SELECT enabled,cadence,run_hour,auto_draft,last_scheduled_at,running_until FROM editorial_settings WHERE owner_id=${auth.userId}`,
    ),
    auth.db.execute(
      sql`SELECT id,title,angle,why_now,category,score,sources,status,post_id,created_at FROM editorial_ideas WHERE owner_id=${auth.userId} ORDER BY CASE status WHEN 'inbox' THEN 0 WHEN 'drafted' THEN 1 ELSE 2 END, score DESC, created_at DESC LIMIT 30`,
    ),
    auth.db.execute(
      sql`SELECT id,status,scheduled,found,note,created_at,finished_at FROM editorial_runs WHERE owner_id=${auth.userId} ORDER BY created_at DESC LIMIT 5`,
    ),
  ]);
  return NextResponse.json({
    settings: settings.rows[0],
    ideas: ideas.rows,
    runs: runs.rows,
  });
}

async function POSTHandler(request: Request) {
  const auth = await owner();
  if (!auth.ok) return auth.response;
  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  const action = body?.action;

  if (action === 'research') {
    const result = await runEditorialScout(auth.userId);
    return NextResponse.json(result);
  }
  if (action === 'draft' && typeof body?.id === 'string') {
    const postId = await draftEditorialIdea(auth.userId, body.id);
    return NextResponse.json({ postId });
  }
  if (
    (action === 'dismiss' || action === 'restore') &&
    typeof body?.id === 'string'
  ) {
    const status = action === 'dismiss' ? 'dismissed' : 'inbox';
    await auth.db.execute(
      sql`UPDATE editorial_ideas SET status=${status},updated_at=now() WHERE id=${body.id} AND owner_id=${auth.userId}`,
    );
    return NextResponse.json({ ok: true });
  }
  if (action === 'schedule') {
    const cadence = body?.cadence;
    const runHour = Number(body?.runHour);
    if (
      !isCadence(cadence) ||
      !Number.isInteger(runHour) ||
      runHour < 0 ||
      runHour > 23
    )
      return NextResponse.json(
        { error: 'Choose a valid cadence and hour.' },
        { status: 400 },
      );
    const enabled = cadence !== 'manual';
    const autoDraft = Boolean(body?.autoDraft);
    await auth.db.execute(sql`
      UPDATE editorial_settings
         SET enabled=${enabled}, cadence=${cadence}, run_hour=${runHour}, auto_draft=${autoDraft}, updated_at=now()
       WHERE owner_id=${auth.userId}`);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json(
    { error: 'Unknown editorial action.' },
    { status: 400 },
  );
}

export const GET = withRequestLog('/api/admin/editorial', GETHandler);
export const POST = withRequestLog('/api/admin/editorial', POSTHandler);
