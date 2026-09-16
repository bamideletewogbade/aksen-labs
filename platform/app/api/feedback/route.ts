import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { auditEvents, feedbackIdeas } from '@/db/schema';
import { boundedJson } from '@/lib/bounded-json';
import { bodyLimit, cleanSubmission, titleLimit } from '@/lib/feedback-board';
import { currentHour, reserve, visitorKey } from '@/lib/rate-limit';
import { withRequestLog } from '@/lib/request-log';

// A person with a real suggestion has two or three of them, not twenty. The
// shared ceiling is what stops one script filling the triage queue for a day.
export const ideaVisitorLimit = 5;
export const ideaHourlyCeiling = 200;

async function POSTHandler(request: Request) {
  let input: Record<string, unknown>;
  try {
    input = await boundedJson(request, 4000);
  } catch (error) {
    const tooLarge =
      error instanceof Error && error.message === 'Request too large.';
    return NextResponse.json(
      {
        error: tooLarge
          ? 'That is longer than this form takes. Please shorten it.'
          : 'A valid JSON body is required.',
      },
      { status: tooLarge ? 413 : 400 },
    );
  }

  const title = cleanSubmission(input.title, titleLimit);
  // Ten characters is roughly the shortest real request ("dark mode") and well
  // under anything accidental, like a stray keystroke submitting the form.
  if (title.length < 10)
    return NextResponse.json(
      { error: 'Say what you want in a few more words.' },
      { status: 400 },
    );

  const body = cleanSubmission(input.body, bodyLimit);

  // Optional. Someone who leaves it still gets their idea on the board; they
  // just cannot be told when it ships.
  const email = (typeof input.email === 'string' ? input.email : '')
    .trim()
    .toLowerCase()
    .slice(0, 200);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json(
      {
        error:
          'That email address does not look right. Leave it blank if you prefer.',
      },
      { status: 400 },
    );

  const db = getDb();
  const hour = currentHour();
  const submitter = await visitorKey(request);
  // Reserved before the write, so a flood cannot fill the board.
  if (
    !(await reserve(
      db,
      `feedback-visitor-${submitter}-${hour}`,
      ideaVisitorLimit,
    ))
  )
    return NextResponse.json(
      {
        error:
          'That is several ideas in an hour. Send the rest a little later.',
      },
      { status: 429 },
    );
  if (!(await reserve(db, `feedback-${hour}`, ideaHourlyCeiling)))
    return NextResponse.json(
      { error: 'We cannot take suggestions this moment. Please try shortly.' },
      { status: 429 },
    );

  const [row] = await db
    .insert(feedbackIdeas)
    .values({
      id: crypto.randomUUID(),
      title,
      body: body || null,
      authorEmail: email || null,
      submitterKey: submitter,
    })
    .returning({ id: feedbackIdeas.id });

  // The idea is stored. Recording it must not turn a captured suggestion into
  // an error for the person who took the time to write it.
  await db
    .insert(auditEvents)
    .values({
      id: crypto.randomUUID(),
      actorType: 'visitor',
      action: 'feedback.submitted',
      entityType: 'feedback_ideas',
      entityId: row?.id ?? 'unknown',
      details: { gaveEmail: Boolean(email), hasDetail: Boolean(body) },
    })
    .catch(() => null);

  return NextResponse.json({ status: 'received' }, { status: 201 });
}

export const POST = withRequestLog('/api/feedback', POSTHandler);
