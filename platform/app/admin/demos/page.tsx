import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { DemoStage } from '@/components/demo-stage';
import { freeTools } from '@/lib/product-catalog';
import './demo-stage.css';

export const metadata = { title: 'Demos | Aksen Workspace' };

/**
 * The demo the founder shows a prospect, and the demos a prospect can open on
 * the site by themselves.
 *
 * The stage comes first because this page is mostly used on a shared screen:
 * pick the business closest to the prospect's, and let them type as a
 * customer. The public demos come from the same catalogue the public page
 * uses, so this list cannot drift out of step with what is on the site.
 */
export default function Page() {
  const demos = freeTools.filter((tool) => tool.status === 'Demonstration');

  return (
    <section className="admin-main">
      <header className="admin-header">
        <div>
          <small>MARKETING</small>
          <h1>Service demos</h1>
          <p>
            Show a prospect what happens when their customers message them.
            Choose the business closest to theirs and let them type as a
            customer. Every business here is fictional, and no message leaves
            this page.
          </p>
        </div>
        <Link href="/products#free-tools" prefetch={false}>
          See the public demos <ArrowUpRight size={16} />
        </Link>
      </header>

      <DemoStage />

      <section className="admin-panel site-inventory">
        <div className="panel-head">
          <div>
            <small>ON THE SITE</small>
            <h2>
              {demos.length} {demos.length === 1 ? 'demo' : 'demos'} a prospect
              can open without you
            </h2>
          </div>
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
    </section>
  );
}
