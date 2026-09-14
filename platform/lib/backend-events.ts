import { getDb } from '@/db';
import { auditEvents } from '@/db/schema';
import { requestContext } from './request-context';
import { safeLogDetails } from './log-policy';
/** Diagnostics never contain prompts, response bodies, headers, email addresses or raw exceptions. */
export async function logBackendEvent(
  action: string,
  input: Record<string, unknown> = {},
): Promise<boolean> {
  const context = requestContext.getStore();
  const details = safeLogDetails({ ...context, ...input });
  const requestId =
    typeof details.requestId === 'string'
      ? details.requestId
      : crypto.randomUUID();
  details.requestId = requestId;
  const entry = { event: action, time: new Date().toISOString(), ...details };
  console.info(JSON.stringify(entry));
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      getDb()
        .insert(auditEvents)
        .values({
          id: crypto.randomUUID(),
          actorType: 'system',
          action,
          entityType: action.startsWith('ai.') ? 'ai_request' : 'api_request',
          entityId: requestId,
          details,
        }),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('Log timeout')), 2000);
      }),
    ]);
    return true;
  } catch {
    console.error(
      JSON.stringify({
        event: 'logging.persistence_failed',
        requestId,
        action,
        time: new Date().toISOString(),
      }),
    );
    return false;
  } finally {
    clearTimeout(timer);
  }
}
