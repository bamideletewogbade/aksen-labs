import { OperationsDesk } from '@/components/operations-desk';
export const metadata = { title: 'Operations desk | Aksen Workspace' };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const lead = typeof params.lead === 'string' ? params.lead.slice(0, 100) : '';
  return (
    <section className="admin-main">
      <header className="admin-header">
        <div>
          <small>AGENCY OPERATIONS</small>
          <h1>Operations desk</h1>
          <p>
            Prepare enquiry, proposal and delivery drafts from your records.
            Review outputs before acting.
          </p>
        </div>
      </header>
      <OperationsDesk mode="operations" initialLead={lead} />
    </section>
  );
}
