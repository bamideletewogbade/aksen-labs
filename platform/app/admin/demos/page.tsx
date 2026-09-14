import Link from 'next/link';
import { ArrowUpRight, MonitorPlay } from 'lucide-react';
import { OperationsDesk } from '@/components/operations-desk';
import { freeTools } from '@/lib/product-catalog';

export const metadata = { title: 'Demos | Aksen Workspace' };

/**
 * The demos a prospect can see, and the desk for drafting against them.
 *
 * The page used to open straight into the generic operations desk under a
 * heading, with one link to the order demo buried in a paragraph. That left the
 * obvious question unanswered: which demos exist, and where do they live. They
 * come from the same catalogue the public page uses, so this cannot drift out
 * of step with what is actually on the site.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const lead = typeof params.lead === 'string' ? params.lead.slice(0, 100) : '';
  const demos = freeTools.filter((tool) => tool.status === 'Demonstration');

  return (
    <section className="admin-main">
      <header className="admin-header">
        <div>
          <small>MARKETING</small>
          <h1>Service demos</h1>
          <p>
            What a prospect can walk through on the site, and a desk for
            drafting against a demo. WhatsApp is simulated here; no live channel
            is connected.
          </p>
        </div>
        <Link href="/products#free-tools" prefetch={false}>
          See them as a visitor <ArrowUpRight size={16} />
        </Link>
      </header>

      <section className="admin-panel site-inventory">
        <div className="panel-head">
          <div>
            <small>LIVE ON THE SITE</small>
            <h2>
              {demos.length} {demos.length === 1 ? 'demo' : 'demos'} a prospect
              can open
            </h2>
          </div>
          <MonitorPlay />
        </div>
        <ul className="site-inventory-list arrive-stagger">
          {demos.map((demo, index) => (
            <li
              key={demo.slug}
              data-kind="Demo"
              style={{ '--i': index } as React.CSSProperties}
            >
              <div className="site-inventory-head">
                <span className="site-kind">Demo</span>
                <span className="site-status">Fictional data</span>
              </div>
              <h3>{demo.name}</h3>
              <p>{demo.description}</p>
              <div className="site-inventory-actions">
                <Link href={demo.href} prefetch={false}>
                  {demo.action} <ArrowUpRight size={15} />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <OperationsDesk mode="demos" initialLead={lead} />
    </section>
  );
}
