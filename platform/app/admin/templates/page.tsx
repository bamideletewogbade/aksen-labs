import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
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
          <small>CLIENT WORK & AGENCY OPERATIONS</small>
          <h1>Document templates studio</h1>
          <p>
            Standard operating documents for discovery, agreement, delivery, launch and
            ongoing care. Grounded in clear client scope and high-conviction delivery.
          </p>
          <p className="admin-header-aside">
            <Link href="/admin/operations">
              Prepare client drafts with AI <ArrowUpRight size={15} />
            </Link>
          </p>
        </div>
      </header>
      <OperationsDesk mode="templates" initialLead={lead} />
    </section>
  );
}
