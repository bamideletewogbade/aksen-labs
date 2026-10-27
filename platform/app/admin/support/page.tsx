import Link from 'next/link';
import { desc } from 'drizzle-orm';
import { ArrowUpRight, MessageSquareText } from 'lucide-react';
import { getDb } from '@/db';
import { conversations } from '@/db/schema';
import {
  AdminConversationList,
  type ConversationView,
} from '@/components/admin-conversation-list';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Messages | Aksen Workspace' };

export default async function AdminSupportPage() {
  let threads: ConversationView[] = [];
  let loadFailed = false;
  try {
    threads = await getDb()
      .select()
      .from(conversations)
      .orderBy(desc(conversations.updatedAt))
      .limit(30);
  } catch {
    loadFailed = true;
  }
  return (
    <section className="admin-main" id="support">
      <header className="admin-header">
        <div>
          <small>CONVERSATIONS</small>
          <h1>Guide conversations</h1>
          <p>
            Saved summaries from Aksen Guide. This is not a full message history
            or a connected reply inbox.
          </p>
        </div>
        {/* Guide answers had its own tab in Sales. It is what shapes these
            conversations, so it lives one link away from them instead. */}
        <Link href="/admin/support/knowledge" prefetch={false}>
          Edit Guide answers <ArrowUpRight size={16} />
        </Link>
      </header>
      <section className="admin-panel content-panel full-panel">
        <div className="panel-head">
          <div>
            <small>LATEST 30 THREADS</small>
            {/* The live count is the list's own, which changes as threads are
                resolved; this heading only names the panel. */}
            <h2>{loadFailed ? 'Records unavailable' : 'Visitor handoffs'}</h2>
          </div>
          <MessageSquareText />
        </div>
        {loadFailed ? (
          <div className="empty-admin" role="alert">
            <strong>Conversations could not be loaded.</strong>
            <span>Check the database connection and reload.</span>
          </div>
        ) : threads.length ? (
          <AdminConversationList initialThreads={threads} />
        ) : (
          <div className="empty-admin">
            <MessageSquareText />
            <strong>Nothing here yet.</strong>
            <span>
              Successfully saved Guide conversation summaries will appear here.
            </span>
          </div>
        )}
      </section>
    </section>
  );
}
