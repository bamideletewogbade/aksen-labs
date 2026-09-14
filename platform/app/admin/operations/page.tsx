import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { OperationsDesk } from '@/components/operations-desk';
export const metadata = { title: 'Client drafts | Aksen Workspace' };
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
          <small>CLIENT WORK</small>
          <h1>Prepare client drafts</h1>
          <p>
            Prepare enquiry, proposal and delivery drafts from your records.
            Review outputs before acting.
          </p>
          {/* The templates page no longer has a sidebar entry, because the same
              templates are pickable here and this is where you reach for one.
              The link keeps the library findable from the place it is used. */}
          <p className="admin-header-aside">
            <Link href="/admin/templates">
              Read the document templates <ArrowUpRight size={15} />
            </Link>
          </p>
        </div>
      </header>
      <OperationsDesk mode="operations" initialLead={lead} />
    </section>
  );
}
