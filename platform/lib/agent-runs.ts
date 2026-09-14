import { requestContext } from './request-context';
import { logBackendEvent } from './backend-events';
import { getDb } from '@/db';
import { agentRuns } from '@/db/schema';

export async function logAgentRun(input: {
  agentName: string;
  channel: string;
  status: 'success' | 'error';
  outcome?: string;
  durationMs?: number;
  costMicros?: number;
  trace?: unknown;
}): Promise<void> {
  try {
    const db = getDb();
    await db.insert(agentRuns).values({
      id: crypto.randomUUID(),
      agentName: input.agentName,
      channel: input.channel,
      status: input.status,
      outcome: input.outcome,
      durationMs: input.durationMs,
      costMicros: input.costMicros,
      trace: {
        ...(input.trace && typeof input.trace === 'object' ? input.trace : {}),
        appRequestId: requestContext.getStore()?.requestId,
      },
    });
  } catch {
    await logBackendEvent('logging.agent_run_failed', {
      errorCode: 'run_persistence_failed',
    });
  }
}
