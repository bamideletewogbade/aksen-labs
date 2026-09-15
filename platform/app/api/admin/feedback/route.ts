import { desc, eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { auditEvents, changelogEntries, feedbackIdeas } from '@/db/schema';
import { adminEmailAllowed } from '@/lib/admin-policy';
import { boundedJson } from '@/lib/bounded-json';
import {
  bodyLimit,
  changelogKinds,
  cleanSubmission,
  ideaStatuses,
  titleLimit,
  type IdeaStatus,
} from '@/lib/feedback-board';
import { withRequestLog } from '@/lib/request-log';

async function requireAdmin() {
  const user = await getChatGPTUser();
  if (!user)
    return {
      error: NextResponse.json({ error: 'Sign in required.' }, { status: 401 }),
    };
  if (!adminEmailAllowed(user.email))
    return {
      error: NextResponse.json({ error: 'Not authorized.' }, { status: 403 }),
    };
  return { email: user.email };
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);

async function GETHandler() {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  const db = getDb();
  const ideas = await db
    .select()
    .from(feedbackIdeas)
    .orderBy(desc(feedbackIdeas.createdAt))
    .limit(300);
  return NextResponse.json({ ideas });
}

/**
 * Every write here is a person's decision, which is the point.
 *
 * Triage can propose: it writes a summary and a size onto the idea and raises an
 * approval. It cannot publish an idea, move its status or write a changelog
 * entry. Those three arrive through this route, signed in, or they do not
 * happen, so nothing a stranger typed into the public form can reach the site
 * without somebody reading it first.
 */
async function POSTHandler(request: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;

  let input: Record<string, unknown>;
  try {
    input = await boundedJson(request, 6000);
  } catch {
    return NextResponse.json(
      { error: 'A valid JSON body is required.' },
      { status: 400 },
    );
  }

  const id = typeof input.id === 'string' ? input.id : '';
  const action = typeof input.action === 'string' ? input.action : '';
  if (!id || !action)
    return NextResponse.json(
      { error: 'An idea and an action are required.' },
      { status: 400 },
    );

  const db = getDb();
  const [idea] = await db
    .select()
    .from(feedbackIdeas)
    .where(eq(feedbackIdeas.id, id))
    .limit(1);
  if (!idea)
    return NextResponse.json({ error: 'No such idea.' }, { status: 404 });

  const note = cleanSubmission(input.note, 400);

  if (action === 'publish' || action === 'hide') {
    const published = action === 'publish';
    await db
      .update(feedbackIdeas)
      .set({ published, updatedAt: new Date() })
      .where(eq(feedbackIdeas.id, id));
    await record(db, gate.email, published ? 'feedback.published' : 'feedback.hidden', id);
    return NextResponse.json({ status: 'ok', published });
  }

  /**
   * Fold a duplicate into the request it repeats.
   *
   * Triage proposes this and never does it, because it moves a public number.
   * Votes transfer rather than being discarded: the people who voted for the
   * duplicate wanted the thing, and throwing their votes away to tidy the board
   * makes the count less true, not more.
   */
  if (action === 'merge') {
    const targetId = typeof input.targetId === 'string' ? input.targetId : '';
    if (!targetId || targetId === id)
      return NextResponse.json(
        { error: 'Choose a different request to merge into.' },
        { status: 400 },
      );
    const [target] = await db
      .select({ id: feedbackIdeas.id, mergedInto: feedbackIdeas.mergedInto })
      .from(feedbackIdeas)
      .where(eq(feedbackIdeas.id, targetId))
      .limit(1);
    if (!target)
      return NextResponse.json(
        { error: 'That request does not exist.' },
        { status: 400 },
      );
    // Merging into something already merged would build a chain nobody can
    // follow, and the second merge would move the votes twice.
    if (target.mergedInto)
      return NextResponse.json(
        { error: 'That one has itself been merged. Pick the original.' },
        { status: 400 },
      );

    // A voter who voted for both must not count twice on the target, so the
    // conflicting rows are dropped rather than the insert failing.
    await db.execute(sql`
      INSERT INTO feedback_votes (idea_id, voter_key)
      SELECT ${targetId}, voter_key FROM feedback_votes WHERE idea_id = ${id}
      ON CONFLICT (idea_id, voter_key) DO NOTHING`);
    await db.execute(sql`
      UPDATE feedback_ideas
         SET vote_count = (SELECT count(*) FROM feedback_votes WHERE idea_id = ${targetId}),
             updated_at = now()
       WHERE id = ${targetId}`);
    await db
      .update(feedbackIdeas)
      .set({
        mergedInto: targetId,
        published: false,
        statusNote: note || 'Merged into an earlier request asking the same thing.',
        updatedAt: new Date(),
      })
      .where(eq(feedbackIdeas.id, id));
    await record(db, gate.email, 'feedback.merged', id, { into: targetId });
    return NextResponse.json({ status: 'ok', mergedInto: targetId });
  }

  if (action === 'status') {
    const status = (
      typeof input.status === 'string' ? input.status : ''
    ) as IdeaStatus;
    if (!ideaStatuses.some((entry) => entry.id === status))
      return NextResponse.json({ error: 'Unknown status.' }, { status: 400 });
    // A "no" with no reason is the thing people complain about on every public
    // board, so declining requires one.
    if (status === 'declined' && !note)
      return NextResponse.json(
        { error: 'Say why, so the card can carry the reason.' },
        { status: 400 },
      );
    await db
      .update(feedbackIdeas)
      .set({ status, statusNote: note || idea.statusNote, updatedAt: new Date() })
      .where(eq(feedbackIdeas.id, id));
    await record(db, gate.email, 'feedback.status', id, { status });
    return NextResponse.json({ status: 'ok' });
  }

  // Shipping writes the changelog entry and moves the idea in one step, because
  // the two falling out of step is exactly how a changelog stops being true.
  if (action === 'ship') {
    const title = cleanSubmission(input.title, titleLimit) || idea.title;
    const body = cleanSubmission(input.body, bodyLimit);
    if (!body)
      return NextResponse.json(
        { error: 'Write a line about what actually shipped.' },
        { status: 400 },
      );
    const kind =
      typeof input.kind === 'string' ? input.kind : 'improvement';
    if (!changelogKinds.some((entry) => entry.id === kind))
      return NextResponse.json({ error: 'Unknown kind.' }, { status: 400 });

    const released = new Date().toISOString().slice(0, 10);
    // A slug collides when two entries share a title. The idea's id tail is
    // stable and short, and makes the anchor unique without a lookup loop.
    const slug = `${slugify(title) || 'update'}-${id.slice(0, 6)}`;

    await db
      .insert(changelogEntries)
      .values({
        id: crypto.randomUUID(),
        slug,
        title,
        body,
        releasedOn: released,
        kind,
        published: true,
        ideaId: id,
      })
      .onConflictDoUpdate({
        target: changelogEntries.slug,
        set: { title, body, kind, published: true, updatedAt: new Date() },
      });

    await db
      .update(feedbackIdeas)
      .set({ status: 'shipped', published: true, updatedAt: new Date() })
      .where(eq(feedbackIdeas.id, id));
    await record(db, gate.email, 'feedback.shipped', id, { slug });
    return NextResponse.json({ status: 'ok', slug });
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
}

function record(
  db: ReturnType<typeof getDb>,
  actor: string | undefined,
  action: string,
  id: string,
  details: Record<string, unknown> = {},
) {
  // The decision is already saved. Failing to log it must not report the
  // decision as failed, so this never rejects.
  return db
    .insert(auditEvents)
    .values({
      id: crypto.randomUUID(),
      actorId: actor,
      actorType: 'admin',
      action,
      entityType: 'feedback_ideas',
      entityId: id,
      details,
    })
    .catch(() => null);
}

export const GET = withRequestLog('/api/admin/feedback', GETHandler);
export const POST = withRequestLog('/api/admin/feedback', POSTHandler);
