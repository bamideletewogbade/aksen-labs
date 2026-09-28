import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { withRequestLog } from '@/lib/request-log';
import { verifyPaystackWebhookSignature } from '@/lib/paystack';
import { paymentQuery } from '@/lib/financial-payment';

async function POSTHandler(request: Request) {
  const signature = request.headers.get('x-paystack-signature');
  const rawBody = await request.text();

  if (!signature || !verifyPaystackWebhookSignature(rawBody, signature)) {
    return NextResponse.json(
      { error: 'Invalid or forged Paystack webhook signature.' },
      { status: 400 },
    );
  }

  let eventPayload: {
    event?: string;
    data?: {
      reference?: string;
      amount?: number;
      currency?: string;
      paid_at?: string;
      channel?: string;
      metadata?: Record<string, unknown>;
    };
  };

  try {
    eventPayload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON webhook payload.' },
      { status: 400 },
    );
  }

  const { event, data } = eventPayload;

  // Process successful payments
  if (event === 'charge.success' && data && data.reference) {
    const reference = data.reference;
    const amountMinor = Number(data.amount || 0);
    const invoiceId = typeof data.metadata?.invoiceId === 'string' ? data.metadata.invoiceId : '';

    if (!invoiceId) {
      // Event received without an associated internal invoice; acknowledge without action
      return NextResponse.json({ received: true, note: 'No invoice metadata attached' });
    }

    try {
      const db = getDb();

      // Check idempotency: check if already processed
      const existing = await db.execute(
        sql`SELECT id FROM business_financials WHERE kind='receipt' AND payment_reference=${reference} LIMIT 1`,
      );

      if (existing.rows.length) {
        return NextResponse.json({ received: true, note: 'Already recorded' });
      }

      // Fetch target invoice
      const invoiceRows = await db.execute(
        sql`SELECT id, business_id, currency, total_minor, paid_minor, status
            FROM business_financials
            WHERE id=${invoiceId} AND kind='invoice'`,
      );

      if (!invoiceRows.rows.length) {
        return NextResponse.json({ received: true, note: 'Invoice not found' });
      }

      const invoice = invoiceRows.rows[0] as {
        id: string;
        business_id: string;
        currency: string;
        total_minor: number;
        paid_minor: number;
        status: string;
      };

      const remainingBalance = invoice.total_minor - invoice.paid_minor;
      if (remainingBalance > 0) {
        const amountToRecord = Math.min(amountMinor, remainingBalance);
        const receiptId = crypto.randomUUID();
        const receiptNumber = `RCT-${new Date().getUTCFullYear()}-${receiptId.slice(0, 8).toUpperCase()}`;
        const paymentDate = (data.paid_at || new Date().toISOString()).slice(0, 10);
        const auditId = crypto.randomUUID();

        await db.execute(
          paymentQuery({
            id: receiptId,
            businessId: invoice.business_id,
            financialId: invoice.id,
            amount: amountToRecord,
            reference,
            date: paymentDate,
            number: receiptNumber,
            actorId: 'paystack_webhook',
            auditId,
          }),
        );
      }
    } catch (err) {
      console.error('Paystack webhook processing error:', err);
      // Still return 200 so Paystack does not retry endlessly on internal DB exceptions
      return NextResponse.json({ received: true, error: 'Database update failed' });
    }
  }

  return NextResponse.json({ received: true });
}

export const POST = withRequestLog('/api/paystack/webhook', POSTHandler);
