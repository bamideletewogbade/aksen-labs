import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { chatComplete } from '@/lib/openrouter';
import { logAgentRun } from '@/lib/agent-runs';
import { demoBrief } from '@/lib/workspace-demo';
export async function POST(request: Request) {
  try {
    if (Number(request.headers.get('content-length') || 0) > 1000) return NextResponse.json({ error: 'Request too large.' }, { status: 413 });
    const body = await request.json() as { task?: unknown };
    const task = String(body.task);
    if (!['brief','proposal'].includes(task)) return NextResponse.json({ error: 'Choose a preview task.' }, { status: 400 });
    // Global hourly quota is persistent and atomic, including concurrent requests.
    const bucket = new Date().toISOString().slice(0,13);
    const reserved = await getDb().execute(sql`INSERT INTO workspace_demo_usage(bucket, requests) VALUES(${bucket},1) ON CONFLICT(bucket) DO UPDATE SET requests=workspace_demo_usage.requests+1 WHERE workspace_demo_usage.requests<20 RETURNING requests`);
    if (!reserved.rows.length) return NextResponse.json({ error: 'This hour’s shared preview allowance has been used. Please try again later.' }, { status: 429 });
    const startedAt = Date.now();
    let result;
    try {
      result = await chatComplete({ maxTokens: 750, timeoutMs: 30000, messages: [{ role: 'system', content: 'Prepare a concise plain-text business draft using only the provided fictional brief. Cite [1]. Distinguish proposed scope and missing information. Do not invent dates, prices, savings, tax guidance or commitments. Use no em dashes. End with the decisions a human must make.' }, { role: 'user', content: `Task: ${task === 'proposal' ? 'Draft a proposed scope with exclusions and acceptance criteria' : 'Summarize the brief and identify discovery questions'}. Source [1]: ${demoBrief}` }] });
    } catch (error) {
      await logAgentRun({ agentName: 'Workspace Preview', channel: 'public_demo', status: 'error', outcome: `Could not prepare the ${task} draft`, durationMs: Date.now() - startedAt });
      throw error;
    }
    await logAgentRun({ agentName: 'Workspace Preview', channel: 'public_demo', status: 'success', outcome: `Prepared the ${task} draft`, durationMs: Date.now() - startedAt, costMicros: result.costMicros });
    return NextResponse.json({ content: result.content });
  } catch { return NextResponse.json({ error: 'The live example could not be prepared. Please try again shortly.' }, { status: 503 }); }
}
