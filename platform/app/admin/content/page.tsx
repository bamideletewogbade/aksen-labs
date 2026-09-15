import { and, desc, eq } from 'drizzle-orm';
import { BookOpen, ShieldAlert } from 'lucide-react';
import { getDb } from '@/db';
import { approvals, blogPosts } from '@/db/schema';
import {
  AdminContentPanel,
  type ContentPost,
} from '@/components/admin-content-panel';
import { AdminCreateArticle } from '@/components/admin-create-article';
import { ApprovalActions } from '@/components/admin-approval-actions';
import { EditorialDesk } from '@/components/editorial-desk';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Articles | Aksen Workspace' };

export default async function AdminContentPage() {
  let allPosts: ContentPost[] = [];
  let awaiting: string[] = [];
  let decisions: {
    id: string;
    entityId: string | null;
    action: string;
    context: string | null;
  }[] = [];
  let loadFailed = false;
  try {
    const db = getDb();
    // Neon's HTTP driver costs a round trip per query, so independent reads go
    // together rather than one after the other.
    const [posts, pending] = await Promise.all([
      db.select().from(blogPosts).orderBy(desc(blogPosts.updatedAt)).limit(30),
      // The decision itself, not just which posts are waiting. Approving is a
      // step in publishing an article, so it belongs beside the drafts rather
      // than on a page of its own that is empty almost all of the time.
      db
        .select({
          id: approvals.id,
          entityId: approvals.entityId,
          action: approvals.action,
          context: approvals.context,
        })
        .from(approvals)
        .where(
          and(
            eq(approvals.entityType, 'blog_post'),
            eq(approvals.status, 'pending'),
          ),
        ),
    ]);
    allPosts = posts;
    decisions = pending;
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
          <h1>Articles</h1>
          <p>
            AI may research and draft. Publication still needs your approval.
          </p>
        </div>
      </header>
      <EditorialDesk />
      {/* Absent when nothing is waiting, which is almost always. A queue that
          is empty by design should not occupy space by default, which is the
          argument for it not being in the sidebar either. */}
      {decisions.length > 0 && (
        <section className="admin-panel decision-panel arrive" id="waiting">
          <div className="panel-head">
            <div>
              <small>WAITING FOR YOU</small>
              <h2>
                {decisions.length}{' '}
                {decisions.length === 1 ? 'article' : 'articles'} ready to
                publish
              </h2>
            </div>
            <ShieldAlert />
          </div>
          <p className="decision-note">
            Approving publishes immediately. Nothing here is live yet.
          </p>
          <ul className="decision-list">
            {decisions.map((decision) => (
              <li key={decision.id}>
                <span>
                  <strong>{decision.action}</strong>
                  {decision.context && <small>{decision.context}</small>}
                </span>
                <ApprovalActions id={decision.id} />
              </li>
            ))}
          </ul>
        </section>
      )}
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
