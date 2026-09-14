import { desc } from 'drizzle-orm';
import { MessageSquareText } from 'lucide-react';
import { getDb } from '@/db';
import { conversations } from '@/db/schema';
import {
  AdminConversationList,
  type ConversationView,
} from '@/components/admin-conversation-list';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Conversations | Aksen Workspace' };

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
  const openCount = threads.filter(
    (thread) => thread.status !== 'resolved',
  ).length;

  return (
    <section className="admin-main" id="support">
      <header className="admin-header">
        <div>
          <small>SUPPORT INBOX</small>
          <h1>Conversations</h1>
          <p>
            Saved summaries from Aksen Guide. This is not a full message history
            or a connected reply inbox.
          </p>
        </div>
      </header>
      <section className="admin-panel content-panel full-panel">
        <div className="panel-head">
          <div>
            <small>LATEST 30 THREADS</small>
            <h2>
              {loadFailed
                ? 'Records unavailable'
                : `${openCount} open of ${threads.length}`}
            </h2>
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
