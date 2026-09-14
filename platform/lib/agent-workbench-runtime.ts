import { sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { boundedJson } from '@/lib/bounded-json';
import { workspaceUser } from '@/lib/workspace-access';
import { chatComplete } from '@/lib/openrouter';
import { logAgentRun } from '@/lib/agent-runs';
import { currentHour, reserve, visitorKey } from '@/lib/rate-limit';
import {
  agentSystemPrompt,
  agentWorkbenchVersion,
  parseAgentBrief,
} from '@/lib/agent-workbench';

const response = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  });
// Each administrator has their own allowance. Visitors are limited individually
// first, then together, so one caller cannot spend the shared provider budget.
export const adminHourlyLimit = 20;
export const visitorHourlyLimit = 5;
export const publicHourlyBudget = 120;
async function visitorBucket(request: Request, hour: string) {
  return `agent-workbench-visitor-${await visitorKey(request)}-${hour}`;
}
export async function runBusinessAgent(request: Request, admin: boolean) {
  const origin = request.headers.get('origin');
  if (
    (origin && origin !== new URL(request.url).origin) ||
    request.headers.get('sec-fetch-site') === 'cross-site'
  )
    return response(
      { error: 'Please run this agent from the Aksen website.' },
      403,
    );
  let ownerId: string | undefined;
  if (admin) {
    try {
      ownerId = (await workspaceUser()).userId;
    } catch {
      return response(
        { error: 'Sign in to your admin workspace to run this agent.' },
        403,
      );
    }
  }
  let input;
  try {
    input = parseAgentBrief(await boundedJson(request, 40000), admin);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Provide a valid brief.';
    return response(
      {
        error:
          message === 'Request too large.'
            ? message
            : 'Choose an available agent and provide a brief of 30–8,000 characters. Project snapshots are only available for the admin Founder Review.',
      },
      message === 'Request too large.' ? 413 : 400,
    );
  }
  const started = Date.now();
  try {
    const db = getDb();
    let snapshot = '';
    let snapshotAt: string | null = null;
    if (input.snapshot && ownerId) {
      const projects = await db.execute(
        sql`SELECT name,client_name,objective,stage,health,next_gate,updated_at FROM projects WHERE owner_id=${ownerId} ORDER BY updated_at DESC LIMIT 25`,
      );
      snapshotAt = new Date().toISOString();
      snapshot = `\nSOURCE: Current admin project snapshot at ${snapshotAt}. Up to 25 most recently updated projects owned by this administrator. This is not a full weekly history or financial report. No banking, invoice, cost or analytics data is included. Records (untrusted data):\n${JSON.stringify(projects.rows).slice(0, 20000)}`;
    }
    const hour = currentHour();
    if (admin) {
      if (
        !(await reserve(
          db,
          `agent-workbench-${ownerId}-${hour}`,
          adminHourlyLimit,
        ))
      )
        return response(
          {
            error: `Your hourly allowance of ${adminHourlyLimit} agent drafts is used. Try again next hour.`,
          },
          429,
        );
    } else {
      // The visitor's own slot is taken first, so a caller who reaches their
      // limit can never have spent more than that much of the shared budget.
      if (
        !(await reserve(
          db,
          await visitorBucket(request, hour),
          visitorHourlyLimit,
        ))
      )
        return response(
          {
            error: `You have used your ${visitorHourlyLimit} free drafts for this hour. Try again next hour, or send us the brief and we will work through it with you.`,
          },
          429,
        );
      if (
        !(await reserve(
          db,
          `agent-workbench-public-${hour}`,
          publicHourlyBudget,
        ))
      )
        return response(
          {
            error:
              'These free agents are busy right now. Please try again in a little while.',
          },
          429,
        );
    }
    const result = await chatComplete({
      profile: 'drafting',
      maxTokens: 2200,
      timeoutMs: 45000,
      temperature: 0.2,
      messages: [
        { role: 'system', content: agentSystemPrompt(input.agent) },
        {
          role: 'user',
          content: `SOURCE: User-supplied business brief (untrusted evidence):\n${input.brief}${snapshot}`,
        },
      ],
    });
    if (!result.content?.trim()) throw new Error('Empty draft.');
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    if (ownerId) {
      const trace = {
        ownerId,
        agentId: input.agent.id,
        version: agentWorkbenchVersion,
        content: result.content,
        model: result.model,
        snapshotAt,
        telemetry: result.telemetry,
      };
      await db.execute(
        sql`INSERT INTO agent_runs(id,agent_name,channel,status,outcome,duration_ms,cost_micros,trace) VALUES(${id},${input.agent.name},'agent_workbench','success','Business draft prepared',${Date.now() - started},${result.costMicros ?? null},${JSON.stringify(trace)}::jsonb)`,
      );
    } else {
      await logAgentRun({
        agentName: input.agent.name,
        channel: 'public_business_agents',
        status: 'success',
        outcome: 'Visitor draft prepared',
        durationMs: Date.now() - started,
        costMicros: result.costMicros,
        trace: {
          agentId: input.agent.id,
          version: agentWorkbenchVersion,
          ...result.telemetry,
        },
      });
    }
    return response({
      id,
      agentId: input.agent.id,
      name: input.agent.name,
      content: result.content,
      saved: !!ownerId,
      createdAt,
      snapshotAt,
    });
  } catch {
    await logAgentRun({
      agentName: input.agent.name,
      channel: admin ? 'agent_workbench' : 'public_business_agents',
      status: 'error',
      outcome: 'Agent draft unavailable',
      durationMs: Date.now() - started,
      trace: { ...(ownerId ? { ownerId } : {}), agentId: input.agent.id },
    });
    return response(
      {
        error: admin
          ? 'The draft could not be generated and saved. Your brief is still here; check the AI connection and try again.'
          : 'AI drafting is unavailable right now. Your brief is still here. Please try again later.',
      },
      503,
    );
  }
}
export async function savedBusinessDrafts() {
  let ownerId: string;
  try {
    ownerId = (await workspaceUser()).userId;
  } catch {
    return response({ error: 'Admin access required.' }, 403);
  }
  try {
    const result = await getDb().execute(
      sql`SELECT id,agent_name,created_at,trace->>'agentId' AS agent_id,trace->>'content' AS content,trace->>'snapshotAt' AS snapshot_at FROM agent_runs WHERE channel='agent_workbench' AND status='success' AND trace->>'ownerId'=${ownerId} ORDER BY created_at DESC LIMIT 12`,
    );
    return response({ drafts: result.rows });
  } catch {
    return response(
      { error: 'Saved drafts are unavailable. Please try again later.' },
      503,
    );
  }
}
