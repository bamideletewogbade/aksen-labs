import Link from 'next/link';
import { desc, and, eq, inArray } from 'drizzle-orm';
import { ScrollText, User, Globe, Cpu } from 'lucide-react';
import { getDb } from '@/db';
import { auditEvents } from '@/db/schema';

export const dynamic = 'force-dynamic';

type AuditView = {
  id: string;
  actorId: string | null;
  actorType: string;
  action: string;
  entityType: string;
  entityId: string;
  details: unknown;
  createdAt: Date;
};

const actorIcon = { user: User, visitor: Globe, system: Cpu } as const;

function describe(action: string): string {
  const [subject, verb] = action.split('.');
  if (!verb) return action;
  return `${verb.replace(/_/g, ' ')} ${subject.replace(/_/g, ' ')}`;
}

function when(date: Date): string {
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const metadata = { title: 'Activity log | Aksen Workspace' };

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const requestId =
    typeof params.request === 'string' ? params.request.slice(0, 100) : '';
  const view = typeof params.view === 'string' ? params.view : 'all';
  const filters = [];
  if (requestId) filters.push(eq(auditEvents.entityId, requestId));
  if (view === 'requests')
    filters.push(eq(auditEvents.entityType, 'api_request'));
  if (view === 'ai') filters.push(eq(auditEvents.entityType, 'ai_request'));
  if (view === 'errors')
    filters.push(
      inArray(auditEvents.action, [
        'request.failed',
        'request.exception',
        'ai.failed',
        'logging.agent_run_failed',
        'logging.conversation_failed',
      ]),
    );
  let events: AuditView[] = [];
  let loadFailed = false;
  try {
    events = await getDb()
      .select()
      .from(auditEvents)
      .where(and(...filters))
      .orderBy(desc(auditEvents.createdAt))
      .limit(100);
  } catch {
    loadFailed = true;
  }

  return (
    <section className="admin-main" id="audit">
      <header className="admin-header">
        <div>
          <small>RECORD OF ACTIONS</small>
          <h1>Activity log</h1>
          <p>
            API requests, AI runs and workflow actions, newest first. Filter by
            request reference to trace a call. Database logging failures are
            also reported in runtime logs.
          </p>
        </div>
      </header>
      <form className="audit-filters" action="/admin/audit" method="get">
        <label>
          Show
          <select name="view" defaultValue={view}>
            <option value="all">All activity</option>
            <option value="requests">API requests</option>
            <option value="ai">AI requests</option>
            <option value="errors">Failures</option>
          </select>
        </label>
        <label>
          Request reference
          <input
            name="request"
            defaultValue={requestId}
            placeholder="Paste X-Request-ID"
            maxLength={100}
          />
        </label>
        <button type="submit">Filter activity</button>
        <Link href="/admin/audit">Clear filters</Link>
      </form>
      <section className="admin-panel full-panel">
        <div className="panel-head">
          <div>
            <small>LATEST 100 EVENTS</small>
            <h2>
              {loadFailed ? 'Records unavailable' : `${events.length} recorded`}
            </h2>
          </div>
          <ScrollText />
        </div>
        {loadFailed ? (
          <div className="empty-admin" role="alert">
            <strong>The record could not be loaded.</strong>
            <span>Check the database connection and reload.</span>
          </div>
        ) : events.length ? (
          <ol className="audit-list">
            {events.map((event) => {
              const details =
                event.details && typeof event.details === 'object'
                  ? (event.details as Record<string, unknown>)
                  : {};
              const Icon =
                actorIcon[event.actorType as keyof typeof actorIcon] || Cpu;
              return (
                <li key={event.id}>
                  <span className="audit-actor" title={event.actorType}>
                    <Icon size={15} />
                  </span>
                  <span className="audit-body">
                    <strong>{describe(event.action)}</strong>
                    <small>
                      {event.entityType.replace(/_/g, ' ')} ·{' '}
                      {event.entityId.slice(0, 8)}
                      {event.actorId ? ` · ${event.actorId}` : ''}
                    </small>
                    <details>
                      <summary>Tracking details</summary>
                      <dl className="audit-details">
                        {[
                          'requestId',
                          'operationId',
                          'route',
                          'method',
                          'status',
                          'durationMs',
                          'model',
                          'routing',
                          'profile',
                          'providerRequestId',
                          'promptTokens',
                          'completionTokens',
                          'costMicros',
                          'errorCode',
                        ].map((key) =>
                          typeof details[key] === 'string' ||
                          typeof details[key] === 'number' ? (
                            <div key={key}>
                              <dt>{key}</dt>
                              <dd>{String(details[key])}</dd>
                            </div>
                          ) : null,
                        )}
                        <div>
                          <dt>Event reference</dt>
                          <dd>{event.id}</dd>
                        </div>
                      </dl>
                    </details>
                  </span>
                  <time>{when(event.createdAt)}</time>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="empty-admin">
            <ScrollText />
            <strong>Nothing recorded yet.</strong>
            <span>
              Actions across the pipeline, content, approvals and studio are
              written here as they happen.
            </span>
          </div>
        )}
      </section>
    </section>
  );
}
