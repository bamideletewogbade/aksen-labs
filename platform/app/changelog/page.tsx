import type { Metadata } from 'next';
import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';
import { ArrowUpRight } from 'lucide-react';
import { SiteFooter, SiteNav } from '@/components/site-chrome';
import { PageIntro } from '@/components/page-intro';
import { Reveal } from '@/components/agency-motion';
import { changelogKindLabel } from '@/lib/feedback-board';
import { getDb } from '@/db';
import { changelogEntries, feedbackIdeas } from '@/db/schema';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Changelog | Aksen Labs',
  description:
    'What we shipped, when, and which request asked for it.',
};

type Entry = {
  id: string;
  slug: string;
  title: string;
  body: string;
  releasedOn: string;
  kind: string;
  askedFor: string | null;
  ideaId: string | null;
};

/** Grouped by month, because that is how anyone reads a changelog: they want to
 *  know whether anything happened recently, before they read what it was. */
function byMonth(entries: Entry[]) {
  const groups: { label: string; entries: Entry[] }[] = [];
  for (const entry of entries) {
    // releasedOn is a DATE column, which comes back as YYYY-MM-DD. Parsing it
    // as a local Date would shift it a day west of Greenwich, so the label is
    // built from the string itself.
    const [year, month] = entry.releasedOn.split('-');
    const label = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(
      'en-GB',
      { month: 'long', year: 'numeric' },
    );
    const existing = groups.find((group) => group.label === label);
    if (existing) existing.entries.push(entry);
    else groups.push({ label, entries: [entry] });
  }
  return groups;
}

export default async function ChangelogPage() {
  let entries: Entry[] = [];
  try {
    entries = await getDb()
      .select({
        id: changelogEntries.id,
        slug: changelogEntries.slug,
        title: changelogEntries.title,
        body: changelogEntries.body,
        releasedOn: changelogEntries.releasedOn,
        kind: changelogEntries.kind,
        askedFor: feedbackIdeas.title,
        ideaId: feedbackIdeas.id,
      })
      .from(changelogEntries)
      .leftJoin(feedbackIdeas, eq(changelogEntries.ideaId, feedbackIdeas.id))
      .where(eq(changelogEntries.published, true))
      .orderBy(desc(changelogEntries.releasedOn))
      .limit(120);
  } catch {}

  const months = byMonth(entries);

  return (
    <div className="agency-site refresh-site">
      <SiteNav />
      <main id="main-content">
        <PageIntro
          variant="minimal"
          label="CHANGELOG"
          title={
            <>
              What we shipped,
              <br />
              <em>and who asked for it.</em>
            </>
          }
          text="Every entry is dated, and where somebody on the feedback board asked for it, the entry says so and links back to the request."
          target="/feedback"
          action="Ask for something"
        />
        <section className="agency-container changelog-section">
          {months.length === 0 ? (
            <p className="board-empty">
              Nothing published here yet. The first entry lands with the first
              thing we ship from the board.
            </p>
          ) : (
            months.map((month) => (
              <div className="changelog-month" key={month.label}>
                <h2>{month.label}</h2>
                <div className="changelog-entries">
                  {month.entries.map((entry, index) => (
                    <Reveal
                      as="article"
                      key={entry.id}
                      delay={(index % 3) * 45}
                      className="changelog-entry"
                    >
                      {/* The id is the anchor a shipped board card links to. */}
                      <span id={entry.slug} className="changelog-anchor" />
                      <div className="changelog-entry-top">
                        <span
                          className="changelog-kind"
                          data-kind={entry.kind}
                        >
                          {changelogKindLabel(entry.kind)}
                        </span>
                        <time dateTime={entry.releasedOn}>
                          {entry.releasedOn}
                        </time>
                      </div>
                      <h3>{entry.title}</h3>
                      <p>{entry.body}</p>
                      {entry.askedFor && (
                        <p className="changelog-asked">
                          Asked for on the board: <span>{entry.askedFor}</span>
                        </p>
                      )}
                    </Reveal>
                  ))}
                </div>
              </div>
            ))
          )}
          <aside className="board-footnote">
            <div>
              <p className="agency-eyebrow">MISSING SOMETHING?</p>
              <p>
                If the thing you need is not here, it is probably not built. Say
                so on the board and it gets read.
              </p>
            </div>
            <Link className="agency-text-link" href="/feedback">
              Open the feedback board <ArrowUpRight size={18} />
            </Link>
          </aside>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
