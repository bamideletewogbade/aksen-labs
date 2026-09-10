import { desc, sql } from 'drizzle-orm';
import { Bot, CheckCircle2, XCircle } from 'lucide-react';
import { getDb } from '@/db';
import { agentRuns } from '@/db/schema';

export const dynamic = 'force-dynamic';

const registeredAgents = [
  { name: 'Front Door', job: 'Answers visitor questions and creates a useful handoff' },
  { name: 'Opportunity Mapper', job: 'Turns three answers into one practical first pilot' },
  { name: 'Creative Studio (image)', job: 'Generates marketing images from a brief and references' },
  { name: 'Creative Studio (video)', job: 'Submits and tracks marketing video generation jobs' },
  { name: 'Workspace Preview', job: 'Drafts from the sample brief on the public preview page' },
];

type RunView = { id: string; agentName: string; channel: string; status: string; outcome: string | null; durationMs: number | null; costMicros: number | null; createdAt: Date };

function formatCost(micros: number): string {
  const dollars = micros / 1_000_000;
  if (dollars >= 1) return `$${dollars.toFixed(2)}`;
  if (dollars >= 0.01) return `$${dollars.toFixed(3)}`;
  return `$${dollars.toFixed(5)}`;
}

function timeAgo(date: Date): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default async function AdminAgentsPage() {
  let runs: RunView[] = [];
  let totalMicros = 0;
  let loadFailed = false;
  try {
    const db = getDb();
    runs = await db.select().from(agentRuns).orderBy(desc(agentRuns.createdAt)).limit(30);
    const [totals] = await db.select({ spend: sql<number>`coalesce(sum(${agentRuns.costMicros}), 0)` }).from(agentRuns);
    totalMicros = Number(totals?.spend ?? 0);
  } catch { loadFailed = true; }

  return (
    <section className="admin-main" id="agents">
      <header className="admin-header"><div><small>AI ACTIVITY</small><h1>Inspect the work behind the reply</h1><p>Recent saved runs from the Guide, mapper and creative tools. A successful request does not by itself prove a business outcome.</p></div></header>
      <div className="admin-layout">
        <section className="admin-panel activity-panel">
          <div className="panel-head"><div><small>LATEST 30 RUNS</small><h2>{loadFailed ? 'Records unavailable' : `${runs.length} logged`}</h2></div><span className="live-label">{loadFailed ? 'Cost unavailable' : `${formatCost(totalMicros)} recorded cost · may be incomplete`}</span></div>
          {loadFailed ? <div className="empty-admin" role="alert"><strong>Activity could not be loaded.</strong><span>Check the database connection and reload.</span></div> : runs.length ? (
            <div className="run-list">
              {runs.map((run) => (
                <article key={run.id}>
                  <div className={run.status === 'success' ? 'completed' : 'approval'}>{run.status === 'success' ? <CheckCircle2 size={15} /> : <XCircle size={15} />}</div>
                  <span><strong>{run.agentName}</strong><p>{run.outcome || 'No outcome recorded'}</p></span>
                  <small>{run.channel} · {timeAgo(run.createdAt)}{run.durationMs ? ` · ${(run.durationMs / 1000).toFixed(1)}s` : ''}{run.costMicros ? ` · ${formatCost(run.costMicros)}` : ''}</small>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-admin"><Bot /><strong>No runs logged yet.</strong><span>Successfully saved AI activity will appear here. Usage without a saved run will not be included.</span></div>
          )}
        </section>
        <section className="admin-panel">
          <div className="panel-head"><div><small>IMPLEMENTED AI ENTRY POINTS</small><h2>{registeredAgents.length} tools</h2></div><Bot /></div>
          <div className="run-list">
            {registeredAgents.map((agent) => (
              <article key={agent.name}><div className="completed"><Bot size={15} /></div><span><strong>{agent.name}</strong><p>{agent.job}</p></span><small>Requires configured services</small></article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
