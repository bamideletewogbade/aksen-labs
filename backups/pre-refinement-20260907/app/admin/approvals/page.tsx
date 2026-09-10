import { desc, eq } from 'drizzle-orm';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { getDb } from '@/db';
import { approvals, blogPosts } from '@/db/schema';
import { ApprovalActions } from '@/components/admin-approval-actions';

export const dynamic = 'force-dynamic';

type ApprovalView = { id: string; risk: string; action: string; context: string | null; entityType: string | null; entityId: string | null; postTitle: string | null; postExcerpt: string | null; postContent: string | null };

export default async function AdminApprovalsPage() {
  let pending: ApprovalView[] = []; let databaseReady = true;
  try { pending = await getDb().select({ id: approvals.id, risk: approvals.risk, action: approvals.action, context: approvals.context, entityType: approvals.entityType, entityId: approvals.entityId, postTitle: blogPosts.title, postExcerpt: blogPosts.excerpt, postContent: blogPosts.content }).from(approvals).leftJoin(blogPosts, eq(approvals.entityId, blogPosts.id)).where(eq(approvals.status, 'pending')).orderBy(desc(approvals.createdAt)).limit(30); } catch { databaseReady = false; }

  return (
    <section className="admin-main" id="approvals">
      <header className="admin-header"><div><small>HUMAN REVIEW</small><h1>Review the proposed next move</h1><p>Nothing here has happened yet. Approving an article publishes it straight away.</p></div></header>
      <section className="admin-panel approvals-panel full-panel">
        <div className="panel-head"><div><small>LATEST 30 PENDING DECISIONS</small><h2>{databaseReady ? `${pending.length} waiting` : 'Records unavailable'}</h2></div><ShieldAlert /></div>
        {!databaseReady && <div className="empty-admin" role="alert"><strong>Decisions could not be loaded.</strong><span>Check the database connection and reload. No example decisions are substituted.</span></div>}
        {pending.length ? pending.map((item: ApprovalView) => (
          <div className="approval-card" key={item.id}>
            <span><ShieldAlert /> {item.risk} risk</span>
            <h3>{item.action}</h3>
            <p>{item.context || 'Review the evidence and decide whether this action can continue.'}</p>
            {item.entityType === 'blog_post' && (item.postContent ? <details className="approval-draft"><summary>Read the draft before publishing</summary><h4>{item.postTitle}</h4><p>{item.postExcerpt}</p><div>{item.postContent}</div></details> : <p role="alert">The article is unavailable. Reject this request or restore its draft before approving.</p>)}
            <ApprovalActions id={item.id} />
          </div>
        )) : databaseReady && <div className="empty-admin"><CheckCircle2 /><strong>No pending decisions.</strong><span>Requests appear here when an article is sent for publication.</span></div>}
      </section>
    </section>
  );
}
