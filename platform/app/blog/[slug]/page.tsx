import Link from 'next/link';
import { and, eq } from 'drizzle-orm';
import { Reveal } from '@/components/agency-motion';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { notFound } from 'next/navigation';
import { SiteFooter, SiteNav } from '@/components/site-chrome';
import { getDb } from '@/db';
import { blogPosts } from '@/db/schema';
import { editorialPosts } from '@/lib/editorial-posts';
// See app/blog/page.tsx: ISR does not engage on this deployment, so this stays
// dynamic rather than carrying a setting that reads as cached and is not.
export const dynamic = 'force-dynamic';
type Article = {
  title: string;
  category: string;
  excerpt: string;
  content: string;
  readingMinutes: number;
  authorName: string;
  publishedAt: Date | null;
};
async function findArticle(slug: string): Promise<Article | undefined> {
  try {
    const [post] = await getDb()
      .select()
      .from(blogPosts)
      .where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, 'published')))
      .limit(1);
    if (post) return post;
  } catch {}
  return editorialPosts.find((post) => post.slug === slug);
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await findArticle(slug);
  return {
    title: post
      ? `${post.title} | Aksen Labs Blog`
      : 'Article not found | Aksen Labs',
    description: post?.excerpt,
  };
}
export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await findArticle(slug);
  if (!post) notFound();
  return (
    <div className="agency-site refresh-site">
      <SiteNav />
      <main id="main-content" className="refresh-article">
        <header className="opening-article">
          <Reveal>
            <Link className="agency-text-link" href="/blog">
              <ArrowLeft size={16} /> Back to the blog
            </Link>
            <p className="agency-eyebrow">{post.category}</p>
            <h1>{post.title}</h1>
            <p className="refresh-article-deck">{post.excerpt}</p>
          </Reveal>
        </header>
        <div className="refresh-article-body">
          <article>
            {String(post.content)
              .split(/\n\n+/)
              .map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
          </article>
          <aside className="refresh-article-rail">
            <dl>
              <div>
                <dt>READING TIME</dt>
                <dd>{post.readingMinutes} min</dd>
              </div>
              <div>
                <dt>WRITTEN BY</dt>
                <dd>{post.authorName}</dd>
              </div>
              {post.publishedAt && (
                <div>
                  <dt>PUBLISHED</dt>
                  <dd>
                    {new Date(post.publishedAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </dd>
                </div>
              )}
            </dl>
            <Link className="agency-text-link" href="/agent-mapper">
              Discuss your business <ArrowUpRight size={16} />
            </Link>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
