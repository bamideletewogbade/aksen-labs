import { sql } from 'drizzle-orm';
import { CheckCircle2 } from 'lucide-react';
import { getDb } from '@/db';
import { AdminCreateProject } from '@/components/admin-create-project';
import { AdminProjectList, type Project } from '@/components/admin-project-list';
import type { Billing } from '@/lib/project-stages';

export const dynamic = 'force-dynamic';

export default async function AdminProjectsPage() {
  let activeProjects: Project[] = [];
  let loadFailed = false;
  try {
    // Each project carries its own billing position, so acceptance and invoicing
    // are visible in the same row rather than in two separate screens.
    const rows = await getDb().execute(sql`
      SELECT p.id, p.name, p.client_name, p.stage, p.health, p.progress, p.next_gate,
             coalesce(sum(CASE WHEN f.kind = 'invoice' AND f.status = 'issued' THEN f.total_minor - f.paid_minor ELSE 0 END), 0) AS outstanding,
             count(*) FILTER (WHERE f.kind = 'invoice' AND f.status IN ('issued','paid')) AS invoice_count
      FROM projects p
      LEFT JOIN business_financials f ON f.project_id = p.id
      GROUP BY p.id, p.name, p.client_name, p.stage, p.health, p.progress, p.next_gate, p.updated_at
      ORDER BY p.updated_at DESC
      LIMIT 30`);
    activeProjects = rows.rows.map((row) => {
      const record = row as Record<string, unknown>;
      const invoiced = Number(record.invoice_count) > 0;
      const outstanding = Number(record.outstanding);
      const billing: Billing = !invoiced ? 'none' : outstanding > 0 ? 'awaiting' : 'paid';
      return {
        id: String(record.id), name: String(record.name), clientName: String(record.client_name),
        stage: String(record.stage), health: String(record.health),
        progress: Number(record.progress), nextGate: String(record.next_gate ?? ''), billing,
      };
    });
  } catch { loadFailed = true; }

  return (
    <section className="admin-main" id="projects">
      <header className="admin-header"><div><small>DELIVERY OS</small><h1>Projects from promise to proof</h1><p>Every engagement, from discovery through improvement.</p></div></header>
      <div className="admin-layout">
        <section className="admin-panel projects-panel">
          <div className="panel-head"><div><small>LATEST 30 PROJECTS</small><h2>{loadFailed ? 'Records unavailable' : 'Delivery and billing'}</h2></div><CheckCircle2 /></div>
          {loadFailed
            ? <div className="empty-admin" role="alert"><strong>Projects could not be loaded.</strong><span>Check the database connection, then reload this page.</span></div>
            : activeProjects.length
              ? <AdminProjectList initialProjects={activeProjects} />
              : <div className="empty-admin"><strong>No projects created yet.</strong><span>Create a project once there is a real client, objective and agreed next step.</span></div>}
        </section>
        <AdminCreateProject />
      </div>
    </section>
  );
}
