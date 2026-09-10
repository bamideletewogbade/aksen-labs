import { and, desc, eq } from 'drizzle-orm';
import { BookOpen } from 'lucide-react';
import { getDb } from '@/db';
import { approvals, blogPosts } from '@/db/schema';
import { AdminContentPanel, type ContentPost } from '@/components/admin-content-panel';
import { AdminCreateArticle } from '@/components/admin-create-article';

export const dynamic = 'force-dynamic';

export default async function AdminContentPage() {
  let allPosts: ContentPost[] = [];
  let awaiting: string[] = [];
  let loadFailed = false;
  try {
    const db = getDb();
    allPosts = await db.select().from(blogPosts).orderBy(desc(blogPosts.updatedAt)).limit(30);
    const pending = await db.select({ entityId: approvals.entityId }).from(approvals)
      .where(and(eq(approvals.entityType, 'blog_post'), eq(approvals.status, 'pending')));
    awaiting = pending.map((row) => row.entityId).filter((value): value is string => Boolean(value));
  } catch { loadFailed = true; }

  return (
    <section className="admin-main" id="content">
      <header className="admin-header"><div><small>JOURNAL</small><h1>Review, publish and manage articles</h1><p>AI may research and draft. Publication still needs your approval.</p></div></header>
      <div className="admin-layout">
        <section className="admin-panel content-panel">
          <div className="panel-head"><div><small>LATEST 30 ARTICLES</small><h2>{loadFailed ? 'Records unavailable' : `${allPosts.length} article${allPosts.length === 1 ? '' : 's'}`}</h2></div><BookOpen /></div>
          {loadFailed ? <div className="empty-admin" role="alert"><strong>Articles could not be loaded.</strong><span>Check the database connection and reload.</span></div> : <AdminContentPanel initialPosts={allPosts} initialAwaiting={awaiting} />}
        </section>
        <AdminCreateArticle />
      </div>
    </section>
  );
}
