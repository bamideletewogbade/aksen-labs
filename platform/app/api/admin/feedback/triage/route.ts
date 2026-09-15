import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { auditEvents } from '@/db/schema';
import { adminEmailAllowed } from '@/lib/admin-policy';
import { boundedJson } from '@/lib/bounded-json';
import {
  asDate,
  asText,
  runFeedbackTriage,
  triageDue,
} from '@/lib/feedback-triage';
import { withRequestLog } from '@/lib/request-log';

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
  return { email: user.email };
}

async function GETHandler() {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  const db = getDb();
  const [row] = (
    await db.execute(
      // `running` is decided by Postgres. The lock is taken and released against
      // the database clock, so reading it against this server's would be
      // comparing two clocks that can disagree.
      sql`SELECT enabled, max_per_day, last_run_at, last_note,
                 (running_until IS NOT NULL AND running_until > now()) AS running
            FROM feedback_triage_settings WHERE id='default'`,
    )
  ).rows;
  const verdict = await triageDue();

  return NextResponse.json({
    // A deployment that has not run the migration says so plainly rather than
    // rendering a toggle that saves nowhere.
    configured: Boolean(row),
    enabled: Boolean(row?.enabled),
    maxPerDay: Number(row?.max_per_day ?? 40),
    lastRunAt: asDate(row?.last_run_at)?.toISOString() ?? null,
    lastNote: asText(row?.last_note),
    running: Boolean(row?.running),
    waiting: verdict.due ? verdict.waiting : 0,
    reason: verdict.due ? null : verdict.reason,
  });
}

async function POSTHandler(request: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  let input: Record<string, unknown>;
  try {
    input = await boundedJson(request, 500);
  } catch {
    return NextResponse.json(
      { error: 'A valid JSON body is required.' },
      { status: 400 },
    );
  }

  const db = getDb();

  if (input.action === 'run') {
    // The button ignores the schedule but not the lock or the ceiling, both of
    // which live inside the run. Pressing it twice cannot double the spend.
    const result = await runFeedbackTriage({ scheduled: false });
    await db
      .insert(auditEvents)
      .values({
        id: crypto.randomUUID(),
        actorId: gate.email,
        actorType: 'admin',
        action: 'feedback.triage_run',
        entityType: 'feedback_triage',
        entityId: 'default',
        details: { reviewed: result.reviewed, flagged: result.flagged },
      })
      .catch(() => null);
    return NextResponse.json(result);
  }

  if (input.action === 'settings') {
    const enabled = Boolean(input.enabled);
    // Clamped rather than validated with an error: the field is a number input
    // in an admin, and a ceiling of 500 is a typo, not a request.
    const maxPerDay = Math.min(
      200,
      Math.max(1, Math.floor(Number(input.maxPerDay) || 40)),
    );
    const saved = await db.execute(sql`
      UPDATE feedback_triage_settings
         SET enabled = ${enabled}, max_per_day = ${maxPerDay}, updated_at = now()
       WHERE id = 'default' RETURNING id`);
    if (!saved.rows.length)
      return NextResponse.json(
        {
          error:
            'Triage settings are missing. Run scripts/migrate-feedback-triage.mjs on this deployment.',
        },
        { status: 503 },
      );
    await db
      .insert(auditEvents)
      .values({
        id: crypto.randomUUID(),
        actorId: gate.email,
        actorType: 'admin',
        action: 'feedback.triage_settings',
        entityType: 'feedback_triage',
        entityId: 'default',
        details: { enabled, maxPerDay },
      })
      .catch(() => null);
    return NextResponse.json({ status: 'ok', enabled, maxPerDay });
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
}

export const GET = withRequestLog('/api/admin/feedback/triage', GETHandler);
export const POST = withRequestLog('/api/admin/feedback/triage', POSTHandler);
