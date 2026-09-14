import { desc, eq, isNull, or } from 'drizzle-orm';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { opportunities } from '@/db/schema';
import { AdminAddLead } from '@/components/admin-add-lead';
import { AdminPipelineList, type Lead } from '@/components/admin-pipeline-list';
import { byUrgency, todayIso } from '@/lib/pipeline-order';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Sales pipeline | Aksen Workspace' };

export default async function AdminPipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const user = await getChatGPTUser();
  const owner = user?.userId ?? '';
  const initialQuery = typeof q === 'string' ? q.slice(0, 160) : '';
  let leads: Lead[] = [];
  let loadFailed = false;
  // Newest first from the database, then reordered by what actually needs chasing.
  try {
    leads = await getDb()
      .select()
      .from(opportunities)
      // Unowned rows are included deliberately. This is a single-workspace
      // system, and a lead with no owner is far more likely to be one this
      // application failed to stamp than one belonging to somebody else. An
      // enquiry that is captured but invisible is the worst outcome available,
      // so the reader forgives what the writer may get wrong.
      .where(
        or(eq(opportunities.ownerId, owner), isNull(opportunities.ownerId)),
      )
      .orderBy(desc(opportunities.createdAt))
      .limit(30);
  } catch {
    loadFailed = true;
  }

  const today = todayIso();
  leads = byUrgency(leads, today);

  return (
    <section className="admin-main" id="pipeline">
      <header className="admin-header">
        <div>
          <small>SALES & SCOPING</small>
          <h1>Sales pipeline</h1>
          <p>
            Review the latest 30 enquiries. Update the stage, next action and
            follow-up date.
          </p>
        </div>
      </header>
      <div className="admin-layout">
        <section className="admin-panel pipeline-panel">
          {loadFailed ? (
            <div className="empty-admin" role="alert">
              <strong>Enquiries could not be loaded.</strong>
              <span>
                Check the database connection, then reload this page. No example
                records are substituted.
              </span>
            </div>
          ) : leads.length ? (
            <AdminPipelineList
              initialLeads={leads}
              today={today}
              initialQuery={initialQuery}
            />
          ) : (
            <div className="empty-admin">
              <strong>Nothing in the pipeline yet.</strong>
              <span>
                Enquiries arrive from the opportunity mapper, or add someone who
                came to you directly.
              </span>
            </div>
          )}
        </section>
        <AdminAddLead />
      </div>
    </section>
  );
}
