import { and, desc, eq } from 'drizzle-orm';
import { BookOpen } from 'lucide-react';
import { getDb } from '@/db';
import { approvals, blogPosts } from '@/db/schema';
import {
  AdminContentPanel,
  type ContentPost,
} from '@/components/admin-content-panel';
import { AdminCreateArticle } from '@/components/admin-create-article';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Blog articles | Aksen Workspace' };

export default async function AdminContentPage() {
  let allPosts: ContentPost[] = [];
  let awaiting: string[] = [];
  let loadFailed = false;
  try {
    const db = getDb();
    // Neon's HTTP driver costs a round trip per query, so independent reads go
    // together rather than one after the other.
    const [posts, pending] = await Promise.all([
      db.select().from(blogPosts).orderBy(desc(blogPosts.updatedAt)).limit(30),
      db
        .select({ entityId: approvals.entityId })
        .from(approvals)
        .where(
          and(
            eq(approvals.entityType, 'blog_post'),
            eq(approvals.status, 'pending'),
          ),
        ),
    ]);
    allPosts = posts;
    awaiting = pending
      .map((row) => row.entityId)
      .filter((value): value is string => Boolean(value));
  } catch {
    loadFailed = true;
  }

  return (
    <section className="admin-main" id="content">
      <header className="admin-header">
        <div>
          <small>BLOG</small>
          <h1>Blog articles</h1>
          <p>
            AI may research and draft. Publication still needs your approval.
          </p>
        </div>
      </header>
      <div className="admin-layout">
        <section className="admin-panel content-panel">
          <div className="panel-head">
            <div>
              <small>LATEST 30 ARTICLES</small>
              <h2>
                {loadFailed
                  ? 'Records unavailable'
                  : `${allPosts.length} article${allPosts.length === 1 ? '' : 's'}`}
              </h2>
            </div>
            <BookOpen />
          </div>
          {loadFailed ? (
            <div className="empty-admin" role="alert">
              <strong>Articles could not be loaded.</strong>
              <span>Check the database connection and reload.</span>
            </div>
          ) : (
            <AdminContentPanel
              initialPosts={allPosts}
              initialAwaiting={awaiting}
            />
          )}
        </section>
        <AdminCreateArticle />
      </div>
    </section>
  );
}
