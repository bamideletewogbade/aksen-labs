import Link from 'next/link';
import { desc, sql } from 'drizzle-orm';
import { ArrowUpRight, Inbox, MessagesSquare, ThumbsUp } from 'lucide-react';
import { getDb } from '@/db';
import { feedbackIdeas } from '@/db/schema';
import {
  AdminFeedback,
  type AdminIdea,
  type TriageState,
} from '@/components/admin-feedback';
import { asDate, asText, triageDue } from '@/lib/feedback-triage';
import './feedback.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Feedback board | Aksen Workspace' };

/**
 * Where a public suggestion becomes a decision.
 *
 * Nothing on the public board got there without passing through this page, and
 * that is deliberate: the board is a page on the marketing site that strangers
 * write. Triage can read a submission and propose a reading of it. Publishing
 * it, moving it, and saying what shipped are done here, by a person.
 */
export default async function AdminFeedbackPage() {
  let ideas: AdminIdea[] = [];
  let totals = { waiting: 0, live: 0, votes: 0 };
  let loadFailed = false;
  // Its own try, and its own default. A deployment that has the board tables but
  // not the triage one should still show the board; the panel then says triage
  // is not set up rather than the whole page reporting a failure.
  let triage: TriageState = {
    configured: false,
    enabled: false,
    maxPerDay: 40,
    lastRunAt: null,
    lastNote: null,
    running: false,
    waiting: 0,
    reason: 'Triage is not set up on this deployment.',
  };
  try {
    const [row] = (
      await getDb().execute(
        // `running` is decided by Postgres rather than here. The lock is taken
        // and released against the database clock, so reading it against the
        // app server's clock is comparing two clocks that can disagree.
        sql`SELECT enabled, max_per_day, last_run_at, last_note,
                   (running_until IS NOT NULL AND running_until > now()) AS running
              FROM feedback_triage_settings WHERE id='default'`,
      )
    ).rows;
    const verdict = await triageDue();
    if (row)
      triage = {
        configured: true,
        enabled: Boolean(row.enabled),
        maxPerDay: Number(row.max_per_day ?? 40),
        lastRunAt: asDate(row.last_run_at)?.toISOString() ?? null,
        lastNote: asText(row.last_note),
        running: Boolean(row.running),
        waiting: verdict.due ? verdict.waiting : 0,
        reason: verdict.due ? null : verdict.reason,
      };
  } catch {}
  try {
    const db = getDb();
    // Neon's HTTP driver costs a round trip per query, so these go together.
    const [rows, counted] = await Promise.all([
      db
        .select()
        .from(feedbackIdeas)
        .orderBy(desc(feedbackIdeas.createdAt))
        .limit(300),
      db.execute(
        sql`SELECT count(*) FILTER (WHERE NOT published)::int AS waiting,
                   count(*) FILTER (WHERE published)::int AS live,
                   coalesce(sum(vote_count) FILTER (WHERE published), 0)::int AS votes
              FROM feedback_ideas`,
      ),
    ]);
    ideas = rows.map((row) => ({
      id: row.id,
      // Serialised here rather than in the client: a Date crossing the server
      // boundary arrives as a string anyway, and the type should say so.
      createdAt: row.createdAt.toISOString(),
      title: row.title,
      body: row.body,
      authorEmail: row.authorEmail,
      status: row.status,
      statusNote: row.statusNote,
      voteCount: row.voteCount,
      published: row.published,
      mergedInto: row.mergedInto,
      triageSummary: row.triageSummary,
      triageSize: row.triageSize,
      triagedAt: row.triagedAt ? row.triagedAt.toISOString() : null,
    }));
    totals = {
      waiting: Number(counted.rows[0]?.waiting ?? 0),
      live: Number(counted.rows[0]?.live ?? 0),
      votes: Number(counted.rows[0]?.votes ?? 0),
    };
  } catch {
    loadFailed = true;
  }

  return (
    <section className="admin-main" id="feedback">
      <header className="admin-header">
        <div>
          <small>WHAT PEOPLE ARE ASKING FOR</small>
          <h1>Feedback board</h1>
          <p>
            Suggestions from the public board. Nothing appears on the site until
            you publish it here, and nothing is built because it won a vote.
          </p>
        </div>
        <Link href="/feedback" prefetch={false}>
          Open the live board <ArrowUpRight size={16} />
        </Link>
      </header>

      <div className="metric-grid arrive-stagger">
        <article style={{ '--i': 0 } as React.CSSProperties}>
          <span>
            <Inbox /> Waiting on you
          </span>
          <strong>{loadFailed ? '—' : totals.waiting}</strong>
          <small>
            {loadFailed ? 'Records unavailable' : 'read and decide these'}
          </small>
        </article>
        <article style={{ '--i': 1 } as React.CSSProperties}>
          <span>
            <MessagesSquare /> On the board
          </span>
          <strong>{loadFailed ? '—' : totals.live}</strong>
          <small>
            {loadFailed ? 'Records unavailable' : 'visible to the public'}
          </small>
        </article>
        <article style={{ '--i': 2 } as React.CSSProperties}>
          <span>
            <ThumbsUp /> Votes cast
          </span>
          <strong>{loadFailed ? '—' : totals.votes}</strong>
          <small>
            {loadFailed ? 'Records unavailable' : 'one per device, not per person'}
          </small>
        </article>
      </div>

      <section className="admin-panel full-panel">
        <div className="panel-head">
          <div>
            <small>LATEST 300 SUGGESTIONS</small>
            <h2>{loadFailed ? 'Records unavailable' : `${ideas.length} shown`}</h2>
          </div>
          <MessagesSquare />
        </div>
        {loadFailed ? (
          <div className="empty-admin" role="alert">
            <strong>The board could not be loaded.</strong>
            <span>Check the database connection and reload.</span>
          </div>
        ) : (
          <AdminFeedback ideas={ideas} triage={triage} />
        )}
      </section>

      <aside className="admin-info-note">
        <strong>Why there is a person in the middle</strong>
        <p>
          A suggestion is text a stranger wrote, and it ends up in a prompt and
          then on the marketing site. Triage reads it and proposes a summary and
          a size. It cannot publish, cannot move a status and cannot write a
          changelog entry. If that ever changes, anything typed into the public
          form becomes a way to write on the site.
        </p>
      </aside>
    </section>
  );
}
