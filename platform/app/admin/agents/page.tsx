import { routingConfig, AI_PROFILES } from '@/lib/ai-routing';
import { AiConnectionCheck } from '@/components/ai-connection-check';
import { desc, sql } from 'drizzle-orm';
import { Bot, CheckCircle2, XCircle } from 'lucide-react';
import { getDb } from '@/db';
import { agentRuns } from '@/db/schema';

export const dynamic = 'force-dynamic';

const registeredAgents = [
  {
    name: 'Business agent desk',
    job: 'Nine focused drafting and review assistants, with three visitor tools and saved admin drafts',
  },
  {
    name: 'Creative prompt assistant',
    job: 'Turns a rough creative brief into a concise generation prompt',
  },
  {
    name: 'Operations desk',
    job: 'Drafts qualification, discovery, proposals, delivery plans, follow-ups and care reviews from a selected record',
  },
  {
    name: 'Workspace assistant',
    job: 'Drafts from selected client documents with source references',
  },
  {
    name: 'Service demo lab',
    job: 'Runs fictional WhatsApp, commerce and reporting scenarios; no live channel actions',
  },
  {
    name: 'Front Door',
    job: 'Answers visitor questions and creates a useful handoff',
  },
  {
    name: 'Opportunity Mapper',
    job: 'Suggests a practical starting point from three business answers',
  },
  {
    name: 'Creative Studio (image)',
    job: 'Generates marketing images from a brief and references',
  },
  {
    name: 'Creative Studio (video)',
    job: 'Submits and tracks marketing video generation jobs',
  },
  {
    name: 'Workspace Preview',
    job: 'Drafts from the sample brief on the public preview page',
  },
];

type RunView = {
  id: string;
  agentName: string;
  channel: string;
  status: string;
  outcome: string | null;
  durationMs: number | null;
  costMicros: number | null;
  createdAt: Date;
  trace?: unknown;
};

function formatCost(micros: number): string {
  const dollars = micros / 1_000_000;
  if (dollars >= 1) return `$${dollars.toFixed(2)}`;
  if (dollars >= 0.01) return `$${dollars.toFixed(3)}`;
  return `$${dollars.toFixed(5)}`;
}

function timeAgo(date: Date): string {
  const seconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(date).getTime()) / 1000),
  );
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export const metadata = { title: 'AI activity | Aksen Workspace' };

export default async function AdminAgentsPage() {
  const config = routingConfig();
  let runs: RunView[] = [];
  let totalMicros = 0;
  let loadFailed = false;
  try {
    const db = getDb();
    // Neon's HTTP driver costs a round trip per query, so independent reads go
    // together rather than one after the other.
    const [runRows, [totals]] = await Promise.all([
      db.select().from(agentRuns).orderBy(desc(agentRuns.createdAt)).limit(30),
      db
        .select({
          spend: sql<number>`coalesce(sum(${agentRuns.costMicros}), 0)`,
        })
        .from(agentRuns),
    ]);
    runs = runRows;
    totalMicros = Number(totals?.spend ?? 0);
  } catch {
    loadFailed = true;
  }

  return (
    <section className="admin-main" id="agents">
      <header className="admin-header">
        <div>
          <small>AI ACTIVITY</small>
          <h1>AI activity</h1>
          <p>
            Recent saved runs from the Guide, mapper and creative tools. A
            successful request does not by itself prove a business outcome.
          </p>
        </div>
      </header>
      <section className="admin-panel ai-routing-panel">
        <div className="panel-head">
          <div>
            <small>OPENROUTER CONFIGURATION</small>
            <h2>
              {config.mode === 'auto'
                ? 'Automatic model routing'
                : 'Default model routing'}
            </h2>
          </div>
          <span>
            {process.env.OPENROUTER_API_KEY ? 'Key configured' : 'Key missing'}
          </span>
        </div>
        <dl className="ai-routing-facts">
          <div>
            <dt>Default model</dt>
            <dd>{config.defaultModel}</dd>
          </div>
          <div>
            <dt>Request order</dt>
            <dd>{config.models.join(' → ')}</dd>
          </div>
          <div>
            <dt>Auto-router candidates</dt>
            <dd>
              {config.allowedModels.length
                ? config.allowedModels.join(', ')
                : 'OpenRouter candidates, subject to account settings'}
            </dd>
          </div>
          <div>
            <dt>Output limits</dt>
            <dd>Up to 4,000 tokens per request; task-specific timeouts</dd>
          </div>
        </dl>
        <div className="ai-profile-list">
          {Object.entries(AI_PROFILES).map(([id, profile]) => (
            <p key={id}>
              <strong>{profile.label}</strong>
              <span>
                {routingConfig(id as keyof typeof AI_PROFILES).costTier} cost
                tier · {profile.maxTokens} profile output tokens
              </span>
            </p>
          ))}
        </div>
        <p>
          A minimum 1,024-token completion allowance accommodates reasoning
          models; short-answer prompts still request concise answers. Cost tiers
          guide selection; they are not a spending cap. Set hard budget limits
          in OpenRouter. Image and video generation keep their separate media
          models.
        </p>
        <AiConnectionCheck />
      </section>
      <div className="admin-layout">
        <section className="admin-panel activity-panel">
          <div className="panel-head">
            <div>
              <small>LATEST 30 RUNS</small>
              <h2>
                {loadFailed ? 'Records unavailable' : `${runs.length} logged`}
              </h2>
            </div>
            <span className="live-label">
              {loadFailed
                ? 'Cost unavailable'
                : `${formatCost(totalMicros)} recorded cost · may be incomplete`}
            </span>
          </div>
          {loadFailed ? (
            <div className="empty-admin" role="alert">
              <strong>Activity could not be loaded.</strong>
              <span>Check the database connection and reload.</span>
            </div>
          ) : runs.length ? (
            <div className="run-list">
              {runs.map((run) => (
                <article key={run.id}>
                  <div
                    className={
                      run.status === 'success' ? 'completed' : 'approval'
                    }
                  >
                    {run.status === 'success' ? (
                      <CheckCircle2 size={15} />
                    ) : (
                      <XCircle size={15} />
                    )}
                  </div>
                  <span>
                    <strong>{run.agentName}</strong>
                    <p>{run.outcome || 'No outcome recorded'}</p>
                  </span>
                  <small>
                    {run.channel} · {timeAgo(run.createdAt)}
                    {run.trace &&
                    typeof run.trace === 'object' &&
                    'model' in run.trace &&
                    typeof run.trace.model === 'string'
                      ? ` · ${run.trace.model}`
                      : ''}
                    {run.durationMs
                      ? ` · ${(run.durationMs / 1000).toFixed(1)}s`
                      : ''}
                    {run.costMicros ? ` · ${formatCost(run.costMicros)}` : ''}
                  </small>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-admin">
              <Bot />
              <strong>No runs logged yet.</strong>
              <span>
                Successfully saved AI activity will appear here. Usage without a
                saved run will not be included.
              </span>
            </div>
          )}
        </section>
        <section className="admin-panel">
          <div className="panel-head">
            <div>
              <small>IMPLEMENTED AI ENTRY POINTS</small>
              <h2>{registeredAgents.length} tools</h2>
            </div>
            <Bot />
          </div>
          <div className="run-list">
            {registeredAgents.map((agent) => (
              <article key={agent.name}>
                <div className="completed">
                  <Bot size={15} />
                </div>
                <span>
                  <strong>{agent.name}</strong>
                  <p>{agent.job}</p>
                </span>
                <small>Requires configured services</small>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
