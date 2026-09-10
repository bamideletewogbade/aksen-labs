import { eq, sql } from 'drizzle-orm';
import { ArrowUpRight, BookOpen, BriefcaseBusiness, CheckCircle2, Receipt, ShieldAlert, Users } from 'lucide-react';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { approvals, blogPosts, opportunities, projects } from '@/db/schema';
import { money } from '@/lib/workspace-rules';

export const dynamic = 'force-dynamic';

type OverdueInvoice = { id: string; number: string; currency: string; outstanding: number; dueDate: string; businessName: string; daysOverdue: number };

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

export default async function AdminPage() {
  const user = await getChatGPTUser();
  let openOpportunities = 0; let activeProjects = 0; let pendingApprovals = 0; let draftArticles = 0; let databaseReady = true;
  let overdue: OverdueInvoice[] = [];
  let unbilled: { id: string; name: string; clientName: string }[] = [];
  try {
    const db = getDb();
    const [oppRows, projectRows, approvalRows, draftRows] = await Promise.all([
      db.select({ id: opportunities.id }).from(opportunities),
      db.select({ id: projects.id }).from(projects),
      db.select({ id: approvals.id }).from(approvals).where(eq(approvals.status, 'pending')),
      db.select({ id: blogPosts.id }).from(blogPosts).where(eq(blogPosts.status, 'draft')),
    ]);
    openOpportunities = oppRows.length; activeProjects = projectRows.length; pendingApprovals = approvalRows.length; draftArticles = draftRows.length;

    // Due dates live inside the details JSON as YYYY-MM-DD, so comparing them as text
    // is both correct and safe: no cast that a malformed value could blow up on.
    const rows = await db.execute(sql`
      SELECT f.id, f.number, f.currency, f.total_minor, f.paid_minor,
             f.details->>'dueDate' AS due_date,
             b.name AS business_name,
             to_char(CURRENT_DATE, 'YYYY-MM-DD') AS today
      FROM business_financials f
      JOIN business_workspaces b ON b.id = f.business_id
      WHERE b.owner_id = ${user?.userId ?? ''}
        AND f.kind = 'invoice'
        AND f.status = 'issued'
        AND coalesce(f.details->>'dueDate', '') <> ''
        AND f.details->>'dueDate' < to_char(CURRENT_DATE, 'YYYY-MM-DD')
      ORDER BY f.details->>'dueDate' ASC
      LIMIT 12`);
    overdue = rows.rows.map((row) => {
      const record = row as Record<string, unknown>;
      const dueDate = String(record.due_date);
      return {
        id: String(record.id), number: String(record.number), currency: String(record.currency),
        outstanding: Number(record.total_minor) - Number(record.paid_minor),
        dueDate, businessName: String(record.business_name),
        daysOverdue: daysBetween(dueDate, String(record.today)),
      };
    });
  } catch { databaseReady = false; }

  try {
    // Accepted work nobody has invoiced for. Counted separately from overdue money
    // because it is not late yet, it has simply never been asked for.
    const rows = await getDb().execute(sql`
      SELECT p.id, p.name, p.client_name
      FROM projects p
      LEFT JOIN business_financials f ON f.project_id = p.id AND f.kind = 'invoice' AND f.status IN ('issued','paid')
      WHERE p.stage IN ('accepted','closed')
      GROUP BY p.id, p.name, p.client_name
      HAVING count(f.id) = 0
      LIMIT 8`);
    unbilled = rows.rows.map((row) => {
      const record = row as Record<string, unknown>;
      return { id: String(record.id), name: String(record.name), clientName: String(record.client_name) };
    });
  } catch { /* the overdue panel already reports a database problem */ }

  // Five currencies are supported, so there is no single total to show.
  const owedByCurrency = new Map<string, number>();
  for (const invoice of overdue) owedByCurrency.set(invoice.currency, (owedByCurrency.get(invoice.currency) || 0) + invoice.outstanding);

  const firstName = user?.fullName?.split(' ')[0] || user?.displayName.split('@')[0] || 'there';
  const now = new Date();
  const today = now.toLocaleDateString('en-GB', { weekday: 'long' }).toUpperCase();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  return (
    <section className="admin-main" id="overview">
      <header className="admin-header">
        <div><small>{today} · AKSEN OPERATIONS</small><h1>Good {greeting}, {firstName}.</h1><p>One place to see what needs attention across demand, delivery and your agent team.</p></div>
        <a href="/">View public site <ArrowUpRight /></a>
      </header>
      {!databaseReady && <div className="system-notice" role="alert"><ShieldAlert /><div><strong>Records could not be loaded.</strong><span>Counts are unavailable. Check the database connection and reload.</span></div></div>}
      <div className="metric-grid">
        <a href="/admin/pipeline"><article><span><Users /> Saved enquiries</span><strong>{databaseReady ? openOpportunities : '—'}</strong><small>All stages · review qualification</small></article></a>
        <a href="/admin/projects"><article><span><BriefcaseBusiness /> Total projects</span><strong>{databaseReady ? activeProjects : '—'}</strong><small>All stages · discovery to delivery</small></article></a>
        <a href="/admin/approvals"><article><span><ShieldAlert /> Decisions waiting</span><strong>{databaseReady ? pendingApprovals : '—'}</strong><small>Article approval publishes the draft</small></article></a>
        <a href="/admin/content"><article><span><BookOpen /> Draft articles</span><strong>{databaseReady ? draftArticles : '—'}</strong><small>Review before publishing</small></article></a>
      </div>
      {databaseReady && (
        <section className={overdue.length ? 'owed-panel is-owed' : 'owed-panel'} aria-labelledby="owed-heading">
          <div className="owed-head">
            <div>
              <small>MONEY OUT THE DOOR</small>
              <h2 id="owed-heading">
                {overdue.length
                  ? <>{[...owedByCurrency.entries()].map(([currency, minor]) => money(minor, currency)).join(' and ')} past its due date</>
                  : <>Nothing overdue</>}
              </h2>
            </div>
            {overdue.length ? <Receipt /> : <CheckCircle2 />}
          </div>
          {overdue.length ? (
            <ol className="owed-list">
              {overdue.map((invoice) => (
                <li key={invoice.id}>
                  <span className="owed-who">
                    <strong>{invoice.businessName}</strong>
                    <small>{invoice.number} · due {invoice.dueDate}</small>
                  </span>
                  <b>{money(invoice.outstanding, invoice.currency)}</b>
                  <em>{invoice.daysOverdue} {invoice.daysOverdue === 1 ? 'day' : 'days'} late</em>
                </li>
              ))}
            </ol>
          ) : (
            <p className="owed-clear">Every issued invoice is either inside its terms or settled.</p>
          )}
          {unbilled.length > 0 && (
            <div className="unbilled">
              <strong>{unbilled.length} accepted {unbilled.length === 1 ? 'project has' : 'projects have'} never been invoiced</strong>
              <ul>{unbilled.map((project) => <li key={project.id}>{project.name} · {project.clientName}</li>)}</ul>
              <a href="/admin/projects">Open projects →</a>
            </div>
          )}
          <a className="owed-link" href="/admin/workspaces">Open clients and billing →</a>
        </section>
      )}
      <section className="operating-map" aria-labelledby="operating-map-heading">
        <h2 id="operating-map-heading">How the business fits together</h2>
        <p>Six responsibilities, one accountable founder. Use the tools available today; the next step is to connect one enquiry all the way through delivery.</p>
        <div className="operating-map-grid">
          <article><small>GROWTH</small><h3>Make the offer clear</h3><p>Write and manage articles. Create visual assets when they serve a real brief.</p><small>Next: connect campaigns to qualified enquiries.</small><a href="/admin/content">Open content →</a></article>
          <article><small>SALES & SCOPING</small><h3>Turn interest into a brief</h3><p>Review enquiries saved by the mapper.</p><small>Next: qualification, owner, follow-up date and reviewed scope.</small><a href="/admin/pipeline">Open pipeline →</a></article>
          <article><small>DELIVERY</small><h3>Deliver an agreed result</h3><p>Create a project with a client and objective.</p><small>Next: link the enquiry, manage tasks and record acceptance.</small><a href="/admin/projects">Open projects →</a></article>
          <article><small>CUSTOMER SUCCESS</small><h3>Keep the relationship moving</h3><p>Review saved conversations and update their status.</p><small>Next: assignment, response tracking and service commitments.</small><a href="/admin/support">Open support inbox →</a></article>
          <article><small>QUALITY & OPERATIONS</small><h3>Check what actually happened</h3><p>Inspect AI activity, recorded actions and article publication approvals.</p><small>Next: workflow outcome checks and complete cost tracking.</small><a href="/admin/agents">Open agent activity →</a></article>
          <article><small>FINANCE & ADMINISTRATION</small><h3>Keep commitments visible</h3><p>Issue proformas and invoices, record payments against them and generate receipts, in your client's currency.</p><small>Next: link billing to project acceptance, and chase overdue invoices.</small><a href="/admin/workspaces">Open clients and billing →</a></article>
        </div>
      </section>
    </section>
  );
}
