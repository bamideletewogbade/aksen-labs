import { routingConfig, AI_PROFILES } from '@/lib/ai-routing';
import { AiConnectionCheck } from '@/components/ai-connection-check';
import { desc, sql } from 'drizzle-orm';
import Link from 'next/link';
import {
  Bot,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  XCircle,
} from 'lucide-react';
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

export const metadata = { title: 'AI usage | Aksen Workspace' };

/** Twenty fills a screen without the page becoming a scroll to nowhere. */
const RUNS_PER_PAGE = 20;

export default async function AdminAgentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const config = routingConfig();
  let runs: RunView[] = [];
  let totalMicros = 0;
  let totalRuns = 0;
  let loadFailed = false;

  // Paged through the URL rather than held in component state, so a page
  // survives a reload, can be linked to, and works with the browser's own back
  // button. The page number is clamped after the count is known, so a hand-typed
  // ?page=900 lands on the last page instead of on an empty list.
  const requested = Math.max(1, Number((await searchParams).page) || 1);

  try {
    const db = getDb();
    // The count has to come back before the page query, because the offset
    // depends on it: a hand-typed ?page=900 must land on the last page rather
    // than fetch an empty window. Cost and count share one round trip, which
    // matters on Neon's HTTP driver where every query is its own request.
    const [totals] = await db
      .select({
        spend: sql<number>`coalesce(sum(${agentRuns.costMicros}), 0)`,
        runs: sql<number>`count(*)`,
      })
      .from(agentRuns);
    totalMicros = Number(totals?.spend ?? 0);
    totalRuns = Number(totals?.runs ?? 0);
    const lastPage = Math.max(1, Math.ceil(totalRuns / RUNS_PER_PAGE));
    const page = Math.min(requested, lastPage);
    runs = await db
      .select()
      .from(agentRuns)
      .orderBy(desc(agentRuns.createdAt))
      .limit(RUNS_PER_PAGE)
      .offset((page - 1) * RUNS_PER_PAGE);
  } catch {
    loadFailed = true;
  }

  const lastPage = Math.max(1, Math.ceil(totalRuns / RUNS_PER_PAGE));
  const page = Math.min(requested, lastPage);
  const firstShown = totalRuns === 0 ? 0 : (page - 1) * RUNS_PER_PAGE + 1;
  const lastShown = Math.min(page * RUNS_PER_PAGE, totalRuns);

  return (
    <section className="admin-main" id="agents">
      <header className="admin-header">
        <div>
          <small>AI ACTIVITY</small>
          <h1>AI usage</h1>
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
        {/* Two facts answer almost every visit to this panel: which model runs
            by default, and what it falls back to. They are shown; everything
            else is reference and is a click away. Model identifiers are set in
            monospace because they are identifiers to be compared character by
            character, not prose to be read. */}
        <dl className="ai-routing-facts">
          <div>
            <dt>Default model</dt>
            <dd>
              <code>{config.defaultModel}</code>
            </dd>
          </div>
          <div>
            <dt>Request order</dt>
            <dd className="ai-routing-chain">
              {config.models.map((model, index) => (
                <span key={model}>
                  {index > 0 && <i aria-hidden="true">→</i>}
                  <code>{model}</code>
                </span>
              ))}
            </dd>
          </div>
        </dl>

        <details className="ai-routing-more">
          <summary>How a model gets chosen, and what it may cost</summary>
          <dl className="ai-routing-facts">
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
          <table className="ai-profile-table">
            <caption className="sr-only">
              Cost tier and output allowance for each kind of task
            </caption>
            <thead>
              <tr>
                <th scope="col">Task</th>
                <th scope="col">Cost tier</th>
                <th scope="col">Output tokens</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(AI_PROFILES).map(([id, profile]) => {
                const tier = routingConfig(
                  id as keyof typeof AI_PROFILES,
                ).costTier;
                return (
                  <tr key={id}>
                    <th scope="row">{profile.label}</th>
                    <td>
                      <span className="tier-mark" data-tier={tier}>
                        {tier}
                      </span>
                    </td>
                    <td className="num">{profile.maxTokens}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p>
            A minimum 1,024-token completion allowance accommodates reasoning
            models; short-answer prompts still request concise answers. Cost
            tiers guide selection; <strong>they are not a spending cap</strong>.
            Set hard budget limits in OpenRouter. Image and video generation
            keep their separate media models.
          </p>
        </details>

        <AiConnectionCheck />
      </section>
      <div className="admin-layout">
        <section className="admin-panel activity-panel">
          <div className="panel-head">
            <div>
              {/* "LATEST 30 RUNS" above "30 logged" said the same thing twice
                  and neither was the total: it was the page size wearing the
                  count's clothes. The heading is now the real number of runs
                  ever recorded, and the range being viewed sits under it. */}
              <small>ACTIVITY</small>
              <h2>
                {loadFailed
                  ? 'Records unavailable'
                  : `${totalRuns.toLocaleString()} ${totalRuns === 1 ? 'run' : 'runs'} logged`}
              </h2>
              {!loadFailed && totalRuns > 0 && (
                <p className="run-range">
                  Showing {firstShown.toLocaleString()}–
                  {lastShown.toLocaleString()}
                  {lastPage > 1 ? ` · page ${page} of ${lastPage}` : ''}
                </p>
              )}
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
              {lastPage > 1 && (
                // Plain links, so paging works before hydration, opens in a new
                // tab on a middle click, and leaves a real history entry. The
                // ends are rendered as text rather than as disabled links,
                // because a link that goes nowhere is still focusable and still
                // announces itself as a link.
                <nav className="run-pager" aria-label="Activity pages">
                  {page > 1 ? (
                    <Link href={`/admin/agents?page=${page - 1}`} rel="prev">
                      <ChevronLeft size={15} /> Newer
                    </Link>
                  ) : (
                    <span>
                      <ChevronLeft size={15} /> Newer
                    </span>
                  )}
                  <small>
                    Page {page} of {lastPage}
                  </small>
                  {page < lastPage ? (
                    <Link href={`/admin/agents?page=${page + 1}`} rel="next">
                      Older <ChevronRight size={15} />
                    </Link>
                  ) : (
                    <span>
                      Older <ChevronRight size={15} />
                    </span>
                  )}
                </nav>
              )}
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
