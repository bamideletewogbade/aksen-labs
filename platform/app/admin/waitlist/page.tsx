import Link from 'next/link';
import { desc, sql } from 'drizzle-orm';
import {
  ArrowUpRight,
  MailPlus,
  MessageSquareQuote,
  Users,
} from 'lucide-react';
import { getDb } from '@/db';
import { productWaitlist } from '@/db/schema';
import { products } from '@/lib/product-catalog';
import './waitlist.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Product waitlist | Aksen Workspace' };

/**
 * Who is waiting on a product that has not opened yet.
 *
 * Read-only on purpose. There is nothing to decide about a signup: the person
 * either gets an email when the product opens or they do not, and that happens
 * once, from here, by hand. Anyone who turns into a real conversation belongs
 * in the sales pipeline, which is where the work of following up already lives.
 */

type Signup = {
  id: string;
  createdAt: Date;
  productSlug: string;
  email: string;
  hopedFor: string | null;
};

/** Rows outlive the name they were written under. A signup made when the
 *  product was called CV Forge is a person waiting on Aksen Careers, so the
 *  lookup reads the old slugs too rather than printing a raw string at you. */
function productName(slug: string): string {
  const product = products.find(
    (entry) => entry.slug === slug || entry.formerSlugs?.includes(slug),
  );
  return product?.name ?? slug;
}

function when(date: Date): string {
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function AdminWaitlistPage() {
  let signups: Signup[] = [];
  let totals = { total: 0, withNote: 0, recent: 0 };
  let loadFailed = false;
  try {
    const db = getDb();
    // Neon's HTTP driver costs a round trip per query, so these go together.
    const [rows, counted] = await Promise.all([
      db
        .select({
          id: productWaitlist.id,
          createdAt: productWaitlist.createdAt,
          productSlug: productWaitlist.productSlug,
          email: productWaitlist.email,
          hopedFor: productWaitlist.hopedFor,
        })
        .from(productWaitlist)
        .orderBy(desc(productWaitlist.createdAt))
        .limit(200),
      db.execute(
        sql`SELECT count(*)::int AS total,
                   count(*) FILTER (WHERE hoped_for IS NOT NULL)::int AS with_note,
                   count(*) FILTER (WHERE created_at >= now() - interval '30 days')::int AS recent
              FROM product_waitlist`,
      ),
    ]);
    signups = rows;
    totals = {
      total: Number(counted.rows[0]?.total ?? 0),
      withNote: Number(counted.rows[0]?.with_note ?? 0),
      recent: Number(counted.rows[0]?.recent ?? 0),
    };
  } catch {
    loadFailed = true;
  }

  const waiting = products.filter((product) => !product.href);
  // Every product has opened, so nobody new can join and everyone already on
  // the list is owed the email. That is a different page from one still
  // collecting addresses, and it should not read like the same one.
  const allOpen = waiting.length === 0;
  const opened = products.filter((product) => product.href);

  return (
    <section className="admin-main" id="waitlist">
      <header className="admin-header">
        <div>
          <small>DEMAND BEFORE LAUNCH</small>
          <h1>Product waitlist</h1>
          <p>
            {allOpen
              ? 'People who asked to be told when a product opens, newest first. Everything on the list has opened, so these are addresses to write to once, by hand. Nothing is sent automatically.'
              : 'People who asked to be told when a product opens, newest first. The products page captures these; nothing is sent to them automatically.'}
          </p>
        </div>
        <Link href="/products#our-products" prefetch={false}>
          Open the live page <ArrowUpRight size={16} />
        </Link>
      </header>

      <div className="metric-grid arrive-stagger">
        <article style={{ '--i': 0 } as React.CSSProperties}>
          <span>
            <Users /> {allOpen ? 'Owed an email' : 'Waiting'}
          </span>
          <strong>{loadFailed ? '—' : totals.total}</strong>
          <small>
            {loadFailed ? (
              'Records unavailable'
            ) : allOpen ? (
              opened.length === 1 ? (
                <>
                  <b>{opened[0]?.name}</b> has opened, list closed
                </>
              ) : (
                <>
                  <b>{opened.length} products</b> have opened, list closed
                </>
              )
            ) : (
              <>
                across <b>{waiting.length}</b> unreleased{' '}
                {waiting.length === 1 ? 'product' : 'products'}
              </>
            )}
          </small>
        </article>
        <article style={{ '--i': 1 } as React.CSSProperties}>
          <span>
            <MailPlus /> Last 30 days
          </span>
          <strong>{loadFailed ? '—' : totals.recent}</strong>
          <small>
            {loadFailed ? 'Records unavailable' : 'signed up recently'}
          </small>
        </article>
        <article style={{ '--i': 2 } as React.CSSProperties}>
          <span>
            <MessageSquareQuote /> Said why
          </span>
          <strong>{loadFailed ? '—' : totals.withNote}</strong>
          <small>
            {loadFailed
              ? 'Records unavailable'
              : 'left a line about what they want'}
          </small>
        </article>
      </div>

      <section className="admin-panel full-panel">
        <div className="panel-head">
          <div>
            <small>LATEST 200 SIGNUPS</small>
            <h2>
              {loadFailed ? 'Records unavailable' : `${signups.length} shown`}
            </h2>
          </div>
          <Users />
        </div>
        {loadFailed ? (
          <div className="empty-admin" role="alert">
            <strong>The waitlist could not be loaded.</strong>
            <span>Check the database connection and reload.</span>
          </div>
        ) : signups.length ? (
          <ol className="waitlist-list">
            {signups.map((signup) => (
              <li key={signup.id}>
                <span className="waitlist-who">
                  {/* The whole point of the row is writing to this person once
                      the product opens, so the address is the thing you click. */}
                  <a href={`mailto:${signup.email}`}>{signup.email}</a>
                  <span className="waitlist-product">
                    {productName(signup.productSlug)}
                  </span>
                  {signup.hopedFor ? (
                    <p className="waitlist-hoped">{signup.hopedFor}</p>
                  ) : (
                    <span className="waitlist-silent">
                      Address only, no note
                    </span>
                  )}
                </span>
                <time>{when(signup.createdAt)}</time>
              </li>
            ))}
          </ol>
        ) : (
          <div className="empty-admin">
            <Users />
            <strong>Nobody has signed up yet.</strong>
            <span>
              {allOpen
                ? 'The form only appears under a product with no public address, and every product has one, so nothing can arrive here now.'
                : 'The form sits on the products page under each product that has no public address.'}
            </span>
          </div>
        )}
      </section>

      <aside className="admin-info-note">
        <strong>What happens next</strong>
        {allOpen ? (
          <p>
            Nothing, until you send it. There is no scheduled email behind this
            list. The product now has a public address in
            lib/product-catalog.ts, so the form is gone from the site and no new
            signup can arrive. Everyone above asked to be told, and has not
            been. Write to them once, then this page is a record rather than a
            queue.
          </p>
        ) : (
          <p>
            Nothing, until you send it. There is no scheduled email behind this
            list. When a product opens, write to these addresses once, then give
            the product a public address in lib/product-catalog.ts, which
            removes the form from the site and closes the list.
          </p>
        )}
      </aside>
    </section>
  );
}
