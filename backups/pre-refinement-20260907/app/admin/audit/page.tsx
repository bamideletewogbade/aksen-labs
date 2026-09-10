import { desc } from 'drizzle-orm';
import { ScrollText, User, Globe, Cpu } from 'lucide-react';
import { getDb } from '@/db';
import { auditEvents } from '@/db/schema';

export const dynamic = 'force-dynamic';

type AuditView = { id: string; actorId: string | null; actorType: string; action: string; entityType: string; entityId: string; details: unknown; createdAt: Date };

const actorIcon = { user: User, visitor: Globe, system: Cpu } as const;

function describe(action: string): string {
  const [subject, verb] = action.split('.');
  if (!verb) return action;
  return `${verb.replace(/_/g, ' ')} ${subject.replace(/_/g, ' ')}`;
}

function when(date: Date): string {
  return new Date(date).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default async function AdminAuditPage() {
  let events: AuditView[] = [];
  let loadFailed = false;
  try {
    events = await getDb().select().from(auditEvents).orderBy(desc(auditEvents.createdAt)).limit(100);
  } catch { loadFailed = true; }

  return (
    <section className="admin-main" id="audit">
      <header className="admin-header"><div><small>RECORD OF ACTIONS</small><h1>What happened, and who did it</h1><p>Recorded enquiry, article, approval and creative-tool actions, newest first. Activity that failed to save may be absent.</p></div></header>
      <section className="admin-panel full-panel">
        <div className="panel-head"><div><small>LATEST 100 EVENTS</small><h2>{loadFailed ? 'Records unavailable' : `${events.length} recorded`}</h2></div><ScrollText /></div>
        {loadFailed ? (
          <div className="empty-admin" role="alert"><strong>The record could not be loaded.</strong><span>Check the database connection and reload.</span></div>
        ) : events.length ? (
          <ol className="audit-list">
            {events.map((event) => {
              const Icon = actorIcon[event.actorType as keyof typeof actorIcon] || Cpu;
              return (
                <li key={event.id}>
                  <span className="audit-actor" title={event.actorType}><Icon size={15} /></span>
                  <span className="audit-body">
                    <strong>{describe(event.action)}</strong>
                    <small>{event.entityType.replace(/_/g, ' ')} · {event.entityId.slice(0, 8)}{event.actorId ? ` · ${event.actorId}` : ''}</small>
                  </span>
                  <time>{when(event.createdAt)}</time>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="empty-admin"><ScrollText /><strong>Nothing recorded yet.</strong><span>Actions across the pipeline, content, approvals and studio are written here as they happen.</span></div>
        )}
      </section>
    </section>
  );
}
