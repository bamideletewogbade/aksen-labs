import { and, desc, eq, inArray, isNull, notInArray, or } from 'drizzle-orm';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { opportunities } from '@/db/schema';
import { AdminTabs } from '@/components/admin-tabs';
import { AdminAddLead } from '@/components/admin-add-lead';
import { AdminPipelineList, type Lead } from '@/components/admin-pipeline-list';
import { byUrgency, todayIso } from '@/lib/pipeline-order';
import './pipeline.css';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Sales pipeline | Aksen Workspace' };

const CLOSED = ['won', 'lost'];
// Open leads are loaded in full, because a lead that is still being chased has
// to be on this page however old it is. The cap is a guard against a runaway
// import, not a page size: a one-person pipeline with 500 open leads has a
// different problem than this screen can solve.
const OPEN_LIMIT = 500;
// Closed leads are reference, not work, so only the latest few come along.
const CLOSED_LIMIT = 20;

const columns = {
  id: opportunities.id,
  company: opportunities.company,
  name: opportunities.name,
  email: opportunities.email,
  recommendation: opportunities.recommendation,
  status: opportunities.status,
  desiredOutcome: opportunities.desiredOutcome,
  nextAction: opportunities.nextAction,
  followUpAt: opportunities.followUpAt,
};

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
  // Unowned rows are included deliberately. This is a single-workspace system,
  // and a lead with no owner is far more likely to be one this application
  // failed to stamp than one belonging to somebody else. An enquiry that is
  // captured but invisible is the worst outcome available, so the reader
  // forgives what the writer may get wrong.
  const mine = or(
    eq(opportunities.ownerId, owner),
    isNull(opportunities.ownerId),
  );
  try {
    // This used to load the 30 newest enquiries of any stage and sort those.
    // An older lead with an overdue follow-up or a proposal out simply left
    // the page once 30 newer ones arrived, with nothing to say it had gone.
    const db = getDb();
    const [open, closed] = await Promise.all([
      db
        .select(columns)
        .from(opportunities)
        .where(and(mine, notInArray(opportunities.status, CLOSED)))
        .orderBy(desc(opportunities.createdAt))
        .limit(OPEN_LIMIT),
      db
        .select(columns)
        .from(opportunities)
        .where(and(mine, inArray(opportunities.status, CLOSED)))
        .orderBy(desc(opportunities.updatedAt))
        .limit(CLOSED_LIMIT),
    ]);
    leads = [...open, ...closed];
  } catch {
    loadFailed = true;
  }

  const today = todayIso();
  leads = byUrgency(leads, today);
  const openCount = leads.filter(
    (lead) => !CLOSED.includes(lead.status),
  ).length;

  return (
    <section className="admin-main" id="pipeline">
      <header className="admin-header">
        <div>
          <small>SALES & SCOPING</small>
          <h1>Sales pipeline</h1>
          <p>
            Every open enquiry, most urgent first. Set the stage, the next
            action and when to follow up.
          </p>
        </div>
      </header>
      {/* The add form used to take a third of the width on every visit, beside
          a list that is what this page is opened for. It is one tab away now,
          and the list has the whole width. */}
      <AdminTabs
        label="Sales pipeline"
        tabs={[
          {
            id: 'enquiries',
            label: 'Open enquiries',
            note: loadFailed ? undefined : openCount,
            panel: (
              <section className="admin-panel pipeline-panel">
                {loadFailed ? (
                  <div className="empty-admin" role="alert">
                    <strong>Enquiries could not be loaded.</strong>
                    <span>
                      Check the database connection, then reload this page. No
                      example records are substituted.
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
                      Enquiries arrive from the opportunity mapper, or add
                      someone who came to you directly.
                    </span>
                  </div>
                )}
              </section>
            ),
          },
          { id: 'add', label: 'Add a lead', panel: <AdminAddLead /> },
        ]}
      />
    </section>
  );
}
