import { and, eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { feedbackIdeas, feedbackVotes } from '@/db/schema';
import { boundedJson } from '@/lib/bounded-json';
import { currentHour, reserve, visitorKey } from '@/lib/rate-limit';
import { withRequestLog } from '@/lib/request-log';

// Voting is cheap for a person and cheap for a script, so the ceiling is the
// thing doing the work here. A visitor reading the whole board and voting on
// everything they like is a good afternoon, not abuse.
export const voteVisitorLimit = 60;
export const voteHourlyCeiling = 2000;

async function POSTHandler(request: Request) {
  let input: Record<string, unknown>;
  try {
    input = await boundedJson(request, 500);
  } catch {
    return NextResponse.json(
      { error: 'A valid JSON body is required.' },
      { status: 400 },
    );
  }

  const ideaId = (typeof input.id === 'string' ? input.id : '').slice(0, 60);
  if (!ideaId)
    return NextResponse.json({ error: 'No idea given.' }, { status: 400 });

  const db = getDb();
  const hour = currentHour();
  const voter = await visitorKey(request);
  if (!(await reserve(db, `feedback-vote-${voter}-${hour}`, voteVisitorLimit)))
    return NextResponse.json(
      { error: 'That is a lot of voting for one hour. Come back shortly.' },
      { status: 429 },
    );
  if (!(await reserve(db, `feedback-vote-${hour}`, voteHourlyCeiling)))
    return NextResponse.json(
      { error: 'Voting is busy this moment. Please try shortly.' },
      { status: 429 },
    );

  // Only a published idea can be voted on. An unpublished one is still in
  // triage and is not a public address yet.
  const [idea] = await db
    .select({ id: feedbackIdeas.id })
    .from(feedbackIdeas)
    .where(and(eq(feedbackIdeas.id, ideaId), eq(feedbackIdeas.published, true)))
    .limit(1);
  if (!idea)
    return NextResponse.json({ error: 'No such idea.' }, { status: 404 });

  // A repeat vote is almost always the same person on a second device or a
  // stale tab, so it is not an error. Either way the count only moves when a
  // row is actually inserted, which the unique constraint decides.
  const inserted = await db
    .insert(feedbackVotes)
    .values({ ideaId: idea.id, voterKey: voter })
    .onConflictDoNothing({
      target: [feedbackVotes.ideaId, feedbackVotes.voterKey],
    })
    .returning({ ideaId: feedbackVotes.ideaId });

  if (inserted.length === 0) {
    const [current] = await db
      .select({ votes: feedbackIdeas.voteCount })
      .from(feedbackIdeas)
      .where(eq(feedbackIdeas.id, idea.id))
      .limit(1);
    return NextResponse.json({ status: 'already', votes: current?.votes ?? 0 });
  }

  const [updated] = await db
    .update(feedbackIdeas)
    .set({ voteCount: sql`${feedbackIdeas.voteCount} + 1`, updatedAt: new Date() })
    .where(eq(feedbackIdeas.id, idea.id))
    .returning({ votes: feedbackIdeas.voteCount });

  return NextResponse.json({ status: 'counted', votes: updated?.votes ?? 1 });
}

export const POST = withRequestLog('/api/feedback/vote', POSTHandler);
