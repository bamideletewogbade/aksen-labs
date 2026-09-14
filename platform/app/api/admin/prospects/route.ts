import { sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { workspaceUser } from '@/lib/workspace-access';
import { withRequestLog } from '@/lib/request-log';
import { boundedJson } from '@/lib/bounded-json';
import {
  runProspecting,
  promoteProspectQuery,
  reviewProspectQuery,
  type ProspectProgress,
} from '@/lib/prospecting';
import {
  dailyResearchRuns,
  remainingResearchRuns,
  targetMinLength,
  targetMaxLength,
} from '@/lib/scout-limits';
import { describeSchedule, isCadence } from '@/lib/automation-schedule';

function streamProspecting(
  ownerId: string,
  campaignId: string,
  options: { leadId?: string } = {},
) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (value: Record<string, unknown> | ProspectProgress) => {
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(value)}\n`));
        } catch {
          // A closed browser must not invalidate the database-backed run.
        }
      };
      void runProspecting(ownerId, campaignId, {
        ...options,
        onProgress: (event) => send({ type: 'progress', ...event }),
      })
        .then((result) => send({ type: 'complete', ...result }))
        .catch((error: unknown) =>
          send({
            type: 'error',
            error:
              error instanceof Error
                ? error.message
                : 'The agent run could not complete.',
          }),
        )
        .finally(() => {
          try {
            controller.close();
          } catch {
            // The client may have disconnected after the run was stored.
          }
        });
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'X-Accel-Buffering': 'no',
    },
  });
}

async function get() {
  let user;
  try {
    user = await workspaceUser();
  } catch {
    return Response.json({ error: 'Admin access required.' }, { status: 403 });
  }
  try {
    const db = getDb();
    const [campaign, leads, runs, events, usage] = await Promise.all([
      db.execute(
        sql`SELECT id,target,enabled,next_run_at,running_until,cadence,run_hour,max_per_day,last_scheduled_at FROM prospect_campaigns WHERE owner_id=${user.userId}`,
      ),
      db.execute(
        sql`SELECT * FROM prospect_leads WHERE owner_id=${user.userId} ORDER BY updated_at DESC LIMIT 100`,
      ),
      db.execute(
        sql`SELECT id,status,found,note,created_at,finished_at FROM prospect_runs WHERE owner_id=${user.userId} ORDER BY created_at DESC LIMIT 15`,
      ),
      db.execute(
        sql`SELECT id,run_id,stage,status,message,details,created_at FROM prospect_run_events WHERE owner_id=${user.userId} ORDER BY created_at DESC LIMIT 120`,
      ),
      db.execute(
        sql`SELECT requests FROM workspace_demo_usage WHERE bucket=${`scout-${user.userId}-${new Date().toISOString().slice(0, 10)}`}`,
      ),
    ]);
    return Response.json(
      {
        campaign: campaign.rows[0] || null,
        leads: leads.rows,
        runs: runs.rows,
        events: events.rows,
        aiConfigured: !!process.env.OPENROUTER_API_KEY,
        // null means uncapped, which the interface reports as words rather than
        // as a number that would otherwise read as zero runs left.
        remainingRuns: remainingResearchRuns(
          Number(usage.rows[0]?.requests || 0),
        ),
        dailyRuns: dailyResearchRuns(),
        targetMaxLength,
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch {
    return Response.json(
      {
        error:
          'Lead Scout database unavailable. Check the prospecting migration and connection.',
      },
      { status: 503 },
    );
  }
}
async function post(request: Request) {
  let user;
  try {
    user = await workspaceUser();
  } catch {
    return Response.json({ error: 'Admin access required.' }, { status: 403 });
  }
  if (
    request.headers.get('origin') &&
    request.headers.get('origin') !== new URL(request.url).origin
  )
    return Response.json({ error: 'Invalid origin.' }, { status: 403 });
  let body;
  try {
    // The target brief is a prompt and may run to targetMaxLength characters,
    // so the body cap has to clear it with room for the rest of the payload.
    // At the previous 4 KB default a full-length brief was refused here,
    // before the validation below could report anything useful about it.
    body = await boundedJson(request, targetMaxLength + 4096);
  } catch {
    return Response.json(
      {
        error: `Provide a valid request under ${Math.round((targetMaxLength + 4096) / 1024)} KB.`,
      },
      { status: 400 },
    );
  }
  const db = getDb();
  try {
    if (body.action === 'configure') {
      if (
        typeof body.target !== 'string' ||
        body.target.trim().length < targetMinLength ||
        body.target.length > targetMaxLength
      )
        return Response.json(
          {
            error: `Describe a target market in ${targetMinLength}–${targetMaxLength} characters.`,
          },
          { status: 400 },
        );
      await db.execute(
        sql`INSERT INTO prospect_campaigns(id,owner_id,target) VALUES(${crypto.randomUUID()},${user.userId},${body.target.trim()}) ON CONFLICT(owner_id) DO UPDATE SET target=EXCLUDED.target`,
      );
      return Response.json({ note: 'Search target saved.' });
    }

    if (body.action === 'schedule') {
      // Validated here rather than trusted from the form. This decides when an
      // unattended job spends model credits, so a hand-made request must not be
      // able to set it running every hour.
      if (!isCadence(body.cadence))
        return Response.json(
          { error: 'Choose how often to search.' },
          { status: 400 },
        );
      const runHour = Number(body.runHour);
      if (!Number.isInteger(runHour) || runHour < 0 || runHour > 23)
        return Response.json(
          { error: 'Choose an hour between 00:00 and 23:00 UTC.' },
          { status: 400 },
        );
      const maxPerDay = Number(body.maxPerDay);
      if (!Number.isInteger(maxPerDay) || maxPerDay < 1 || maxPerDay > 6)
        return Response.json(
          { error: 'Between one and six runs a day.' },
          { status: 400 },
        );

      const saved = await db.execute(
        sql`UPDATE prospect_campaigns
              SET cadence=${body.cadence}, run_hour=${runHour}, max_per_day=${maxPerDay}
            WHERE owner_id=${user.userId}
            RETURNING id`,
      );
      if (!saved.rows.length)
        return Response.json(
          { error: 'Save your search target first.' },
          { status: 400 },
        );
      return Response.json({
        note: describeSchedule({
          cadence: body.cadence,
          runHour,
          maxPerDay,
          enabled: true,
        }),
      });
    }
    const campaign = await db.execute(
      sql`SELECT id FROM prospect_campaigns WHERE owner_id=${user.userId}`,
    );
    if (!campaign.rows.length)
      return Response.json(
        { error: 'Save your search target first.' },
        { status: 400 },
      );
    const campaignId = String(campaign.rows[0].id);
    if (body.action === 'pause' || body.action === 'resume') {
      await db.execute(
        sql`UPDATE prospect_campaigns SET enabled=${body.action === 'resume'} WHERE id=${campaignId} AND owner_id=${user.userId}`,
      );
      return Response.json({
        note:
          body.action === 'pause'
            ? 'Search paused. An already-running search may finish.'
            : 'Search enabled.',
      });
    }
    if (body.action === 'discover')
      return streamProspecting(user.userId, campaignId);
    const id = typeof body.id === 'string' ? body.id.slice(0, 100) : '';
    if (!id) return Response.json({ error: 'Select a lead.' }, { status: 400 });
    if (body.action === 'enrich')
      return streamProspecting(user.userId, campaignId, { leadId: id });
    if (body.action === 'promote') {
      const saved = await db.execute(promoteProspectQuery(id, user.userId));
      return saved.rows.length
        ? Response.json({
            note: 'Added to Enquiries with contact consent marked unknown.',
          })
        : Response.json(
            { error: 'Shortlist this lead first. It may already be promoted.' },
            { status: 409 },
          );
    }
    if (
      body.action === 'shortlist' ||
      body.action === 'dismiss' ||
      body.action === 'restore'
    ) {
      const updated = await db.execute(
        reviewProspectQuery(id, user.userId, body.action),
      );
      return updated.rows.length
        ? Response.json({ note: 'Lead review saved.' })
        : Response.json(
            { error: 'Lead unavailable or already closed.' },
            { status: 409 },
          );
    }
    return Response.json({ error: 'Unsupported action.' }, { status: 400 });
  } catch {
    return Response.json(
      {
        error: `Action could not complete. Check AI activity, database access and the daily allowance${dailyResearchRuns() ? ` of ${dailyResearchRuns()} runs` : ''}.`,
      },
      { status: 503 },
    );
  }
}
export const GET = withRequestLog('/api/admin/prospects', get);
export const POST = withRequestLog('/api/admin/prospects', post);
