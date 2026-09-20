import { withRequestLog } from '@/lib/request-log';
import { resolvePricingSelection } from '@/lib/pricing';
import { formatPrice } from '@/lib/currency';
import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { workflowSuggestion } from '@/lib/workflow-suggestion';
import { boundedJson } from '@/lib/bounded-json';
import { currentHour, reserve, visitorKey } from '@/lib/rate-limit';
import { captureLead, intakeKey } from '@/lib/lead-intake';
import { parseMapperAnswers } from '@/lib/mapper-questions';

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
  const answers = parseMapperAnswers(input.answers);
  if (!answers) {
    return NextResponse.json(
      { error: 'Choose at least one answer in each of the three steps.' },
      { status: 400 },
    );
  }
  // Preserve older cached single-answer pages while storing multi-select
  // answers as readable text in the existing lead columns.
  const [first, second, third] = answers.map((answer) => answer.join('; '));
  const updatedFormat = input.answerFormat === 'goal-market-setup';
  const work = first;
  const channel = updatedFormat ? third : second;
  const desiredOutcome = updatedFormat ? first : third;
  const required = [input.name, input.email, first, second, third];
  if (
    required.some(
      (value) => typeof value !== 'string' || value.trim().length === 0,
    )
  ) {
    return NextResponse.json(
      {
        error: 'Name, email and an answer in each step are required.',
      },
      { status: 400 },
    );
  }

  const email = String(input.email).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: 'Enter a valid email address.' },
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

  // Store the suggestion the visitor actually saw; fall back when the model was unreachable.
  const shown =
    typeof input.recommendation === 'string'
      ? input.recommendation.trim().slice(0, 160)
      : '';
  const recommendation = shown || workflowSuggestion(String(work));
  const otherMarket =
    answers[1].includes('Another African country') &&
    typeof input.otherMarket === 'string'
      ? input.otherMarket.trim().slice(0, 120)
      : '';
  const otherTools =
    answers[2].includes('Something else') &&
    typeof input.otherTools === 'string'
      ? input.otherTools.trim().slice(0, 120)
      : '';
  const example =
    typeof input.example === 'string' ? input.example.trim().slice(0, 600) : '';
  if (answers[1].includes('Another African country') && !otherMarket)
    return NextResponse.json(
      { error: 'Name the other market you selected.' },
      { status: 400 },
    );
  if (answers[2].includes('Something else') && !otherTools)
    return NextResponse.json(
      { error: 'Name the other tool or channel you selected.' },
      { status: 400 },
    );
  const summary =
    pricingPrefix +
    (updatedFormat
      ? `Goals: ${first}. Markets: ${second}${otherMarket ? ` (${otherMarket})` : ''}. Current tools: ${third}${otherTools ? ` (${otherTools})` : ''}.${example ? ` Example: ${example}` : ''}`
      : `${String(work)} via ${String(channel)} with a desired outcome of ${String(desiredOutcome)}.`);

  // Capture, audit and the two messages all live in one place now, so the
  // enquiry form, the free tools and anything added later cannot drift into
  // three slightly different ideas of what capturing a lead means.
  const captured = await captureLead({
    source: pricingSelection ? 'website_pricing' : 'website_mapper',
    name: String(input.name),
    email,
    company: typeof input.company === 'string' ? input.company : '',
    work: String(work),
    channel: String(channel),
    desiredOutcome: String(desiredOutcome),
    recommendation,
    summary,
    intakeKey: await intakeKey('enquiry', email, summary),
    detail: pricingSelection
      ? { pricingPackage: pricingSelection.name }
      : undefined,
  });

  return NextResponse.json(
    {
      id: captured.id,
      status: 'new',
      recommendation,
      acknowledged: captured.acknowledged,
    },
    { status: 201 },
  );
}

export const POST = withRequestLog('/api/opportunities', POSTHandler);
