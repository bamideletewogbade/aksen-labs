import Link from 'next/link';
import { sql } from 'drizzle-orm';
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Radar,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import {
  FounderActivityChart,
  type FounderActivityPoint,
} from '@/components/founder-activity-chart';
import { money } from '@/lib/workspace-rules';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Home | Aksen Workspace' };

type Action = {
  id: string;
  tone: 'urgent' | 'decision' | 'work';
  label: string;
  detail: string;
  href: string;
};

type ProjectPulse = {
  id: string;
  name: string;
  client: string;
  health: string;
  progress: number;
  gate: string;
};

const stageLabels: Record<string, string> = {
  new: 'New',
  qualified: 'Qualified',
  proposal: 'Proposal',
  won: 'Won',
};

function rowValue(row: Record<string, unknown> | undefined, key: string) {
  return Number(row?.[key] ?? 0);
}

function textValue(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

export default async function AdminPage() {
  const user = await getChatGPTUser();
  const owner = user?.userId ?? '';
  let databaseReady = true;
  let pipeline: { stage: string; count: number }[] = [];
  let projects: ProjectPulse[] = [];
  let actions: Action[] = [];
  let activeProjects = 0;
  let leadsToReview = 0;
  let openConversations = 0;
  let pendingApprovals = 0;
  let activity: FounderActivityPoint[] = [];
  let overdueByCurrency: { currency: string; amount: number; count: number }[] =
    [];

  try {
    const db = getDb();
    const [
      summaryResult,
      pipelineResult,
      projectResult,
      followUpResult,
      invoiceResult,
      activityResult,
    ] = await Promise.all([
      db.execute(sql`
          SELECT
            (SELECT count(*)::int FROM projects WHERE owner_id=${owner} AND stage IN ('discovery','delivery')) AS active_projects,
            (SELECT count(*)::int FROM prospect_leads WHERE owner_id=${owner} AND status IN ('new','shortlisted')) AS leads_to_review,
            (SELECT count(*)::int FROM conversations WHERE status <> 'resolved') AS open_conversations,
            (SELECT count(*)::int FROM approvals WHERE status='pending') AS pending_approvals`),
      db.execute(sql`
          SELECT status AS stage, count(*)::int AS count
          FROM opportunities
          -- Unowned rows count here too, matching the pipeline. If the two
          -- disagreed, the dashboard would report work that the list then
          -- failed to show, which is worse than either being wrong alone.
          WHERE (owner_id=${owner} OR owner_id IS NULL)
            AND status IN ('new','qualified','proposal','won')
          GROUP BY status`),
      db.execute(sql`
          SELECT id,name,client_name,health,progress,next_gate
          FROM projects
          WHERE owner_id=${owner} AND stage IN ('discovery','delivery')
          ORDER BY CASE health WHEN 'at_risk' THEN 0 WHEN 'watch' THEN 1 ELSE 2 END, updated_at DESC
          LIMIT 5`),
      db.execute(sql`
          SELECT id,company,next_action,follow_up_at
          FROM opportunities
          WHERE (owner_id=${owner} OR owner_id IS NULL)
            AND status IN ('new','qualified','proposal')
            AND follow_up_at IS NOT NULL AND follow_up_at <= CURRENT_DATE
          ORDER BY follow_up_at ASC
          LIMIT 4`),
      db.execute(sql`
          SELECT f.currency,
                 sum(f.total_minor-f.paid_minor)::int AS amount,
                 count(*)::int AS count
          FROM business_financials f
          JOIN business_workspaces b ON b.id=f.business_id
          WHERE b.owner_id=${owner} AND f.kind='invoice' AND f.status='issued'
            AND coalesce(f.details->>'dueDate','') <> ''
            AND f.details->>'dueDate' < to_char(CURRENT_DATE,'YYYY-MM-DD')
          GROUP BY f.currency`),
      db.execute(sql`
          WITH days AS (
            SELECT generate_series(CURRENT_DATE - 13, CURRENT_DATE, interval '1 day')::date AS day
          ), lead_counts AS (
            SELECT created_at::date AS day, count(*)::int AS count
            FROM prospect_leads
            WHERE owner_id=${owner} AND created_at >= CURRENT_DATE - 13
            GROUP BY created_at::date
          ), ai_counts AS (
            SELECT created_at::date AS day, count(*)::int AS count
            FROM agent_runs
            WHERE created_at >= CURRENT_DATE - 13
              AND (trace->>'ownerId'=${owner} OR trace->>'ownerId' IS NULL)
            GROUP BY created_at::date
          )
          SELECT to_char(days.day, 'DD Mon') AS label,
                 coalesce(lead_counts.count,0)::int AS leads,
                 coalesce(ai_counts.count,0)::int AS ai_runs
          FROM days
          LEFT JOIN lead_counts USING(day)
          LEFT JOIN ai_counts USING(day)
          ORDER BY days.day`),
    ]);

    const summary = summaryResult.rows[0] as
      | Record<string, unknown>
      | undefined;
    activeProjects = rowValue(summary, 'active_projects');
    leadsToReview = rowValue(summary, 'leads_to_review');
    openConversations = rowValue(summary, 'open_conversations');
    pendingApprovals = rowValue(summary, 'pending_approvals');
    pipeline = pipelineResult.rows.map((row) => ({
      stage: String(row.stage),
      count: Number(row.count),
    }));
    projects = projectResult.rows.map((row) => ({
      id: String(row.id),
      name: String(row.name),
      client: String(row.client_name),
      health: String(row.health),
      progress: Number(row.progress),
      gate: textValue(row.next_gate, 'Set the next decision'),
    }));
    overdueByCurrency = invoiceResult.rows.map((row) => ({
      currency: String(row.currency),
      amount: Number(row.amount),
      count: Number(row.count),
    }));
    activity = activityResult.rows.map((row) => ({
      label: String(row.label),
      leads: Number(row.leads),
      aiRuns: Number(row.ai_runs),
    }));

    actions = followUpResult.rows.map((row) => ({
      id: `follow-up-${String(row.id)}`,
      tone: 'urgent',
      label: `Follow up with ${String(row.company)}`,
      detail: `${textValue(row.next_action, 'Review enquiry')} · due ${String(row.follow_up_at)}`,
      href: `/admin/pipeline?q=${encodeURIComponent(String(row.company))}`,
    }));
    if (pendingApprovals)
      actions.push({
        id: 'approvals',
        tone: 'decision',
        label: `${pendingApprovals} ${pendingApprovals === 1 ? 'decision needs' : 'decisions need'} your review`,
        detail: 'Nothing proceeds until you approve or reject it.',
        href: '/admin/approvals',
      });
    if (leadsToReview)
      actions.push({
        id: 'lead-review',
        tone: 'work',
        label: `Review ${leadsToReview} researched ${leadsToReview === 1 ? 'lead' : 'leads'}`,
        detail: 'Shortlist a strong fit or dismiss it from the queue.',
        href: '/admin/prospects',
      });
    if (overdueByCurrency.length)
      actions.unshift({
        id: 'overdue',
        tone: 'urgent',
        label: 'Overdue invoices need attention',
        detail: overdueByCurrency
          .map(
            (item) =>
              `${money(item.amount, item.currency)} across ${item.count}`,
          )
          .join(' · '),
        href: '/admin/workspaces',
      });
    actions = actions.slice(0, 6);
  } catch {
    databaseReady = false;
  }

  const totalPipeline = pipeline.reduce((sum, item) => sum + item.count, 0);
  const pipelineMap = new Map(pipeline.map((item) => [item.stage, item.count]));
  const cashPosition = overdueByCurrency.length
    ? overdueByCurrency
        .map((item) => money(item.amount, item.currency))
        .join(' + ')
    : 'Clear';

  return (
    <section className="admin-main founder-overview" id="overview">
      <header className="founder-header">
        <div>
          <small>
            FOUNDER BRIEF ·{' '}
            {new Date()
              .toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
              })
              .toUpperCase()}
          </small>
          <h1>Today at Aksen.</h1>
          <p>Start with the decisions and work that need your attention.</p>
        </div>
        <div className="founder-quick-actions" aria-label="Quick actions">
          <Link href="/admin/prospects">
            <Radar /> Find leads
          </Link>
          <Link href="/admin/agent-desk">
            <Bot /> Use AI tools
          </Link>
        </div>
      </header>

      {!databaseReady ? (
        <div className="system-notice" role="alert">
          <ShieldAlert />
          <div>
            <strong>Your operating data could not be loaded.</strong>
            <span>Check the database connection and reload this page.</span>
          </div>
        </div>
      ) : (
        <>
          <section className="founder-scoreboard" aria-label="Agency snapshot">
            <Link href="/admin/pipeline">
              <span>
                <Users /> Open pipeline
              </span>
              <strong>{totalPipeline}</strong>
              <small>enquiries in motion</small>
            </Link>
            <Link href="/admin/projects">
              <span>
                <BriefcaseBusiness /> Active delivery
              </span>
              <strong>{activeProjects}</strong>
              <small>projects underway</small>
            </Link>
            <Link
              href="/admin/workspaces"
              className={overdueByCurrency.length ? 'needs-attention' : ''}
            >
              <span>
                <CircleDollarSign /> Overdue cash
              </span>
              <strong>{cashPosition}</strong>
              <small>
                {overdueByCurrency.length
                  ? 'past agreed terms'
                  : 'nothing past due'}
              </small>
            </Link>
            <Link href="/admin/support">
              <span>
                <CalendarClock /> Open conversations
              </span>
              <strong>{openConversations}</strong>
              <small>need resolution</small>
            </Link>
          </section>

          <div className="founder-grid">
            <section className="founder-card founder-trend" aria-labelledby="activity-heading">
              <div className="founder-card-head">
                <div>
                  <small>14-DAY MOMENTUM</small>
                  <h2 id="activity-heading">Demand and agent activity</h2>
                </div>
                <span><i className="legend-leads" /> Leads <i className="legend-ai" /> AI runs</span>
              </div>
              <FounderActivityChart data={activity} />
            </section>
            <section
              className="founder-card founder-priority"
              aria-labelledby="priority-heading"
            >
              <div className="founder-card-head">
                <div>
                  <small>YOUR QUEUE</small>
                  <h2 id="priority-heading">Next best actions</h2>
                </div>
                <span>{actions.length} open</span>
              </div>
              {actions.length ? (
                <ol className="founder-action-list">
                  {actions.map((action) => (
                    <li key={action.id}>
                      <i
                        className={`action-signal ${action.tone}`}
                        aria-hidden="true"
                      />
                      <span>
                        <strong>{action.label}</strong>
                        <small>{action.detail}</small>
                      </span>
                      <Link href={action.href} aria-label={action.label}>
                        <ArrowRight />
                      </Link>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="founder-clear">
                  <CheckCircle2 />
                  <strong>You’re clear for now.</strong>
                  <span>No overdue follow-ups, reviews or invoices.</span>
                </div>
              )}
            </section>

            <section
              className="founder-card"
              aria-labelledby="pipeline-heading"
            >
              <div className="founder-card-head">
                <div>
                  <small>REVENUE</small>
                  <h2 id="pipeline-heading">Pipeline pulse</h2>
                </div>
                <Link href="/admin/pipeline">Open</Link>
              </div>
              <div className="pipeline-pulse">
                {['new', 'qualified', 'proposal', 'won'].map((stage, index) => (
                  <div key={stage}>
                    <span>{stageLabels[stage]}</span>
                    <strong>{pipelineMap.get(stage) || 0}</strong>
                    <i
                      style={
                        {
                          '--pulse': `${Math.max(8, ((pipelineMap.get(stage) || 0) / Math.max(1, totalPipeline)) * 100)}%`,
                        } as React.CSSProperties
                      }
                    />
                    {index < 3 && <ArrowRight aria-hidden="true" />}
                  </div>
                ))}
              </div>
              <p className="founder-footnote">
                {leadsToReview} researched leads are waiting before the
                pipeline.
              </p>
            </section>

            <section
              className="founder-card founder-projects"
              aria-labelledby="delivery-heading"
            >
              <div className="founder-card-head">
                <div>
                  <small>DELIVERY</small>
                  <h2 id="delivery-heading">Project pulse</h2>
                </div>
                <Link href="/admin/projects">All projects</Link>
              </div>
              {projects.length ? (
                projects.map((project) => (
                  <article key={project.id}>
                    <div className="project-pulse-title">
                      <span>
                        <strong>{project.name}</strong>
                        <small>{project.client}</small>
                      </span>
                      <em className={`health-${project.health}`}>
                        {project.health.replace('_', ' ')}
                      </em>
                    </div>
                    <div className="project-pulse-progress">
                      <i
                        style={{
                          width: `${Math.min(100, Math.max(0, project.progress))}%`,
                        }}
                      />
                    </div>
                    <p>
                      <b>{project.progress}%</b>
                      <span>Next: {project.gate}</span>
                    </p>
                  </article>
                ))
              ) : (
                <div className="founder-clear">
                  <BriefcaseBusiness />
                  <strong>No active delivery.</strong>
                  <span>Accepted work will appear here.</span>
                </div>
              )}
            </section>

          </div>
        </>
      )}
    </section>
  );
}
