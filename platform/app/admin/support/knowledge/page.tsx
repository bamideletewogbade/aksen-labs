import Link from 'next/link';
import { knowledgeVersion, supportArticles } from '@/lib/support-knowledge';
import { KnowledgeConsole } from '@/components/knowledge-console';

export const metadata = { title: 'Help answers | Aksen Workspace' };

export default function SupportKnowledge() {
  const articles = supportArticles();
  // Derived here rather than in the browser: it is the same arithmetic either
  // way, and the page then renders complete instead of filling in after load.
  const words = articles.reduce(
    (total, article) => total + article.keywords.split(/\s+/).filter(Boolean).length,
    0,
  );
  // An entry with few retrieval words is hard to reach, and the only previous
  // way to discover that was a customer asking a question that missed.
  const thin = articles.filter(
    (article) => article.keywords.split(/\s+/).filter(Boolean).length < 6,
  );

  return (
    <section className="admin-main">
      <header className="admin-header">
        <div>
          <small>ASK AKSEN</small>
          <h1>Help answers</h1>
          <p>
            Everything the public assistant is allowed to answer from. It
            cannot invent a fact that is not here.
          </p>
        </div>
        <dl className="knowledge-stats">
          <div>
            <dt>Entries</dt>
            <dd>{articles.length}</dd>
          </div>
          <div>
            <dt>Retrieval words</dt>
            <dd>{words}</dd>
          </div>
          <div>
            <dt>Version</dt>
            <dd>{knowledgeVersion}</dd>
          </div>
        </dl>
      </header>

      {thin.length > 0 && (
        <p className="knowledge-warning">
          <strong>
            {thin.length} {thin.length === 1 ? 'entry has' : 'entries have'}{' '}
            very few retrieval words
          </strong>
          {thin.map((article) => article.title).join(', ')}. Entries are found
          by word overlap, so a thin one is unlikely to be reached however good
          it is. Use the preview below to check.
        </p>
      )}

      <KnowledgeConsole entries={articles} />

      <section className="admin-panel knowledge-maintain">
        <h2>Keeping it true</h2>
        <p>
          Most entries are assembled from the same modules the public site
          renders, so the way to change an answer is to change the source. Each
          entry says which one. Increment the knowledge version when a business
          fact changes. Conversations are never added as facts automatically.
        </p>
        <p className="knowledge-links">
          <Link href="/support-demo">Try the demonstrations</Link>
          <Link href="/admin/support">Review handoffs</Link>
          <Link href="/admin/audit?view=ai">AI request log</Link>
        </p>
      </section>
    </section>
  );
}
