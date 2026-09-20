import Link from 'next/link';
import { sql } from 'drizzle-orm';
import {
  ArrowUpRight,
  BookOpen,
  MessageSquareText,
  Package,
  Sparkles,
} from 'lucide-react';
import { getDb } from '@/db';
import { freeTools, isExternal, products } from '@/lib/product-catalog';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Public site | Aksen Workspace' };

/**
 * What the public can see, and what it has brought in.
 *
 * This page used to render the products array into a two-column grid. There is
 * one product, so it was a single card beside an empty column, under a note
 * saying nothing here changes anything. Half a screen of nothing, describing
 * a fifth of what is actually public.
 *
 * The site has five public things: one product and four free tools. They are
 * one list now, because a visitor does not care which array they came from,
 * and neither does anyone checking what is live. The numbers on top are real
 * reads, so the page says something different tomorrow than it does today,
 * which is the difference between a dashboard and a diagram.
 */

type Entry = {
  slug: string;
  name: string;
  kind: 'Product' | 'Tool' | 'Demo';
  status: string;
  description: string;
  href?: string;
  action?: string;
};

/** One list, in the order a visitor meets them: usable first, then built. */
function publicEntries(): Entry[] {
  return [
    ...freeTools.map(
      (tool): Entry => ({
        slug: tool.slug,
        name: tool.name,
        // A demonstration on fictional data and a working assistant are not the
        // same promise, and the card should not let them look alike.
        kind: tool.status === 'Demonstration' ? 'Demo' : 'Tool',
        status: tool.status,
        description: tool.description,
        href: tool.href,
        action: tool.action,
      }),
    ),
    ...products.map(
      (product): Entry => ({
        slug: product.slug,
        name: product.name,
        kind: 'Product',
        status: product.status,
        description: product.description,
        href: product.href,
        action: product.action,
      }),
    ),
  ];
}

export default async function AdminPublicSitePage() {
  const entries = publicEntries();
  const live = entries.filter((entry) => entry.href).length;

  let articles = { total: 0, published: 0 };
  let enquiries = 0;
  let loadFailed = false;
  try {
    const db = getDb();
    // Neon's HTTP driver costs a round trip per query, so these go together.
    const [posts, recent] = await Promise.all([
      db.execute(
        sql`SELECT count(*)::int AS total,
                   count(*) FILTER (WHERE status='published')::int AS published
              FROM blog_posts`,
      ),
      db.execute(
        sql`SELECT count(*)::int AS n FROM opportunities
             WHERE created_at >= now() - interval '30 days'`,
      ),
    ]);
    articles = {
      total: Number(posts.rows[0]?.total ?? 0),
      published: Number(posts.rows[0]?.published ?? 0),
    };
    enquiries = Number(recent.rows[0]?.n ?? 0);
  } catch {
    loadFailed = true;
  }

  const drafts = articles.total - articles.published;

  return (
    <section className="admin-main">
      <header className="admin-header">
        <div>
          <small>MARKETING</small>
          <h1>Public site</h1>
          <p>
            Everything a visitor can see or use, and what it has brought in over
            the last month.
          </p>
        </div>
        <Link href="/products" prefetch={false}>
          Open the live page <ArrowUpRight size={16} />
        </Link>
      </header>

      <div className="metric-grid arrive-stagger">
        <article style={{ '--i': 0 } as React.CSSProperties}>
          <span>
            <Sparkles /> Usable today
          </span>
          <strong>{live}</strong>
          {/* These three have to add up to the number above them, so products
              with an address are counted here too. They did not used to be,
              because there were none. */}
          <small>
            <b>
              {entries.filter((e) => e.kind === 'Product' && e.href).length}
            </b>{' '}
            products, <b>{entries.filter((e) => e.kind === 'Tool').length}</b>{' '}
            working tools,{' '}
            <b>{entries.filter((e) => e.kind === 'Demo').length}</b>{' '}
            demonstrations
          </small>
        </article>
        <article style={{ '--i': 1 } as React.CSSProperties}>
          <span>
            <Package /> Products
          </span>
          <strong>{products.length}</strong>
          <small>
            <b>{products.filter((p) => p.href).length}</b> with a public address
          </small>
        </article>
        <article style={{ '--i': 2 } as React.CSSProperties}>
          <span>
            <BookOpen /> Articles
          </span>
          <strong>{loadFailed ? '—' : articles.published}</strong>
          <small>
            {loadFailed ? (
              'Records unavailable'
            ) : (
              <>
                published, <b>{drafts}</b> still in draft
              </>
            )}
          </small>
        </article>
        <article style={{ '--i': 3 } as React.CSSProperties}>
          <span>
            <MessageSquareText /> Enquiries
          </span>
          <strong>{loadFailed ? '—' : enquiries}</strong>
          <small>
            {loadFailed ? 'Records unavailable' : 'in the last 30 days'}
          </small>
        </article>
      </div>

      <section className="admin-panel site-inventory">
        <div className="panel-head">
          <div>
            <small>ON THE SITE NOW</small>
            <h2>
              {entries.length} public{' '}
              {entries.length === 1 ? 'thing' : 'things'}
            </h2>
          </div>
          <Package />
        </div>
        <ul className="site-inventory-list arrive-stagger">
          {entries.map((entry, index) => (
            <li
              key={entry.slug}
              data-kind={entry.kind}
              style={{ '--i': index } as React.CSSProperties}
            >
              <div className="site-inventory-head">
                <span className="site-kind">{entry.kind}</span>
                <span className="site-status">{entry.status}</span>
              </div>
              <h3>{entry.name}</h3>
              <p>{entry.description}</p>
              <div className="site-inventory-actions">
                {/* Something with no public address has no page to open, and
                    should say that rather than offer a link going nowhere. A
                    product hosted elsewhere is not a route on this app, so it
                    cannot go through Link: that would 404 inside the admin. */}
                {entry.href ? (
                  isExternal(entry.href) ? (
                    <a
                      href={entry.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {entry.action || 'Open public page'}{' '}
                      <ArrowUpRight size={15} />
                    </a>
                  ) : (
                    <Link href={entry.href} prefetch={false}>
                      {entry.action || 'Open public page'}{' '}
                      <ArrowUpRight size={15} />
                    </Link>
                  )
                ) : (
                  <span className="site-unlisted">No public address yet</span>
                )}
                <Link
                  href={`/admin/pipeline?q=${encodeURIComponent(entry.name)}`}
                  prefetch={false}
                >
                  Related enquiries <ArrowUpRight size={15} />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <aside className="admin-info-note">
        <strong>Where this comes from</strong>
        <p>
          Names, descriptions and availability live in the site source
          (lib/product-catalog.ts) and change on deploy. The counts above are
          read live. Articles are the part you edit here, under Articles.
        </p>
      </aside>
    </section>
  );
}
