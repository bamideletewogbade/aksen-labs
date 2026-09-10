import { and, eq } from 'drizzle-orm';
import { ArrowLeft, Clock3 } from 'lucide-react';
import { SiteChrome } from '@/components/site-chrome';
import { getDb } from '@/db';
import { blogPosts } from '@/db/schema';

export const dynamic = 'force-dynamic';
type Article = { title:string; category:string; excerpt:string; content:string; readingMinutes:number; authorName:string; publishedAt:Date|null };
export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; let post:Article|null = null;
  try { [post] = await getDb().select().from(blogPosts).where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, 'published'))).limit(1); } catch {}
  if (!post) post = { title:'A useful AI system begins with the work', category:'AI in Practice', excerpt:'Start with the customer or team outcome, then decide where intelligence belongs.', content:'The strongest AI projects do not begin with a model. They begin with a moment in the business that is slow, repetitive, inconsistent or easy to lose.\n\nMap that moment clearly. Decide what information must be correct, what action is useful, and where a person must remain in control. Only then should the technology enter the conversation.\n\nThat discipline turns AI from a demonstration into a dependable part of work.', readingMinutes:4, authorName:'Aksen Labs', publishedAt:new Date() };
  return <><SiteChrome /><main className="article-page"><a className="back-link" href="/blog"><ArrowLeft /> Back to the journal</a><header><span>{post.category}</span><h1>{post.title}</h1><p>{post.excerpt}</p><div><Clock3 /> {post.readingMinutes} min read · {post.authorName}</div></header><article>{String(post.content).split(/\n\n+/).map((paragraph:string,index:number) => <p key={index}>{paragraph}</p>)}</article><footer><strong>Have a workflow worth improving?</strong><a href="/agent-mapper">Map the opportunity <ArrowLeft /></a></footer></main></>;
}
