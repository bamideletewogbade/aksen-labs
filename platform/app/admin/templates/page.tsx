import { OperationsDesk } from '@/components/operations-desk';
export const metadata = { title: 'Document templates | Aksen Workspace' };
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
          <h1>Document templates</h1>
          <p>
            Reusable documents for discovery, agreement, delivery, launch and
            ongoing care.
          </p>
        </div>
      </header>
      <OperationsDesk mode="templates" initialLead={lead} />
    </section>
  );
}
