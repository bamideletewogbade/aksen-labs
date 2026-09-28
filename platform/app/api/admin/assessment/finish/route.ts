import { and, eq, isNull, or } from 'drizzle-orm';
import { getDb } from '@/db';
import { auditEvents, leadInteractions, opportunities } from '@/db/schema';
import { boundedJson } from '@/lib/bounded-json';
import { workspaceUser } from '@/lib/workspace-access';
import { logAgentRun } from '@/lib/agent-runs';
import { withRequestLog } from '@/lib/request-log';
import { validDate } from '@/lib/workspace-rules';
import {
  assessmentChannels,
  historySummary,
  parseAssessment,
  parseRoadmap,
} from '@/lib/assessment';

const reply = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  });

const STAGES = ['new', 'qualified', 'proposal', 'won', 'lost'];
const text = (value: unknown, limit: number) =>
  typeof value === 'string' ? value.trim().slice(0, limit) : '';

/**
 * Saves a finished assessment. A next step and a date are required, because
 * the playbook's rule is that a contact without them did not happen.
 *
 * An existing lead is updated; a business met for the first time becomes a
 * lead here, and only here, so an assessment abandoned halfway leaves nothing
 * behind. The full notes and roadmap go into the run log for reference; the
 * lead's history gets one readable line.
 */
async function POSTHandler(request: Request) {
  let ownerId: string;
  try {
    ownerId = (await workspaceUser()).userId;
  } catch {
    return reply({ error: 'Sign in to your workspace first.' }, 403);
  }
  let body: Record<string, unknown>;
  try {
    body = await boundedJson(request, 40000);
  } catch {
    return reply({ error: 'The assessment could not be read.' }, 400);
  }

  const input = parseAssessment(body);
  const nextAction = text(body.nextAction, 200);
  const followUpAt = text(body.followUpAt, 10);
  const stage = STAGES.includes(body.stage as string)
    ? (body.stage as string)
    : 'qualified';
  const channel = assessmentChannels.includes(body.channel as never)
    ? (body.channel as string)
    : 'call';
  const jev =
    typeof body.jev === 'number' && body.jev >= 0 && body.jev <= 1
      ? body.jev
      : null;
  const roadmap =
    body.roadmap && typeof body.roadmap === 'object'
      ? parseRoadmap(JSON.stringify(body.roadmap))
      : null;

  if (!input.business) return reply({ error: 'Add the business name.' }, 400);
  if (!nextAction)
    return reply({ error: 'Agree a next step before finishing.' }, 400);
  if (!validDate(followUpAt))
    return reply({ error: 'Set the date for that next step.' }, 400);

  const db = getDb();
  let leadId = text(body.leadId, 100);
  const problem = input.answers.went_wrong || input.answers.busy_day || '';

  if (leadId) {
    const [lead] = await db
      .select({
        id: opportunities.id,
        desiredOutcome: opportunities.desiredOutcome,
      })
      .from(opportunities)
      .where(
        and(
          eq(opportunities.id, leadId),
          or(eq(opportunities.ownerId, ownerId), isNull(opportunities.ownerId)),
        ),
      )
      .limit(1);
    if (!lead) return reply({ error: 'That lead was not found.' }, 404);
    await db
      .update(opportunities)
      .set({
        status: stage,
        nextAction,
        followUpAt,
        // Fill in what they want only where nothing real was recorded yet.
        ...(input.goals.length &&
        /^To be agreed/i.test(lead.desiredOutcome || '')
          ? { desiredOutcome: input.goals.join(', ') }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(opportunities.id, leadId));
  } else {
    leadId = crypto.randomUUID();
    await db.insert(opportunities).values({
      id: leadId,
      name: input.person || 'Owner',
      email: '',
      company: input.business,
      work: (input.sells || problem || 'Free assessment').slice(0, 200),
      channel: `Free assessment (${channel})`,
      desiredOutcome: input.goals.length
        ? input.goals.join(', ')
        : 'To be agreed',
      recommendation: roadmap?.weCouldBuild[0]?.what || 'To be scoped',
      summary: problem.slice(0, 500) || null,
      status: stage,
      source: 'assessment',
      consentStatus: 'unknown',
      ownerId,
      nextAction,
      followUpAt,
    });
  }

  await db.insert(leadInteractions).values({
    id: crypto.randomUUID(),
    opportunityId: leadId,
    ownerId,
    occurredAt: new Date().toISOString().slice(0, 10),
    channel,
    direction: 'outbound',
    summary: historySummary(input, jev),
    shared: roadmap ? `Roadmap shown. Next: ${nextAction}`.slice(0, 300) : null,
  });

  await logAgentRun({
    agentName: 'Assessment',
    channel: 'admin',
    status: 'success',
    outcome: 'finished',
    trace: { ownerId, leadId, input, roadmap, jev, nextAction, followUpAt },
  });

  await db
    .insert(auditEvents)
    .values({
      id: crypto.randomUUID(),
      actorId: ownerId,
      actorType: 'user',
      action: 'opportunity.assessed',
      entityType: 'opportunity',
      entityId: leadId,
      details: { stage, channel, jev },
    })
    .catch(() => null);

  return reply({ leadId }, 201);
}

export const POST = withRequestLog('/api/admin/assessment/finish', POSTHandler);
