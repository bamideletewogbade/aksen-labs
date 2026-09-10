import { desc, eq } from 'drizzle-orm';
import { ArrowUpRight, BookOpen, Clock3 } from 'lucide-react';
import { SiteChrome } from '@/components/site-chrome';
import { getDb } from '@/db';
import { blogPosts } from '@/db/schema';

export const dynamic = 'force-dynamic';
const fallback = [
  { id:'practice', slug:'what-a-useful-ai-agent-actually-does', title:'What a useful AI agent actually does at work', excerpt:'A practical way to separate impressive demos from systems that genuinely help customers and teams.', category:'AI in Practice', readingMinutes:5, publishedAt:new Date('2026-09-01'), authorName:'Aksen Labs' },
  { id:'work', slug:'automate-the-repetition-not-the-judgement', title:'Automate the repetition, not the judgement', excerpt:'Where people should remain in control, and where a well-designed agent can quietly return hours to the team.', category:'Work and Productivity', readingMinutes:4, publishedAt:new Date('2026-08-28'), authorName:'Aksen Labs' },
  { id:'build', slug:'why-we-are-building-aksen-os', title:'Why we are building Aksen OS in-house', excerpt:'The operating system behind our own leads, projects, agents, approvals and learning.', category:'Build Notes', readingMinutes:6, publishedAt:new Date('2026-08-24'), authorName:'Aksen Labs' },
];
type PostCard = { id:string; slug:string; title:string; excerpt:string; category:string; readingMinutes:number; publishedAt:Date|null; authorName:string };

export default async function BlogPage() {
  let posts:PostCard[] = [];
  try { posts = await getDb().select().from(blogPosts).where(eq(blogPosts.status, 'published')).orderBy(desc(blogPosts.publishedAt)).limit(30); } catch {}
  if (!posts.length) posts = fallback;
  return <><SiteChrome /><main className="journal-page"><header className="journal-hero"><div className="eyebrow"><span />AKSEN JOURNAL</div><h1>Clear thinking about AI, work and building better businesses.</h1><p>Practical lessons from the systems we test, the workflows we redesign and the questions African businesses are asking now.</p></header><section className="journal-grid">{posts.map((post,index) => <article className={index === 0 ? 'featured-post' : ''} key={post.id}><div className="post-number">{String(index+1).padStart(2,'0')}</div><div><span className="post-category">{post.category}</span><h2>{post.title}</h2><p>{post.excerpt}</p><footer><span><Clock3 /> {post.readingMinutes} min read</span><span>{post.authorName}</span></footer></div><a href={`/blog/${post.slug}`} aria-label={`Read ${post.title}`}><ArrowUpRight /></a></article>)}</section><aside className="journal-note"><BookOpen /><div><strong>Built from the work, not the hype.</strong><p>Every article should help a founder or operator make a clearer decision.</p></div></aside></main></>;
}
