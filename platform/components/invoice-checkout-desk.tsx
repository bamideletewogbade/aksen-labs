'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Lock,
  ArrowRight,
  Printer,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Smartphone,
} from 'lucide-react';
import { money } from '@/lib/workspace-rules';

export type InvoiceData = {
  id: string;
  number: string;
  currency: string;
  totalMinor: number;
  paidMinor: number;
  status: string;
  issuedAt: string | null;
  details: {
    seller?: string;
    buyer?: string;
    terms?: string;
    dueDate?: string;
    notes?: string;
    lines?: Array<{ description: string; quantity: number; unitMinor: number }>;
  };
  receipts: Array<{
    id: string;
    number: string;
    totalMinor: number;
    paymentReference: string;
    issuedAt: string;
  }>;
};

export function InvoiceCheckoutDesk({
  invoice,
  initialReference,
}: {
  invoice: InvoiceData;
  initialReference?: string;
}) {
  const [email, setEmail] = useState(() => {
    const buyer = invoice.details?.buyer || '';
    const match = buyer.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    return match ? match[0] : '';
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(Boolean(initialReference));
  const [status, setStatus] = useState(invoice.status);
  const [paidMinor, setPaidMinor] = useState(invoice.paidMinor);
  const [receipts, setReceipts] = useState(invoice.receipts);

  // Auto-verify if returning from Paystack redirect with ?reference=...
  useEffect(() => {
    if (!initialReference) return;

    let mounted = true;
    async function verify() {
      try {
        setVerifying(true);
        const res = await fetch(
          `/api/paystack/verify?reference=${encodeURIComponent(initialReference!)}&invoiceId=${encodeURIComponent(invoice.id)}`,
        );
        const data = (await res.json()) as Record<string, any>;

        if (!mounted) return;

        if (res.ok && data.success && data.status === 'paid') {
          setStatus('paid');
          setPaidMinor(invoice.totalMinor);
          if (data.receiptNumber) {
            setReceipts((prev) => [
              {
                id: data.receiptId || crypto.randomUUID(),
                number: data.receiptNumber,
                totalMinor: data.amountMinor || invoice.totalMinor,
                paymentReference: initialReference!,
                issuedAt: data.paidAt || new Date().toISOString(),
              },
              ...prev,
            ]);
          }
        } else {
          setError(
            data.message ||
              'Payment could not be verified yet. Please check your bank or Mobile Money account.',
          );
        }
      } catch (err) {
        if (mounted) {
          setError('Network error while verifying payment status.');
        }
      } finally {
        if (mounted) setVerifying(false);
      }
    }

    verify();
    return () => {
      mounted = false;
    };
  }, [initialReference, invoice.id, invoice.totalMinor]);

  const balanceMinor = Math.max(0, invoice.totalMinor - paidMinor);
  const isPaid = status === 'paid' || balanceMinor === 0;

  async function handlePaystackCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address to receive your payment receipt.');
      return;
    }

    try {
      setBusy(true);
      setError('');

      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
          email,
        }),
      });

      const data = (await res.json()) as Record<string, any>;
      if (!res.ok || !data.success || !data.authorizationUrl) {
        throw new Error(data.error || 'Failed to initialize Paystack checkout.');
      }

      // Redirect directly to Paystack hosted checkout
      window.location.href = data.authorizationUrl;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not connect to payment processor.',
      );
      setBusy(false);
    }
  }

  function copyPaymentLink() {
    const url = window.location.href.split('?')[0];
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    });
  }

  return (
    <div className="checkout-container">
      {/* Top Bar / Verification Banner */}
      {verifying && (
        <div className="checkout-banner verifying">
          <div className="spinner" />
          <span>Verifying transaction with Paystack...</span>
        </div>
      )}

      {isPaid ? (
        <div className="checkout-banner paid">
          <CheckCircle2 size={20} />
          <div>
            <strong>Payment Confirmed</strong>
            <span>
              This invoice has been settled in full. An official receipt has been issued.
            </span>
          </div>
        </div>
      ) : status === 'void' ? (
        <div className="checkout-banner void">
          <AlertCircle size={20} />
          <div>
            <strong>Invoice Voided</strong>
            <span>This document is no longer payable.</span>
          </div>
        </div>
      ) : null}

      {error && (
        <div className="checkout-banner error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="checkout-card">
        {/* Header */}
        <header className="checkout-header">
          <div className="checkout-brand">
            <Link href="/" className="checkout-wordmark">
              <span className="agency-mark">a</span>
              <span>
                aksen<span className="agency-wordmark-labs">labs</span>
              </span>
            </Link>
            <p className="checkout-tagline">Digital Transformation &amp; Connected Systems</p>
          </div>

          <div className="checkout-doc-meta">
            <span className={`status-pill ${status}`}>{status.toUpperCase()}</span>
            <h2>{invoice.number}</h2>
            <small>
              Issued{' '}
              {invoice.issuedAt
                ? new Date(invoice.issuedAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Recent'}
            </small>
          </div>
        </header>

        {/* Parties */}
        <div className="checkout-parties">
          <div className="party-block">
            <small>ISSUED BY</small>
            <p>{invoice.details?.seller || 'Aksen Labs · Accra, Ghana'}</p>
          </div>
          <div className="party-block">
            <small>BILLED TO</small>
            <p>{invoice.details?.buyer || 'Client Partner'}</p>
          </div>
        </div>

        {/* Line Items */}
        <section className="checkout-lines-section">
          <table className="checkout-table">
            <thead>
              <tr>
                <th>Description</th>
                <th className="num-col">Qty</th>
                <th className="num-col">Unit Price</th>
                <th className="num-col">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.details?.lines?.map((line, idx) => (
                <tr key={idx}>
                  <td>{line.description}</td>
                  <td className="num-col">{line.quantity}</td>
                  <td className="num-col">{money(line.unitMinor, invoice.currency)}</td>
                  <td className="num-col">
                    {money(line.quantity * line.unitMinor, invoice.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Totals Summary */}
        <div className="checkout-totals">
          <div className="totals-row">
            <span>Invoice Total</span>
            <strong>{money(invoice.totalMinor, invoice.currency)}</strong>
          </div>
          {paidMinor > 0 && (
            <div className="totals-row paid-amount">
              <span>Paid to Date</span>
              <span>- {money(paidMinor, invoice.currency)}</span>
            </div>
          )}
          <div className="totals-row balance-due">
            <span>Amount Due</span>
            <strong>{money(balanceMinor, invoice.currency)}</strong>
          </div>
        </div>

        {/* Receipts History */}
        {receipts.length > 0 && (
          <div className="checkout-receipts-list">
            <h4>Payment Receipts</h4>
            {receipts.map((r) => (
              <div key={r.id} className="receipt-item">
                <div>
                  <strong>{r.number}</strong>
                  <small>
                    Ref: {r.paymentReference} ·{' '}
                    {new Date(r.issuedAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </small>
                </div>
                <b>{money(r.totalMinor, invoice.currency)}</b>
              </div>
            ))}
          </div>
        )}

        {/* Payment Action Box */}
        {!isPaid && status === 'issued' && (
          <div className="checkout-action-box">
            <div className="payment-gateways-badge">
              <ShieldCheck size={16} />
              <span>Secure checkout powered by Paystack</span>
            </div>

            <div className="accepted-channels">
              <span className="channel-chip">
                <Smartphone size={14} /> MTN Mobile Money
              </span>
              <span className="channel-chip">
                <Smartphone size={14} /> Telecel Cash
              </span>
              <span className="channel-chip">
                <CreditCard size={14} /> Visa / Mastercard
              </span>
            </div>

            <form onSubmit={handlePaystackCheckout} className="paystack-form">
              <label>
                <span>Email address for receipt</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. finance@yourbusiness.com"
                  disabled={busy}
                />
              </label>

              <button
                type="submit"
                disabled={busy || balanceMinor <= 0}
                className="paystack-submit-btn"
              >
                <Lock size={16} />
                <span>
                  {busy
                    ? 'Connecting to Paystack...'
                    : `Pay ${money(balanceMinor, invoice.currency)} with Paystack`}
                </span>
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        )}

        {/* Terms & Notes */}
        {(invoice.details?.terms || invoice.details?.notes) && (
          <div className="checkout-terms">
            {invoice.details.terms && (
              <div>
                <small>TERMS</small>
                <p>{invoice.details.terms}</p>
              </div>
            )}
            {invoice.details.notes && (
              <div>
                <small>NOTES</small>
                <p>{invoice.details.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <footer className="checkout-footer">
          <button
            type="button"
            onClick={() => window.print()}
            className="secondary-btn"
          >
            <Printer size={15} />
            <span>Print or Save PDF</span>
          </button>

          <button
            type="button"
            onClick={copyPaymentLink}
            className="secondary-btn"
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            <span>{copied ? 'Link Copied!' : 'Copy Payment Link'}</span>
          </button>
        </footer>
      </div>

      <p className="checkout-disclaimer">
        All online payments are processed through Paystack Ghana under strict bank-grade PCI-DSS
        Level 1 compliance.
      </p>
    </div>
  );
}
