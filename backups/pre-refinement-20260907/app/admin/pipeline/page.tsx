import { desc } from 'drizzle-orm';
import { getDb } from '@/db';
import { opportunities } from '@/db/schema';
import { AdminAddLead } from '@/components/admin-add-lead';
import { AdminPipelineList, type Lead } from '@/components/admin-pipeline-list';
import { byUrgency, todayIso } from '@/lib/pipeline-order';

export const dynamic = 'force-dynamic';

export default async function AdminPipelinePage() {
  let leads: Lead[] = [];
  let loadFailed = false;
  // Newest first from the database, then reordered by what actually needs chasing.
  try { leads = await getDb().select().from(opportunities).orderBy(desc(opportunities.createdAt)).limit(30); } catch { loadFailed = true; }

  const today = todayIso();
  leads = byUrgency(leads, today);

  return (
    <section className="admin-main" id="pipeline">
      <header className="admin-header"><div><small>SALES & SCOPING</small><h1>Who needs a thoughtful next move?</h1><p>The latest 30 enquiries. Set the stage and write down what happens next, so nothing sits here without an owner deciding something.</p></div></header>
      <div className="admin-layout">
        <section className="admin-panel pipeline-panel">
          {loadFailed
            ? <div className="empty-admin" role="alert"><strong>Enquiries could not be loaded.</strong><span>Check the database connection, then reload this page. No example records are substituted.</span></div>
            : leads.length
              ? <AdminPipelineList initialLeads={leads} today={today} />
              : <div className="empty-admin"><strong>Nothing in the pipeline yet.</strong><span>Enquiries arrive from the opportunity mapper, or add someone who came to you directly.</span></div>}
        </section>
        <AdminAddLead />
      </div>
    </section>
  );
}
