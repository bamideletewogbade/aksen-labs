/* oxlint-disable next/no-img-element -- Images use pre-encoded WebP sizes; the Workers deployment needs no image optimisation service. */
import Link from 'next/link';
import type { Metadata } from 'next';
import { desc, eq } from 'drizzle-orm';
import { ArrowUpRight } from 'lucide-react';
import { SiteFooter, SiteNav } from '@/components/site-chrome';
import { PageIntro } from '@/components/page-intro';
import { Reveal } from '@/components/agency-motion';
import { getDb } from '@/db';
import { blogPosts } from '@/db/schema';
import { editorialPosts } from '@/lib/editorial-posts';
// Published articles change rarely and this should be cached, but ISR does not
// engage on this deployment: with `export const revalidate`, the built Worker
// still answered `Cache-Control: no-store, must-revalidate` with an X-Vinext-Cache
// MISS. The hosting config declares no CDN cache store (.openai/hosting.json has
// d1 and r2 null), so the cache adapter has nothing to write to. Left dynamic
// rather than carrying a setting that reads as cached and is not.
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Blog | Aksen Labs',
  description:
    'Practical ideas about technology, AI and building better businesses.',
};
type PostCard = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readingMinutes: number;
  publishedAt: Date | null;
  authorName: string;
};
export default async function BlogPage() {
  let posts: PostCard[] = [];
  try {
    posts = await getDb()
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.status, 'published'))
      .orderBy(desc(blogPosts.publishedAt))
      .limit(30);
  } catch {}
  if (!posts.length) posts = editorialPosts;
  return (
    <div className="agency-site refresh-site">
      <SiteNav />
      <main id="main-content">
        <PageIntro
          variant="blog"
          target="#latest-articles"
          action="Read the latest"
          label="THE BLOG"
          title={
            <>
              Useful ideas.
              <br />
              <em>For better business.</em>
            </>
          }
          text="Practical thinking about digital experiences, business systems and AI. Written to help you make your next decision."
        />
        <section
          id="latest-articles"
          className="agency-container refresh-blog-grid"
          aria-label="Latest articles"
        >
          {posts.map((post, index) => (
            <Reveal as="article" key={post.id} delay={(index % 3) * 45}>
              <span className="refresh-small-index">{post.category}</span>
              {index === 0 && (
                <img
                  src="/agency-intelligence-768.webp"
                  alt="Connected data layers around a glass intelligence core"
                  width="768"
                  height="512"
                  loading="lazy"
                />
              )}
              <h2>
                <Link href={`/blog/${post.slug}`}>
                  {post.title}
                  <ArrowUpRight size={20} />
                </Link>
              </h2>
              <p>{post.excerpt}</p>
              <span className="refresh-post-meta">
                {post.readingMinutes} min read · {post.authorName}
              </span>
            </Reveal>
          ))}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
