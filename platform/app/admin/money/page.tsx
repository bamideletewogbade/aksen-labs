import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { moneyOverview } from '@/lib/daily-work-data';
import { invoiceHref } from '@/lib/daily-work';
import { todayIso } from '@/lib/pipeline-order';
import { money } from '@/lib/workspace-rules';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Money | Aksen Workspace' };

export default async function MoneyPage() {
  const user = await getChatGPTUser();
  const today = todayIso();
  let data: Awaited<ReturnType<typeof moneyOverview>> | null = null;
  try {
    data = await moneyOverview(user?.userId ?? '');
  } catch {
    /* Unavailable records must not appear as zero money. */
  }
  return (
    <section className="admin-main money-overview">
      <header className="admin-header">
        <div>
          <small>ACROSS CLIENTS</small>
          <h1>Money</h1>
          <p>See what is recorded and which invoices still need attention.</p>
        </div>
        <Link href="/admin/workspaces" prefetch={false}>
          Open a client record <ArrowUpRight size={16} />
        </Link>
      </header>
      {!data ? (
        <div className="empty-admin" role="alert">
          <strong>Money records could not be loaded.</strong>
          <span>Reload to try again. No amounts have been substituted.</span>
        </div>
      ) : (
        <>
          {data.totals.length ? (
            <div className="money-totals">
              {data.totals.map((total) => (
                <section
                  key={total.currency}
                  aria-label={`${total.currency} totals`}
                >
                  <h2>{total.currency}</h2>
                  <dl>
                    <div>
                      <dt>Recorded collections</dt>
                      <dd>{money(total.collected, total.currency)}</dd>
                    </div>
                    <div>
                      <dt>Unpaid invoices</dt>
                      <dd>{money(total.outstanding, total.currency)}</dd>
                    </div>
                  </dl>
                </section>
              ))}
            </div>
          ) : (
            <div className="empty-admin">
              <strong>No issued financial records yet.</strong>
              <span>
                Open a client record to prepare an invoice or record a
                collection.
              </span>
            </div>
          )}
          <p className="daily-note">
            Collections cover all issued receipts on record, not just this
            month. Balances cover issued invoices; a client agreement with an
            unknown total still needs review.
          </p>
          <section className="daily-priorities" aria-labelledby="unpaid-title">
            <div className="daily-section-head">
              <div>
                <h2 id="unpaid-title">Unpaid invoices</h2>
                <p>
                  Open the invoice to review its details before following up.
                </p>
              </div>
            </div>
            {data.invoices.length ? (
              <ul className="money-invoices">
                {data.invoices.map((invoice) => (
                  <li key={invoice.id}>
                    <div>
                      <strong>{invoice.client}</strong>
                      <span>
                        {invoice.number} ·{' '}
                        {invoice.dueDate
                          ? `${invoice.dueDate < today ? 'Overdue' : invoice.dueDate === today ? 'Due today' : 'Due'} · ${invoice.dueDate}`
                          : 'No due date recorded'}
                      </span>
                    </div>
                    <strong>{money(invoice.balance, invoice.currency)}</strong>
                    <Link
                      href={invoiceHref(invoice)}
                      prefetch={false}
                      aria-label={`Review ${invoice.number} for ${invoice.client}`}
                    >
                      Review <ArrowUpRight size={16} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-admin">
                <strong>No unpaid issued invoices on record.</strong>
                <span>
                  Unbilled work and unknown client balances are not included.
                </span>
              </div>
            )}
            {data.invoiceCount > data.invoices.length && (
              <p className="daily-note">
                Showing the first {data.invoices.length} of {data.invoiceCount}{' '}
                unpaid invoices. Open a client record for the full history.
              </p>
            )}
          </section>
        </>
      )}
    </section>
  );
}
