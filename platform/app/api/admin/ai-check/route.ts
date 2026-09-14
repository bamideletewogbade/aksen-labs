import { withRequestLog } from '@/lib/request-log';
import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { workspaceUser } from '@/lib/workspace-access';
import { chatComplete } from '@/lib/openrouter';
import { AI_PROFILES, type AiProfile } from '@/lib/ai-routing';
import { logAgentRun } from '@/lib/agent-runs';
async function POSTHandler(request: Request) {
  let user;
  try {
    user = await workspaceUser();
  } catch {
    return NextResponse.json(
      { error: 'Admin access required.' },
      { status: 403 },
    );
  }
  if (
    request.headers.get('origin') &&
    request.headers.get('origin') !== new URL(request.url).origin
  )
    return NextResponse.json(
      { error: 'Invalid request origin.' },
      { status: 403 },
    );
  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  const profile = body?.profile;
  const routing = body?.routing;
  if (
    typeof profile !== 'string' ||
    !Object.hasOwn(AI_PROFILES, profile) ||
    (routing !== 'auto' && routing !== 'default')
  )
    return NextResponse.json(
      { error: 'Choose a valid profile and routing mode.' },
      { status: 400 },
    );
  const started = Date.now();
  try {
    const bucket = `ai-check-${user.userId}-${new Date().toISOString().slice(0, 13)}`;
    const quota = await getDb().execute(
      sql`INSERT INTO workspace_demo_usage(bucket,requests) VALUES(${bucket},1) ON CONFLICT(bucket) DO UPDATE SET requests=workspace_demo_usage.requests+1 WHERE workspace_demo_usage.requests<5 RETURNING requests`,
    );
    if (!quota.rows.length)
      return NextResponse.json(
        { error: 'Five connection tests per hour are allowed.' },
        { status: 429 },
      );
    const structured = profile === 'structured';
    const result = await chatComplete({
      profile: profile as AiProfile,
      routing: routing as 'auto' | 'default',
      json: structured,
      maxTokens: 150,
      messages: [
        {
          role: 'system',
          content: structured
            ? 'Return a JSON object with status set to ok and amount set to 450.'
            : 'Use this fictional fact only: a sample shelf costs GHS 450. Answer in one short sentence.',
        },
        {
          role: 'user',
          content: structured
            ? 'Return the test object.'
            : 'How much does the sample shelf cost?',
        },
      ],
    });
    await logAgentRun({
      agentName: 'AI connection test',
      channel: 'admin',
      status: 'success',
      outcome: `${profile} / ${routing}`,
      durationMs: Date.now() - started,
      costMicros: result.costMicros,
      trace: result.telemetry,
    });
    return NextResponse.json({
      content: result.content,
      ...result.telemetry,
      costMicros: result.costMicros,
      durationMs: Date.now() - started,
    });
  } catch {
    await logAgentRun({
      agentName: 'AI connection test',
      channel: 'admin',
      status: 'error',
      outcome: 'Connection or output validation failed',
      durationMs: Date.now() - started,
    });
    return NextResponse.json(
      {
        error:
          'Connection test failed. Check the API key, balance, model access and routing settings.',
      },
      { status: 502 },
    );
  }
}

export const POST = withRequestLog('/api/admin/ai-check', POSTHandler);
