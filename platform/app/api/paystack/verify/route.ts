import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { withRequestLog } from '@/lib/request-log';
import {
  verifyPaystackTransaction,
  isPaystackConfigured,
} from '@/lib/paystack';
import { paymentQuery } from '@/lib/financial-payment';

async function GETHandler(request: Request) {
  if (!isPaystackConfigured()) {
    return NextResponse.json(
      { error: 'Payment gateway is not configured.' },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const reference = url.searchParams.get('reference')?.trim() || '';
  const invoiceIdParam = url.searchParams.get('invoiceId')?.trim() || '';

  if (!reference) {
    return NextResponse.json(
      { error: 'A transaction reference is required for verification.' },
      { status: 400 },
    );
  }

  try {
    const db = getDb();

    // 1. Idempotency check: has this reference already been processed and recorded?
    const existingReceipt = await db.execute(
      sql`SELECT id, number, currency, total_minor, details, issued_at
          FROM business_financials
          WHERE kind = 'receipt' AND payment_reference = ${reference}
          LIMIT 1`,
    );

    if (existingReceipt.rows.length) {
      const receipt = existingReceipt.rows[0] as {
        id: string;
        number: string;
        currency: string;
        total_minor: number;
        issued_at: string;
      };
      return NextResponse.json({
        success: true,
        status: 'paid',
        alreadyRecorded: true,
        receiptId: receipt.id,
        receiptNumber: receipt.number,
        reference,
        amountMinor: receipt.total_minor,
        currency: receipt.currency,
        paidAt: receipt.issued_at,
      });
    }

    // 2. Query Paystack REST API
    const verifyResult = await verifyPaystackTransaction(reference);

    if (!verifyResult.success || verifyResult.status !== 'success') {
      return NextResponse.json({
        success: false,
        status: verifyResult.status,
        reference,
        message:
          verifyResult.gatewayResponse ||
          verifyResult.message ||
          'Payment not completed.',
      });
    }

    // 3. Check if this is an order demo payment
    const isDemoOrder =
      reference.startsWith('ORDER-DEMO-') ||
      verifyResult.metadata?.type === 'order_demo' ||
      invoiceIdParam === 'order_demo';

    if (isDemoOrder) {
      return NextResponse.json({
        success: true,
        status: 'paid',
        demo: true,
        reference,
        amountMinor: verifyResult.amountMinor,
        currency: verifyResult.currency,
        paidAt: verifyResult.paidAt || new Date().toISOString(),
        channel: verifyResult.channel || 'mobile_money',
        customerEmail: verifyResult.customerEmail,
        message: 'Order demo payment verified via Paystack.',
      });
    }

    // 4. Resolve the target invoice
    const metaInvoiceId =
      typeof verifyResult.metadata?.invoiceId === 'string'
        ? verifyResult.metadata.invoiceId
        : '';
    // Paystack's own record says which invoice the money was for. When the
    // caller names a different one, trust Paystack and refuse, or a reference
    // paid against one invoice could be recorded as settling another.
    if (metaInvoiceId && invoiceIdParam && metaInvoiceId !== invoiceIdParam) {
      return NextResponse.json(
        { error: 'That payment was made against a different invoice.' },
        { status: 409 },
      );
    }
    const targetInvoiceId = invoiceIdParam || metaInvoiceId;

    if (!targetInvoiceId) {
      return NextResponse.json(
        {
          error:
            'Could not associate Paystack payment with a specific invoice.',
        },
        { status: 400 },
      );
    }

    const invoiceResult = await db.execute(
      sql`SELECT id, business_id, number, currency, total_minor, paid_minor, status
          FROM business_financials
          WHERE id = ${targetInvoiceId} AND kind = 'invoice'`,
    );

    if (!invoiceResult.rows.length) {
      return NextResponse.json(
        { error: 'Associated invoice record was not found.' },
        { status: 404 },
      );
    }

    const invoice = invoiceResult.rows[0] as {
      id: string;
      business_id: string;
      number: string;
      currency: string;
      total_minor: number;
      paid_minor: number;
      status: string;
    };

    // Calculate actual amount to record against this invoice
    const remainingBalance = invoice.total_minor - invoice.paid_minor;
    if (remainingBalance <= 0) {
      return NextResponse.json({
        success: true,
        status: 'paid',
        message: 'Invoice was already settled.',
      });
    }

    const amountToRecord = Math.min(verifyResult.amountMinor, remainingBalance);
    const receiptId = crypto.randomUUID();
    const receiptNumber = `RCT-${new Date().getUTCFullYear()}-${receiptId.slice(0, 8).toUpperCase()}`;
    const paymentDate = (verifyResult.paidAt || new Date().toISOString()).slice(
      0,
      10,
    );
    const auditId = crypto.randomUUID();

    // Execute atomic payment and receipt creation
    await db.execute(
      paymentQuery({
        id: receiptId,
        businessId: invoice.business_id,
        financialId: invoice.id,
        amount: amountToRecord,
        reference,
        date: paymentDate,
        number: receiptNumber,
        actorId: 'paystack_gateway',
        auditId,
      }),
    );

    return NextResponse.json({
      success: true,
      status: 'paid',
      receiptId,
      receiptNumber,
      reference,
      amountMinor: amountToRecord,
      currency: invoice.currency,
      paidAt: verifyResult.paidAt || new Date().toISOString(),
      channel: verifyResult.channel,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Verification failed.';
    return NextResponse.json(
      { error: `Payment verification failed: ${message}` },
      { status: 500 },
    );
  }
}

export const GET = withRequestLog('/api/paystack/verify', GETHandler);
