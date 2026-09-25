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
  const task = typeof params.task === 'string' ? params.task.slice(0, 50) : '';
  return (
    <section className="admin-main">
      <header className="admin-header">
        <div>
          <small>CLIENT WORK</small>
          <h1>Prepare client drafts</h1>
          <p>
            Prepare enquiry audits, proposals and delivery drafts from your records.
            Review outputs before acting.
          </p>
          <p className="admin-header-aside">
            <Link href="/admin/templates">
              Document templates studio <ArrowUpRight size={15} />
            </Link>
          </p>
        </div>
      </header>
      <OperationsDesk mode="operations" initialLead={lead} initialTask={task} />
    </section>
  );
}
