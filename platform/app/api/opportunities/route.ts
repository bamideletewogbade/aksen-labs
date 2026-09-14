import { withRequestLog } from '@/lib/request-log';
import { resolvePricingSelection } from '@/lib/pricing';
import { formatPrice } from '@/lib/currency';
import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { auditEvents, opportunities } from '@/db/schema';
import { workspaceOwnerId } from '@/app/chatgpt-auth';
import { workflowSuggestion } from '@/lib/workflow-suggestion';
import { boundedJson } from '@/lib/bounded-json';
import { currentHour, reserve, visitorKey } from '@/lib/rate-limit';
import { notifyNewLead } from '@/lib/lead-notification';

// One person sending a genuine enquiry needs one or two attempts. The shared
// ceiling keeps a distributed flood from filling the pipeline the founder reads.
export const enquiryVisitorLimit = 5;
export const enquiryHourlyCeiling = 200;

async function POSTHandler(request: Request) {
  let input: Record<string, unknown>;
  try {
    input = await boundedJson(request, 8000);
  } catch (error) {
    const tooLarge =
      error instanceof Error && error.message === 'Request too large.';
    return NextResponse.json(
      {
        error: tooLarge
          ? 'That enquiry is too long. Please shorten it and try again.'
          : 'A valid JSON body is required.',
      },
      { status: tooLarge ? 413 : 400 },
    );
  }

  const pricingSelection = resolvePricingSelection(input.pricingPackage);
  const pricingPrefix = pricingSelection
    ? // Recorded in cedis regardless of what the visitor was reading. The
      // lead is a business record, and a figure in it has to mean one thing
      // when it is read back in six months.
      `Pricing enquiry: ${pricingSelection.name} (${formatPrice(pricingSelection.price, 'GHS')}, indicative). `
    : '';
  const answers = Array.isArray(input.answers) ? input.answers : [];
  // Preserve the older mapper payload while storing the new answers meaningfully.
  const [first, second, third] = answers;
  const updatedFormat = input.answerFormat === 'goal-market-setup';
  const work = first;
  const channel = updatedFormat ? third : second;
  const desiredOutcome = updatedFormat ? first : third;
  const required = [
    input.name,
    input.email,
    input.company,
    first,
    second,
    third,
  ];
  if (
    required.some(
      (value) => typeof value !== 'string' || value.trim().length === 0,
    )
  ) {
    return NextResponse.json(
      {
        error: 'Name, email, company and three workflow answers are required.',
      },
      { status: 400 },
    );
  }

  const email = String(input.email).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: 'Enter a valid work email.' },
      { status: 400 },
    );
  }

  const db = getDb();
  const hour = currentHour();
  // Reserved before anything is stored, so a flood cannot fill the pipeline.
  if (
    !(await reserve(
      db,
      `enquiry-visitor-${await visitorKey(request)}-${hour}`,
      enquiryVisitorLimit,
    ))
  )
    return NextResponse.json(
      {
        error:
          'We already have your recent enquiries. We will reply to those rather than lose them among repeats.',
      },
      { status: 429 },
    );
  if (!(await reserve(db, `enquiry-${hour}`, enquiryHourlyCeiling)))
    return NextResponse.json(
      {
        error:
          'We cannot accept enquiries this moment. Please try shortly, or email us directly.',
      },
      { status: 429 },
    );

  const id = crypto.randomUUID();
  // Store the suggestion the visitor actually saw; fall back when the model was unreachable.
  const shown =
    typeof input.recommendation === 'string'
      ? input.recommendation.trim().slice(0, 160)
      : '';
  const recommendation = shown || workflowSuggestion(String(work));
  const summary =
    pricingPrefix +
    (updatedFormat
      ? `Goal: ${String(first).slice(0, 180)}. Market: ${String(second).slice(0, 180)}. Current setup: ${String(third).slice(0, 180)}.`
      : `${String(work)} via ${String(channel)} with a desired outcome of ${String(desiredOutcome)}.`);
  const name = String(input.name).trim().slice(0, 120);
  const company = String(input.company).trim().slice(0, 160);

  await db.insert(opportunities).values({
    id,
    name,
    email: email.slice(0, 200),
    company,
    work: String(work).slice(0, 160),
    channel: String(channel).slice(0, 160),
    desiredOutcome: String(desiredOutcome).slice(0, 160),
    recommendation,
    summary,
    nextAction: 'Founder review and personal follow-up',
    // Every admin view of this table filters on owner_id. Without this the row
    // is stored with a null owner and is invisible in the pipeline, the stage
    // counts and the overdue follow-ups: captured, stored, emailed, and absent
    // from the system meant to work it. The notification would be its only
    // trace. The reader also tolerates a null owner, so a lead can never be
    // lost this way twice.
    ownerId: workspaceOwnerId() || null,
  });

  // The enquiry is stored. Nothing below may turn a captured lead into an error
  // for the visitor, so each step records its outcome instead of throwing.
  await db
    .insert(auditEvents)
    .values({
      id: crypto.randomUUID(),
      actorType: 'visitor',
      action: 'lead.created',
      entityType: 'opportunity',
      entityId: id,
      details: {
        source: pricingSelection ? 'website_pricing' : 'website_mapper',
        consent: 'provided',
        ...(pricingSelection ? { pricingPackage: pricingSelection.name } : {}),
      },
    })
    .catch(() => null);

  const delivery = await notifyNewLead({
    id,
    name,
    email,
    company,
    summary,
    recommendation,
  });
  // A stored enquiry nobody was told about is the failure this loop exists to
  // prevent, so the outcome is recorded against the enquiry either way.
  await db
    .insert(auditEvents)
    .values({
      id: crypto.randomUUID(),
      actorType: 'system',
      action: delivery.notified ? 'lead.notified' : 'lead.notification_failed',
      entityType: 'opportunity',
      entityId: id,
      details: delivery,
    })
    .catch(() => null);

  return NextResponse.json(
    { id, status: 'new', recommendation, acknowledged: delivery.acknowledged },
    { status: 201 },
  );
}

export const POST = withRequestLog('/api/opportunities', POSTHandler);
