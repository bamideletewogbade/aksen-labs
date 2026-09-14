import Link from 'next/link';
import { knowledgeVersion, supportArticles } from '@/lib/support-knowledge';
import { ResponseText } from '@/components/response-text';
export const metadata = { title: 'Support knowledge | Aksen Workspace' };
export default function SupportKnowledge() {
  const articles = supportArticles();
  return (
    <section className="admin-main">
      <header className="admin-header">
        <div>
          <small>ASK AKSEN</small>
          <h1>Support knowledge</h1>
          <p>
            Published business information used to ground the support assistant.
            Version {knowledgeVersion}; {articles.length} reference entries.
          </p>
        </div>
      </header>
      <section className="admin-panel">
        <h2>Review and maintain</h2>
        <p>
          Service and pricing entries come from the same catalogue as the
          website. Update the approved source, review the assistant’s answers,
          and increment the knowledge version when business facts change.
          Conversation messages are not automatically added as business facts.
        </p>
        <p>
          <Link href="/support-demo">Try the support demonstrations</Link> ·{' '}
          <Link href="/admin/support">Review handoffs</Link> ·{' '}
          <Link href="/admin/audit?view=ai">Review AI request logs</Link>
        </p>
      </section>
      {articles.map((article) => (
        <details className="admin-panel" key={article.id}>
          <summary>{article.title}</summary>
          <p>
            <Link href={article.href}>Open reference page</Link>
          </p>
          <ResponseText text={article.content} />
        </details>
      ))}
    </section>
  );
}
