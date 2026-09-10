import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { auditEvents, opportunities } from '@/db/schema';
import { workflowSuggestion } from '@/lib/workflow-suggestion';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'A valid JSON body is required.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Opportunity details are required.' }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const answers = Array.isArray(input.answers) ? input.answers : [];
  const [work, channel, desiredOutcome] = answers;
  const required = [input.name, input.email, input.company, work, channel, desiredOutcome];
  if (required.some((value) => typeof value !== 'string' || value.trim().length === 0)) {
    return NextResponse.json({ error: 'Name, email, company and three workflow answers are required.' }, { status: 400 });
  }

  const email = String(input.email).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid work email.' }, { status: 400 });
  }

  const id = crypto.randomUUID();
  // Store the suggestion the visitor actually saw; fall back when the model was unreachable.
  const shown = typeof input.recommendation === 'string' ? input.recommendation.trim().slice(0, 160) : '';
  const recommendation = shown || workflowSuggestion(String(work));
  const db = getDb();
  await db.insert(opportunities).values({
    id,
    name: String(input.name).trim().slice(0, 120),
    email: email.slice(0, 200),
    company: String(input.company).trim().slice(0, 160),
    work: String(work).slice(0, 160),
    channel: String(channel).slice(0, 160),
    desiredOutcome: String(desiredOutcome).slice(0, 160),
    recommendation,
    summary: `${String(work)} via ${String(channel)} with a desired outcome of ${String(desiredOutcome)}.`,
    nextAction: 'Founder review and personal follow-up',
  });

  await db.insert(auditEvents).values({ id: crypto.randomUUID(), actorType: 'visitor', action: 'lead.created', entityType: 'opportunity', entityId: id, details: { source: 'website_mapper', consent: 'provided' } });

  return NextResponse.json({ id, status: 'new', recommendation }, { status: 201 });
}
