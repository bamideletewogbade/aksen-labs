import { OperationsDesk } from '@/components/operations-desk';
import Link from 'next/link';
export const metadata = { title: 'Demos | Aksen Workspace' };
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
          <h1>Service demos</h1>
          <p>
            Demonstrate service behaviour using fictional data. WhatsApp is
            simulated here; no live channel is connected.
          </p>
        </div>
      </header>
      <p>
        <Link href="/order-demo">
          Open the connected order demo: enquiry to collection →
        </Link>
      </p>
      <OperationsDesk mode="demos" initialLead={lead} />
    </section>
  );
}
