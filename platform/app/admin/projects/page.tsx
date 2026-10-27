import { sql } from 'drizzle-orm';
import { CheckCircle2 } from 'lucide-react';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { AdminCreateProject } from '@/components/admin-create-project';
import { AdminTabs } from '@/components/admin-tabs';
import {
  AdminProjectList,
  type Project,
} from '@/components/admin-project-list';

import { projectBilling } from '@/lib/project-stages';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Client projects | Aksen Workspace' };

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const params = await searchParams;
  const selectedProjectId =
    typeof params.projectId === 'string' ? params.projectId.slice(0, 160) : '';
  const user = await getChatGPTUser();
  const owner = user?.userId ?? '';
  let activeProjects: Project[] = [];
  let loadFailed = false;
  try {
    // Each project carries its own billing position, so acceptance and invoicing
    // are visible in the same row rather than in two separate screens.
    const rows = await getDb().execute(sql`
      SELECT p.id, p.name, p.client_name, p.stage, p.health, p.progress, p.next_gate, p.opportunity_id,
             coalesce(sum(CASE WHEN f.kind = 'invoice' AND f.status = 'issued' THEN f.total_minor - f.paid_minor ELSE 0 END), 0) AS outstanding,
             count(*) FILTER (WHERE f.kind = 'invoice' AND f.status IN ('issued','paid')) AS invoice_count,
             coalesce(sum(CASE WHEN f.kind = 'receipt' AND f.status = 'issued' THEN f.total_minor ELSE 0 END), 0) AS received,
             coalesce(bool_or(f.kind = 'receipt' AND f.status = 'issued' AND f.details->>'settlement' = 'full'), false) AS settled,
             -- The client record, found through money first, then documents
             -- filed against the project, then an exact name. Before this only
             -- money counted, so a project not yet invoiced had no way through
             -- to its own client.
             coalesce(
               min(f.business_id),
               (SELECT d.business_id FROM business_documents d
                  JOIN business_workspaces w ON w.id = d.business_id AND w.owner_id = ${owner}
                 WHERE d.project_id = p.id LIMIT 1),
               (SELECT w.id FROM business_workspaces w
                 WHERE w.owner_id = ${owner} AND lower(w.name) = lower(p.client_name) LIMIT 1)
             ) AS business_id
      FROM projects p
      LEFT JOIN business_financials f ON f.project_id = p.id AND f.business_id IN (SELECT id FROM business_workspaces WHERE owner_id = ${owner})
      WHERE p.owner_id = ${owner}
      GROUP BY p.id, p.name, p.client_name, p.stage, p.health, p.progress, p.next_gate, p.opportunity_id, p.updated_at
      ORDER BY CASE WHEN p.id=${selectedProjectId} THEN 0 WHEN p.stage='closed' THEN 2 ELSE 1 END, p.updated_at DESC
      LIMIT 100`);
    activeProjects = rows.rows.map((row) => {
      const record = row as Record<string, unknown>;
      const invoiced = Number(record.invoice_count) > 0;
      const outstanding = Number(record.outstanding);

      const billing = projectBilling({
        invoiced,
        outstanding,
        received: Number(record.received),
        settled: record.settled === true,
      });

      return {
        id: String(record.id),
        name: String(record.name),
        clientName: String(record.client_name),
        stage: String(record.stage),
        health: String(record.health),
        progress: Number(record.progress),
        nextGate: typeof record.next_gate === 'string' ? record.next_gate : '',
        billing,

        businessId:
          typeof record.business_id === 'string'
            ? record.business_id
            : undefined,
        opportunityId:
          typeof record.opportunity_id === 'string'
            ? record.opportunity_id
            : undefined,
      };
    });
  } catch {
    loadFailed = true;
  }

  return (
    <section className="admin-main" id="projects">
      <header className="admin-header">
        <div>
          <small>DELIVERY</small>
          <h1>Work</h1>
          <p>
            See the next step, delivery stage and payment status for each
            project.
          </p>
        </div>
      </header>
      <AdminTabs
        label="Client work"
        tabs={[
          {
            id: 'projects',
            label: 'Projects',
            panel: (
              <section className="admin-panel projects-panel">
                <div className="panel-head">
                  <div>
                    <small>OPEN WORK FIRST · UP TO 100 PROJECTS</small>
                    <h2>
                      {loadFailed
                        ? 'Records unavailable'
                        : 'Delivery and billing'}
                    </h2>
                  </div>
                  <CheckCircle2 />
                </div>
                {loadFailed ? (
                  <div className="empty-admin" role="alert">
                    <strong>Projects could not be loaded.</strong>
                    <span>
                      Check the database connection, then reload this page.
                    </span>
                  </div>
                ) : activeProjects.length ? (
                  <AdminProjectList
                    key={selectedProjectId}
                    initialProjects={activeProjects}
                    initialProjectId={selectedProjectId}
                  />
                ) : (
                  <div className="empty-admin">
                    <strong>No projects created yet.</strong>
                    <span>
                      Create a project once there is a real client, objective
                      and agreed next step.
                    </span>
                  </div>
                )}
              </section>
            ),
          },
          {
            id: 'add-project',
            label: 'New project',
            panel: <AdminCreateProject />,
          },
        ]}
      />
    </section>
  );
}
