import type { Metadata } from 'next';
import { sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { InvoiceCheckoutDesk, type InvoiceData } from '@/components/invoice-checkout-desk';
import '@/app/pay/checkout.css';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const db = getDb();
    const rows = await db.execute(
      sql`SELECT number FROM business_financials WHERE id=${id} AND kind='invoice' LIMIT 1`,
    );
    if (rows.rows.length) {
      const num = String(rows.rows[0].number);
      return {
        title: `Invoice ${num} | Aksen Labs Pay`,
        description: `Secure online invoice payment for ${num} powered by Paystack.`,
      };
    }
  } catch {}

  return {
    title: 'Invoice Payment | Aksen Labs',
    description: 'Pay your invoice securely with Mobile Money or bank card.',
  };
}

export default async function InvoicePaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ reference?: string }>;
}) {
  const { id } = await params;
  const { reference } = await searchParams;

  let invoice: InvoiceData | null = null;
  let notFound = false;

  try {
    const db = getDb();
    const [invRows, receiptRows] = await Promise.all([
      db.execute(
        sql`SELECT id, number, currency, total_minor, paid_minor, status, issued_at, details
            FROM business_financials
            WHERE id=${id} AND kind='invoice'
            LIMIT 1`,
      ),
      db.execute(
        sql`SELECT id, number, total_minor, payment_reference, issued_at
            FROM business_financials
            WHERE invoice_id=${id} AND kind='receipt'
            ORDER BY issued_at DESC`,
      ),
    ]);

    if (!invRows.rows.length) {
      notFound = true;
    } else {
      const row = invRows.rows[0] as {
        id: string;
        number: string;
        currency: string;
        total_minor: number;
        paid_minor: number;
        status: string;
        issued_at: string | null;
        details: any;
      };

      const receipts = receiptRows.rows.map((r: any) => ({
        id: String(r.id),
        number: String(r.number),
        totalMinor: Number(r.total_minor),
        paymentReference: String(r.payment_reference || ''),
        issuedAt: String(r.issued_at || new Date().toISOString()),
      }));

      invoice = {
        id: row.id,
        number: row.number,
        currency: row.currency,
        totalMinor: Number(row.total_minor),
        paidMinor: Number(row.paid_minor),
        status: row.status,
        issuedAt: row.issued_at,
        details: row.details || {},
        receipts,
      };
    }
  } catch (err) {
    notFound = true;
  }

  if (notFound || !invoice) {
    return (
      <main className="checkout-page">
        <div className="checkout-container">
          <div className="checkout-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <h2 style={{ fontSize: '24px', margin: '0 0 12px', color: '#11241a' }}>
              Invoice Not Found
            </h2>
            <p style={{ color: '#56685c', maxWidth: '420px', margin: '0 auto 24px' }}>
              The invoice link you followed is invalid, has expired, or was removed.
              Please contact Aksen Labs if you believe this is an error.
            </p>
            <a
              href="/"
              style={{
                display: 'inline-block',
                background: '#2c6b2f',
                color: '#ffffff',
                padding: '10px 20px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Return to Aksen Labs
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <InvoiceCheckoutDesk invoice={invoice} initialReference={reference} />
    </main>
  );
}
