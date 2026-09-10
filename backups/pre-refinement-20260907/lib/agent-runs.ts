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
      trace: input.trace ? (input.trace as object) : undefined,
    });
  } catch {
    // Logging is best-effort and must never break the caller's actual request.
  }
}
