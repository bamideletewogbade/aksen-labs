import type { Metadata } from 'next';
import Link from 'next/link';
import { and, desc, eq } from 'drizzle-orm';
import { ArrowUpRight } from 'lucide-react';
import { SiteFooter, SiteNav } from '@/components/site-chrome';
import { PageIntro } from '@/components/page-intro';
import { FeedbackBoard, type BoardIdea } from '@/components/feedback-board';
import { getDb } from '@/db';
import { changelogEntries, feedbackIdeas } from '@/db/schema';

// Votes land continuously, so a cached board shows a number that is already
// wrong. Same reasoning as /blog: this deployment has no CDN cache store to
// revalidate into, so declaring one would read as cached and would not be.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Feedback board | Aksen Labs',
  description:
    'Suggest what we should build next, vote on what other people asked for, and see what we decided to do about it.',
};

export default async function FeedbackPage() {
  let ideas: BoardIdea[] = [];
  try {
    // The changelog join is what makes a shipped card worth reading: it carries
    // the entry that says what actually landed, instead of the word "Shipped".
    const rows = await getDb()
      .select({
        id: feedbackIdeas.id,
        title: feedbackIdeas.title,
        body: feedbackIdeas.body,
        status: feedbackIdeas.status,
        statusNote: feedbackIdeas.statusNote,
        voteCount: feedbackIdeas.voteCount,
        shippedSlug: changelogEntries.slug,
      })
      .from(feedbackIdeas)
      .leftJoin(
        changelogEntries,
        and(
          eq(changelogEntries.ideaId, feedbackIdeas.id),
          eq(changelogEntries.published, true),
        ),
      )
      .where(eq(feedbackIdeas.published, true))
      .orderBy(desc(feedbackIdeas.voteCount))
      .limit(200);
    ideas = rows;
  } catch {
    // An empty board is the honest failure here. A board that invents ideas
    // would be inviting votes on things nobody asked for.
  }

  return (
    <div className="agency-site refresh-site">
      <SiteNav />
      <main id="main-content">
        <PageIntro
          variant="board"
          label="FEEDBACK BOARD"
          title={
            <>
              Tell us what to build.
              <br />
              <em>Watch what we do about it.</em>
            </>
          }
          text="Suggest something, vote on what other people asked for, and see where each one got to. Every card carries a status, and a card we said no to carries the reason."
          target="#board"
          action="See the board"
        />
        <section className="agency-container board-section" id="board">
          <FeedbackBoard ideas={ideas} />
          <aside className="board-footnote">
            <div>
              <p className="agency-eyebrow">ABOUT THE NUMBERS</p>
              <p>
                A vote is one device, not one verified person, and we do not
                build by vote count alone. Votes tell us what to look at first.
                What we decide, and why, is written on the card.
              </p>
            </div>
            <Link className="agency-text-link" href="/changelog">
              See what has shipped <ArrowUpRight size={18} />
            </Link>
          </aside>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
