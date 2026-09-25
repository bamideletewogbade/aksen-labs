import Link from 'next/link';
import { sql } from 'drizzle-orm';
import {
  ArrowRight,
  ClipboardList,
  BriefcaseBusiness,
  CalendarClock,
  CircleDollarSign,
  Radar,
  ShieldAlert,
  Users,
  Wallet,
  Gauge,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import {
  FounderActivityChart,
  type FounderActivityPoint,
} from '@/components/founder-activity-chart';
import {
  FounderActionQueue,
  type FounderAction,
} from '@/components/founder-action-queue';
import { money } from '@/lib/workspace-rules';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Home | Aksen Workspace' };

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
  let actions: FounderAction[] = [];
  let activeProjects = 0;
  let leadsToReview = 0;
  let openConversations = 0;
  let pendingApprovals = 0;
  let activity: FounderActivityPoint[] = [];
  let overdueByCurrency: { currency: string; amount: number; count: number }[] =
    [];
  let collectedByCurrency: { currency: string; amount: number; count: number }[] =
    [];
  let outstandingByCurrency: { currency: string; amount: number; count: number }[] =
    [];
  let aiBurnMicros = 0;
  let aiRunsCount = 0;
  let avgDurationMs = 0;

  try {
    const db = getDb();
    const [
      summaryResult,
      pipelineResult,
      projectResult,
      followUpResult,
      invoiceResult,
      activityResult,
      newLeadsResult,
      stalledProposalsResult,
      recentEpisodesResult,
      financialsResult,
      aiBurnResult,
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
      db.execute(sql`
          SELECT id,company,name,recommendation,desired_outcome,created_at
          FROM opportunities
          WHERE (owner_id=${owner} OR owner_id IS NULL)
            AND status = 'new'
          ORDER BY created_at DESC
          LIMIT 3`),
      db.execute(sql`
          SELECT id,company,name,desired_outcome,updated_at
          FROM opportunities
          WHERE (owner_id=${owner} OR owner_id IS NULL)
            AND status = 'proposal'
            AND updated_at <= CURRENT_DATE - INTERVAL '3 days'
          ORDER BY updated_at ASC
          LIMIT 2`),
      db.execute(sql`
          SELECT count(*)::int AS count
          FROM media_episodes
          WHERE owner_id=${owner}
            AND created_at >= CURRENT_DATE - INTERVAL '7 days'`),
      db.execute(sql`
          SELECT f.currency,
                 sum(CASE WHEN f.kind = 'receipt' THEN f.total_minor ELSE 0 END)::bigint AS collected_minor,
                 count(CASE WHEN f.kind = 'receipt' THEN 1 END)::int AS receipt_count,
                 sum(CASE WHEN f.kind = 'invoice' AND f.status = 'issued' THEN (f.total_minor - f.paid_minor) ELSE 0 END)::bigint AS outstanding_minor,
                 count(CASE WHEN f.kind = 'invoice' AND f.status = 'issued' AND (f.total_minor - f.paid_minor) > 0 THEN 1 END)::int AS outstanding_count
          FROM business_financials f
          JOIN business_workspaces b ON b.id=f.business_id
          WHERE b.owner_id=${owner}
          GROUP BY f.currency`),
      db.execute(sql`
          SELECT coalesce(sum(cost_micros), 0)::bigint AS cost_micros,
                 count(*)::int AS runs_count,
                 coalesce(avg(duration_ms), 0)::int AS avg_duration_ms
          FROM agent_runs
          WHERE created_at >= date_trunc('month', CURRENT_DATE)
            AND (trace->>'ownerId'=${owner} OR trace->>'ownerId' IS NULL)`),
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
    collectedByCurrency = financialsResult.rows
      .filter((row) => Number(row.collected_minor) > 0)
      .map((row) => ({
        currency: String(row.currency),
        amount: Number(row.collected_minor),
        count: Number(row.receipt_count),
      }));
    outstandingByCurrency = financialsResult.rows
      .filter((row) => Number(row.outstanding_minor) > 0)
      .map((row) => ({
        currency: String(row.currency),
        amount: Number(row.outstanding_minor),
        count: Number(row.outstanding_count),
      }));

    const aiBurnRow = aiBurnResult.rows[0] as
      | Record<string, unknown>
      | undefined;
    aiBurnMicros = Number(aiBurnRow?.cost_micros ?? 0);
    aiRunsCount = Number(aiBurnRow?.runs_count ?? 0);
    avgDurationMs = Number(aiBurnRow?.avg_duration_ms ?? 0);

    activity = activityResult.rows.map((row) => ({
      label: String(row.label),
      leads: Number(row.leads),
      aiRuns: Number(row.ai_runs),
    }));

    const rawActions: FounderAction[] = [];

    // 1. Critical Cashflow Leaks (Overdue invoices)
    if (overdueByCurrency.length) {
      rawActions.push({
        id: 'overdue-invoices',
        category: 'urgent',
        badge: 'Cashflow',
        tone: 'urgent',
        label: 'Overdue invoices past agreed terms',
        detail: overdueByCurrency
          .map(
            (item) =>
              `${money(item.amount, item.currency)} across ${item.count} invoices`,
          )
          .join(' · '),
        actionText: 'Review Invoices',
        href: '/admin/workspaces',
      });
    }

    // 2. Inbound Fit Audit
    for (const lead of newLeadsResult.rows) {
      const company = String(lead.company || 'Unknown');
      rawActions.push({
        id: `ai-audit-${String(lead.id)}`,
        category: 'ai_strategic',
        badge: 'Inbound Fit',
        tone: 'ai',
        label: `Audit fit & prepare brief for ${company}`,
        detail: `${textValue(lead.name, 'Enquirer')} · ${textValue(lead.recommendation, 'Inbound lead')}`,
        actionText: 'Run Fit Audit',
        href: `/admin/operations?lead=${encodeURIComponent(String(lead.id))}&task=lead_audit`,
      });
    }

    // 3. Stalled Proposal Follow-up
    for (const proposal of stalledProposalsResult.rows) {
      const company = String(proposal.company || 'Unknown');
      rawActions.push({
        id: `ai-stalled-${String(proposal.id)}`,
        category: 'ai_strategic',
        badge: 'Follow-up',
        tone: 'ai',
        label: `Unblock proposal for ${company}`,
        detail: 'Proposal has been pending for 3+ days without a decision.',
        actionText: 'Draft Follow-up',
        href: `/admin/operations?lead=${encodeURIComponent(String(proposal.id))}&task=jev_followup`,
      });
    }

    // 4. Delivery: At-Risk Projects
    for (const proj of projects) {
      if (proj.health === 'at_risk') {
        rawActions.push({
          id: `proj-risk-${proj.id}`,
          category: 'delivery',
          badge: 'Project At Risk',
          tone: 'urgent',
          label: `Unblock at-risk project: ${proj.name}`,
          detail: `${proj.client} · Health marked at risk. Immediate alignment needed.`,
          actionText: 'Open Project',
          href: '/admin/projects',
        });
      }
    }

    // 5. Urgent Follow-ups Due Today
    for (const row of followUpResult.rows) {
      rawActions.push({
        id: `follow-up-${String(row.id)}`,
        category: 'urgent',
        badge: 'Follow-Up Due',
        tone: 'urgent',
        label: `Follow up with ${String(row.company)}`,
        detail: `${textValue(row.next_action, 'Review enquiry')} · due ${String(row.follow_up_at)}`,
        actionText: 'Review Lead',
        href: `/admin/pipeline?q=${encodeURIComponent(String(row.company))}`,
      });
    }

    // 6. Delivery: Acceptance Gate & UAT Checklist
    for (const proj of projects) {
      if (proj.health !== 'at_risk' && proj.progress >= 75) {
        rawActions.push({
          id: `proj-gate-${proj.id}`,
          category: 'delivery',
          badge: 'Acceptance Gate',
          tone: 'delivery',
          label: `Prepare UAT acceptance for ${proj.name}`,
          detail: `${proj.client} · ${proj.progress}% progress · Gate: ${proj.gate}`,
          actionText: 'Open UAT',
          href: '/admin/templates',
        });
      }
    }

    // 7. Founder Decisions / Approvals
    if (pendingApprovals) {
      rawActions.push({
        id: 'approvals',
        category: 'decision',
        badge: 'Approval Gate',
        tone: 'decision',
        label: `${pendingApprovals} ${pendingApprovals === 1 ? 'decision needs' : 'decisions need'} review`,
        detail: 'Client articles or deliverables paused pending your sign-off.',
        actionText: 'Review Approvals',
        href: '/admin/approvals',
      });
    }

    // 8. AI Growth: Inbound Media Cadence
    const recentEpisodesCount = Number(
      recentEpisodesResult.rows[0]?.count ?? 0,
    );
    if (recentEpisodesCount === 0) {
      rawActions.push({
        id: 'media-cadence',
        category: 'ai_strategic',
        badge: 'Inbound Growth',
        tone: 'ai',
        label: 'Create weekly case study or media episode',
        detail: 'Zero media episodes created in the past 7 days.',
        actionText: 'Open Studio',
        href: '/admin/studio',
      });
    }

    // 9. Researched Leads Review
    if (leadsToReview) {
      rawActions.push({
        id: 'lead-review',
        category: 'urgent',
        badge: 'Prospect Queue',
        tone: 'decision',
        label: `Review ${leadsToReview} researched ${leadsToReview === 1 ? 'lead' : 'leads'}`,
        detail: 'Shortlist a strong fit or dismiss from queue.',
        actionText: 'Review Leads',
        href: '/admin/prospects',
      });
    }

    actions = rawActions.slice(0, 8);
  } catch {
    databaseReady = false;
  }

  const totalPipeline = pipeline.reduce((sum, item) => sum + item.count, 0);
  const pipelineMap = new Map(pipeline.map((item) => [item.stage, item.count]));

  const cashCollectedSummary = collectedByCurrency.length
    ? collectedByCurrency
        .map((item) => money(item.amount, item.currency))
        .join(' + ')
    : 'None yet';

  const receivablesSummary = outstandingByCurrency.length
    ? outstandingByCurrency
        .map((item) => money(item.amount, item.currency))
        .join(' + ')
    : 'Clear';

  const overdueSummary = overdueByCurrency.length
    ? overdueByCurrency
        .map((item) => money(item.amount, item.currency))
        .join(' + ')
    : 'Zero overdue';

  const aiBurnDollars = aiBurnMicros / 1_000_000;
  const aiBurnFormatted =
    aiBurnDollars >= 1
      ? `$${aiBurnDollars.toFixed(2)} USD`
      : aiBurnDollars > 0
        ? `$${aiBurnDollars.toFixed(3)} USD`
        : '$0.00 USD';

  const totalReceiptsCount = collectedByCurrency.reduce(
    (sum, c) => sum + c.count,
    0,
  );
  const totalOutstandingCount = outstandingByCurrency.reduce(
    (sum, c) => sum + c.count,
    0,
  );
  const totalOverdueCount = overdueByCurrency.reduce(
    (sum, c) => sum + c.count,
    0,
  );

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
            <ClipboardList /> Use AI tools
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
            <Link href="/admin/workspaces">
              <span>
                <Wallet /> Cash collected
              </span>
              <strong>{cashCollectedSummary}</strong>
              <small>
                {totalReceiptsCount > 0
                  ? `${totalReceiptsCount} paid receipts MTD`
                  : 'no receipts this month'}
              </small>
            </Link>
            <Link
              href="/admin/workspaces"
              className={totalOverdueCount > 0 ? 'needs-attention' : ''}
            >
              <span>
                <CircleDollarSign /> Receivables
              </span>
              <strong>{receivablesSummary}</strong>
              <small>
                {totalOverdueCount > 0
                  ? `${totalOverdueCount} overdue terms`
                  : totalOutstandingCount > 0
                    ? `${totalOutstandingCount} pending invoices`
                    : 'all invoices cleared'}
              </small>
            </Link>
            <Link href="/admin/agents">
              <span>
                <Gauge /> AI model spend
              </span>
              <strong>{aiBurnFormatted}</strong>
              <small>
                {aiRunsCount > 0
                  ? `${aiRunsCount} model runs MTD`
                  : 'zero inference burn'}
              </small>
            </Link>
          </section>

          <div className="founder-grid">
            {/* Financial Ledger & Operating Burn Card */}
            <section
              className="founder-card founder-financials"
              aria-labelledby="financials-heading"
            >
              <div className="founder-card-head">
                <div>
                  <small>FINANCIAL LEDGER &amp; OPERATING BURN</small>
                  <h2 id="financials-heading">Business health &amp; unit economics</h2>
                </div>
                <Link href="/admin/workspaces">Open finances</Link>
              </div>

              <div className="founder-financial-grid">
                <div className="fin-metric-block">
                  <span className="fin-metric-label">
                    <Wallet size={14} /> Cash Collected (MTD)
                  </span>
                  <strong className="fin-metric-val revenue">{cashCollectedSummary}</strong>
                  <small>
                    {totalReceiptsCount} paid client {totalReceiptsCount === 1 ? 'receipt' : 'receipts'} this month
                  </small>
                </div>

                <div className="fin-metric-block">
                  <span className="fin-metric-label">
                    <CircleDollarSign size={14} /> Outstanding Receivables
                  </span>
                  <strong className="fin-metric-val pending">{receivablesSummary}</strong>
                  <small>
                    {totalOutstandingCount} issued {totalOutstandingCount === 1 ? 'invoice' : 'invoices'} pending
                  </small>
                </div>

                <div className="fin-metric-block">
                  <span className="fin-metric-label">
                    <Gauge size={14} /> AI Model Spend (MTD)
                  </span>
                  <strong className="fin-metric-val burn">{aiBurnFormatted}</strong>
                  <small>
                    {aiRunsCount} runs · {(avgDurationMs / 1000).toFixed(1)}s avg latency
                  </small>
                </div>

                <div className="fin-metric-block">
                  <span className="fin-metric-label">
                    <TrendingUp size={14} /> Model Unit Economics
                  </span>
                  <strong className="fin-metric-val net">
                    {aiRunsCount > 0
                      ? `$${((aiBurnMicros / aiRunsCount) / 1_000_000).toFixed(3)}/run`
                      : '$0.00/run'}
                  </strong>
                  <small>Average inference cost per task</small>
                </div>
              </div>

              {overdueByCurrency.length > 0 && (
                <div className="fin-overdue-alert">
                  <AlertCircle size={16} />
                  <span>
                    <strong>{overdueSummary}</strong> is past agreed payment terms.
                  </span>
                  <Link href="/admin/workspaces">Review now &rarr;</Link>
                </div>
              )}
            </section>

            <section
              className="founder-card founder-trend"
              aria-labelledby="activity-heading"
            >
              <div className="founder-card-head">
                <div>
                  <small>14-DAY MOMENTUM</small>
                  <h2 id="activity-heading">Demand and agent activity</h2>
                </div>
                <span>
                  <i className="legend-leads" /> Leads{' '}
                  <i className="legend-ai" /> AI runs
                </span>
              </div>
              <FounderActivityChart data={activity} />
            </section>

            <section
              className="founder-card founder-priority"
              aria-labelledby="priority-heading"
            >
              <div className="founder-card-head">
                <div>
                  <small>EXECUTIVE COCKPIT · JEV STRATEGY</small>
                  <h2 id="priority-heading">Next best actions &amp; AI recommendations</h2>
                </div>
                <span>{actions.length} priorities</span>
              </div>
              <FounderActionQueue actions={actions} />
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
