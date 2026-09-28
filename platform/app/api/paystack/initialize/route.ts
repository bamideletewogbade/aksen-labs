import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { withRequestLog } from '@/lib/request-log';
import { initializePaystackCheckout, isPaystackConfigured } from '@/lib/paystack';

async function POSTHandler(request: Request) {
  if (!isPaystackConfigured()) {
    return NextResponse.json(
      { error: 'Payment gateway is not configured. Add PAYSTACK_SECRET_KEY to the environment.' },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: 'A valid JSON request body is required.' },
      { status: 400 },
    );
  }

  const invoiceId = typeof body.invoiceId === 'string' ? body.invoiceId.trim() : '';
  if (!invoiceId) {
    return NextResponse.json(
      { error: 'An invoice ID is required to initialize checkout.' },
      { status: 400 },
    );
  }

  try {
    const db = getDb();
    const rows = await db.execute(
      sql`SELECT id, business_id, number, currency, total_minor, paid_minor, status, details
          FROM business_financials
          WHERE id = ${invoiceId} AND kind = 'invoice'`,
    );

    if (!rows.rows.length) {
      return NextResponse.json(
        { error: 'Invoice not found.' },
        { status: 404 },
      );
    }

    const invoice = rows.rows[0] as {
      id: string;
      business_id: string;
      number: string;
      currency: string;
      total_minor: number;
      paid_minor: number;
      status: string;
      details: {
        buyer?: string;
        seller?: string;
        lines?: Array<{ description: string; unitMinor: number; quantity: number }>;
      };
    };

    if (invoice.status === 'paid' || invoice.paid_minor >= invoice.total_minor) {
      return NextResponse.json(
        { error: 'This invoice has already been paid in full.' },
        { status: 400 },
      );
    }

    if (invoice.status !== 'issued') {
      return NextResponse.json(
        { error: `Invoice is currently in "${invoice.status}" status and cannot receive payments.` },
        { status: 400 },
      );
    }

    const balanceMinor = invoice.total_minor - invoice.paid_minor;
    if (balanceMinor <= 0) {
      return NextResponse.json(
        { error: 'No balance remaining on this invoice.' },
        { status: 400 },
      );
    }

    // Resolve buyer email from payload or invoice details
    let customerEmail = typeof body.email === 'string' ? body.email.trim() : '';
    if (!customerEmail || !customerEmail.includes('@')) {
      const buyerText = typeof invoice.details?.buyer === 'string' ? invoice.details.buyer : '';
      const emailMatch = buyerText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) {
        customerEmail = emailMatch[0];
      }
    }

    if (!customerEmail || !customerEmail.includes('@')) {
      return NextResponse.json(
        { error: 'A valid customer email address is required to process Paystack checkout.' },
        { status: 400 },
      );
    }

    // Determine return URL
    const origin =
      request.headers.get('origin') ||
      process.env.SITE_URL ||
      new URL(request.url).origin;
    const cleanNumber = invoice.number.replace(/[^A-Za-z0-9]/g, '');
    const reference = `AKSEN-${cleanNumber}-${Date.now().toString(36).toUpperCase()}`;
    const callbackUrl = `${origin}/pay/${invoice.id}?reference=${encodeURIComponent(reference)}`;

    const result = await initializePaystackCheckout({
      email: customerEmail,
      amountMinor: balanceMinor,
      currency: invoice.currency,
      reference,
      callbackUrl,
      metadata: {
        invoiceId: invoice.id,
        businessId: invoice.business_id,
        invoiceNumber: invoice.number,
        buyer: invoice.details?.buyer || customerEmail,
      },
    });

    if (!result.success || !result.authorizationUrl) {
      return NextResponse.json(
        { error: result.message || 'Could not initialize Paystack checkout session.' },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      authorizationUrl: result.authorizationUrl,
      accessCode: result.accessCode,
      reference: result.reference,
      amountMinor: balanceMinor,
      currency: invoice.currency,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Database error.';
    return NextResponse.json(
      { error: `Failed to initialize payment: ${message}` },
      { status: 500 },
    );
  }
}

export const POST = withRequestLog('/api/paystack/initialize', POSTHandler);
