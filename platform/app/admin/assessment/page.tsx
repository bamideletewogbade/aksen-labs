import { and, desc, eq, isNull, notInArray, or } from 'drizzle-orm';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { opportunities } from '@/db/schema';
import { AssessmentDesk, type LeadOption } from '@/components/assessment-desk';
import { companyName } from '@/lib/company-name';
import './assessment.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Assessment | Aksen Workspace' };

/**
 * The free assessment, run with the owner. It replaced the "Free tools" page,
 * which was the visitors' tools seen from inside and had no job of its own.
 * This one has the job the playbook gives the first real conversation: find
 * where the business is losing orders, customers or time, in the owner's own
 * words, and leave with a next step and a date.
 */
export default async function AssessmentPage({
  searchParams,
}: {
  searchParams: Promise<{ lead?: string }>;
}) {
  const { lead } = await searchParams;
  const user = await getChatGPTUser();
  const owner = user?.userId ?? '';
  let leads: LeadOption[] = [];
  try {
    const rows = await getDb()
      .select({
        id: opportunities.id,
        company: opportunities.company,
        name: opportunities.name,
        status: opportunities.status,
      })
      .from(opportunities)
      .where(
        and(
          or(eq(opportunities.ownerId, owner), isNull(opportunities.ownerId)),
          notInArray(opportunities.status, ['won', 'lost']),
        ),
      )
      .orderBy(desc(opportunities.updatedAt))
      .limit(200);
    leads = rows.map((row) => ({
      id: row.id,
      business: companyName(row.company),
      person: row.name,
      status: row.status,
    }));
  } catch {
    // The page still works for a business met for the first time.
  }
  return (
    <section className="admin-main assessment-page">
      <AssessmentDesk
        leads={leads}
        initialLeadId={typeof lead === 'string' ? lead : ''}
      />
    </section>
  );
}
