import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { auditEvents, productWaitlist } from '@/db/schema';
import { products } from '@/lib/product-catalog';
import { boundedJson } from '@/lib/bounded-json';
import { currentHour, reserve, visitorKey } from '@/lib/rate-limit';
import { withRequestLog } from '@/lib/request-log';

// One person signs up once, and mistypes their address once. The shared ceiling
// keeps a flood from burying the handful of real signups the list exists for.
export const waitlistVisitorLimit = 4;
export const waitlistHourlyCeiling = 300;

/** What the person wrote about their own job search. Long enough for a sentence,
 *  short enough that the admin list stays readable at a glance. */
const hopedForLimit = 280;

async function POSTHandler(request: Request) {
  let input: Record<string, unknown>;
  try {
    input = await boundedJson(request, 2000);
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

  // Only a product that has no public address can be waited on. Once one ships
  // the form goes with it, and a signup arriving after that is a stale page.
  const product = products.find(
    (entry) => entry.slug === input.product && !entry.href,
  );
  if (!product)
    return NextResponse.json(
      { error: 'That product is not taking signups.' },
      { status: 400 },
    );

  const email =
    typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json(
      { error: 'Enter an email address we can write to.' },
      { status: 400 },
    );

  const hopedFor =
    typeof input.hopedFor === 'string'
      ? input.hopedFor.trim().slice(0, hopedForLimit)
      : '';

  const db = getDb();
  const hour = currentHour();
  // Reserved before anything is stored, so a flood cannot fill the list.
  if (
    !(await reserve(
      db,
      `waitlist-visitor-${await visitorKey(request)}-${hour}`,
      waitlistVisitorLimit,
    ))
  )
    return NextResponse.json(
      {
        error:
          'We have taken several signups from here already. If one of them was yours, you are on the list.',
      },
      { status: 429 },
    );
  if (!(await reserve(db, `waitlist-${hour}`, waitlistHourlyCeiling)))
    return NextResponse.json(
      { error: 'We cannot take signups this moment. Please try shortly.' },
      { status: 429 },
    );

  const [row] = await db
    .insert(productWaitlist)
    .values({
      id: crypto.randomUUID(),
      productSlug: product.slug,
      email: email.slice(0, 200),
      hopedFor: hopedFor || null,
    })
    .onConflictDoUpdate({
      target: [productWaitlist.productSlug, productWaitlist.email],
      // A second signup is the same person, usually adding the line they left
      // blank the first time. An empty second attempt keeps what they wrote.
      set: hopedFor
        ? { hopedFor, updatedAt: new Date() }
        : { updatedAt: new Date() },
    })
    .returning({ id: productWaitlist.id });

  // The signup is stored. Recording it must not turn a captured address into an
  // error for the person who gave it.
  await db
    .insert(auditEvents)
    .values({
      id: crypto.randomUUID(),
      actorType: 'visitor',
      action: 'waitlist.joined',
      entityType: 'product_waitlist',
      entityId: row?.id ?? product.slug,
      details: { product: product.slug, saidWhy: Boolean(hopedFor) },
    })
    .catch(() => null);

  return NextResponse.json({ status: 'joined' }, { status: 201 });
}

export const POST = withRequestLog('/api/waitlist', POSTHandler);
