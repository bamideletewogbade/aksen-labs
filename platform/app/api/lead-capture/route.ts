import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { withRequestLog } from '@/lib/request-log';
import { boundedJson } from '@/lib/bounded-json';
import { currentHour, reserve, visitorKey } from '@/lib/rate-limit';
import { captureLead, intakeKey, type LeadSource } from '@/lib/lead-intake';
import { agentDraftMessage } from '@/lib/lead-notification';
import { validEmail } from '@/lib/resend';

/**
 * The pipe under the free tools.
 *
 * Somebody runs a business agent, describes their company in writing, reads a
 * draft worth having, and leaves. They were the best-qualified prospect the
 * site can produce, and the only record was an `agent_runs` row with no name in
 * it. This is where that stops.
 *
 * The offer is "send this to yourself", made after the draft is on screen and
 * never before. Asking first would take away the thing that makes the tools
 * worth trying at all, which is that they cost nothing and ask for nothing.
 */

export const captureVisitorLimit = 5;
export const captureHourlyCeiling = 300;

const allowed = new Set<LeadSource>(['business_agent', 'website_direct']);

/**
 * A JSON body is `unknown` until something checks. `String(value)` would turn a
 * number into a plausible-looking string and an object into "[object Object]",
 * and then store it as somebody's company name.
 */
const text = (value: unknown) => (typeof value === 'string' ? value : '');

async function POSTHandler(request: Request) {
  let input: Record<string, unknown>;
  try {
    // Room for the brief and the draft together. The draft is what the visitor
    // asked to be sent, so it has to arrive intact rather than truncated at the
    // door and repaired in the email.
    input = await boundedJson(request, 32000);
  } catch (error) {
    const tooLarge =
      error instanceof Error && error.message === 'Request too large.';
    return NextResponse.json(
      {
        error: tooLarge
          ? 'That is too long to send. Please shorten it and try again.'
          : 'A valid JSON body is required.',
      },
      { status: tooLarge ? 413 : 400 },
    );
  }

  const email = text(input.email).trim().toLowerCase();
  if (!validEmail(email))
    return NextResponse.json(
      { error: 'Enter an address we can reply to.' },
      { status: 400 },
    );

  const source = (text(input.source) || 'business_agent') as LeadSource;
  if (!allowed.has(source))
    return NextResponse.json(
      { error: 'Unknown capture source.' },
      { status: 400 },
    );

  // What they told the agent about their business. This is the valuable part:
  // a prospect who has already written down their own problem.
  const note = text(input.note).slice(0, 1800);
  const tool = text(input.tool).slice(0, 120);
  if (!note.trim())
    return NextResponse.json(
      { error: 'Nothing to send yet.' },
      { status: 400 },
    );

  const db = getDb();
  const hour = currentHour();
  if (
    !(await reserve(
      db,
      `capture-visitor-${await visitorKey(request)}-${hour}`,
      captureVisitorLimit,
    ))
  )
    return NextResponse.json(
      { error: 'We already have this. Check your inbox.' },
      { status: 429 },
    );
  if (!(await reserve(db, `capture-${hour}`, captureHourlyCeiling)))
    return NextResponse.json(
      { error: 'We cannot take this right now. Please try shortly.' },
      { status: 429 },
    );

  // The draft is ours, so it goes to them and stays out of the lead summary.
  // What the founder needs to read is what the customer said about their own
  // business, not a copy of what our model replied.
  const draft = text(input.draft).slice(0, 12000);
  const name = text(input.name);

  const captured = await captureLead({
    source,
    name,
    email,
    company: text(input.company),
    summary: tool ? `Ran ${tool}. ${note}` : note,
    recommendation: 'Ran a free tool and asked for a copy',
    channel: source === 'business_agent' ? 'Free business agent' : 'Website',
    nextAction: 'Read what they wrote, then offer the assessment',
    intakeKey: await intakeKey(source, email, note),
    detail: { tool, sentDraft: !!draft },
    acknowledgement: draft
      ? {
          subject: tool
            ? `Your ${tool} draft | Aksen Labs`
            : 'Your draft | Aksen Labs',
          body: agentDraftMessage({ name, tool, brief: note, draft }),
        }
      : undefined,
  });

  return NextResponse.json(
    {
      id: captured.id,
      duplicate: captured.duplicate,
      // The visitor is told what will actually happen. When the sender is the
      // shared sandbox, nothing reaches them, and saying otherwise is a promise
      // the system cannot keep.
      sent: captured.acknowledged,
    },
    { status: 201 },
  );
}

export const POST = withRequestLog('/api/lead-capture', POSTHandler);
