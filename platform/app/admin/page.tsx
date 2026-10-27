import Link from 'next/link';
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarClock,
  Wallet,
} from 'lucide-react';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { dailyWork } from '@/lib/daily-work-data';
import { dailyActions } from '@/lib/daily-work';
import { todayIso } from '@/lib/pipeline-order';
import { money } from '@/lib/workspace-rules';
import { DailyActionList } from '@/components/daily-action-list';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Today | Aksen Workspace' };

const plural = (count: number, one: string, many: string) =>
  count === 1 ? one : many;

export default async function AdminPage() {
  const user = await getChatGPTUser();
  const today = todayIso();
  let data: Awaited<ReturnType<typeof dailyWork>> | null = null;
  try {
    data = await dailyWork(user?.userId ?? '', today);
  } catch {
    /* Show unavailable, never an invented clear day. */
  }
  const actions = data
    ? dailyActions({
        leads: data.leads,
        projects: data.projects,
        invoices: data.money.invoices,
        today,
      })
    : [];
  const truncated =
    data &&
    (data.leadCount > data.leads.length ||
      data.projectCount > data.projects.length ||
      data.money.invoiceCount > data.money.invoices.length);
  // Currencies are never added together, so each outstanding balance is
  // listed on its own.
  const outstanding = data?.money.totals
    .filter((total) => total.outstanding > 0)
    .map((total) => money(total.outstanding, total.currency))
    .join(' · ');
  const shortcuts = data
    ? [
        {
          href: '/admin/pipeline',
          Icon: CalendarClock,
          count: data.followUpCount,
          label: plural(data.followUpCount, 'follow-up', 'follow-ups') + ' due',
          detail: `${data.leadCount} open ${plural(data.leadCount, 'enquiry', 'enquiries')}`,
        },
        {
          href: '/admin/projects',
          Icon: BriefcaseBusiness,
          count: data.projectCount,
          label: `client ${plural(data.projectCount, 'project', 'projects')}`,
          detail: 'Delivery, review and handover',
        },
        {
          href: '/admin/money',
          Icon: Wallet,
          count: data.money.invoiceCount,
          label: `unpaid ${plural(data.money.invoiceCount, 'invoice', 'invoices')}`,
          detail: outstanding
            ? `${outstanding} outstanding`
            : 'Nothing outstanding',
        },
      ]
    : [];
  return (
    <section className="admin-main daily-home">
      <header className="admin-header">
        <div>
          <small>
            {new Intl.DateTimeFormat('en', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              timeZone: 'UTC',
            }).format(new Date(`${today}T12:00:00Z`))}
          </small>
          <h1>Today</h1>
          <p>Follow up, move client work forward and keep money in view.</p>
        </div>
        <Link href="/admin/pipeline#add" prefetch={false}>
          Add an enquiry <ArrowUpRight size={16} />
        </Link>
      </header>
      {!data ? (
        <div className="empty-admin" role="alert">
          <strong>Your work could not be loaded.</strong>
          <span>
            Reload the page to try again. Your records have not changed.
          </span>
          <Link href="/admin" prefetch={false}>
            Reload Today
          </Link>
        </div>
      ) : (
        <>
          <nav className="daily-shortcuts" aria-label="Daily work">
            {shortcuts.map(({ href, Icon, count, label, detail }) => (
              <Link
                key={href}
                href={href}
                prefetch={false}
                data-quiet={count === 0 || undefined}
              >
                <span className="daily-stat-top" aria-hidden="true">
                  <Icon size={18} />
                  <ArrowUpRight size={16} />
                </span>
                <span className="daily-stat-count">{count}</span>{' '}
                <strong>{label}</strong> <small>{detail}</small>
              </Link>
            ))}
          </nav>
          <section
            className="daily-priorities"
            aria-labelledby="daily-priorities-title"
          >
            <div className="daily-section-head">
              <h2 id="daily-priorities-title">Start here</h2>
              <p>Overdue work and blockers come first.</p>
            </div>
            <DailyActionList actions={actions} />
            {truncated && (
              <p className="daily-note">
                This is a selection of your open work. Use Sales, Work and Money
                to review the full lists.
              </p>
            )}
          </section>
        </>
      )}
    </section>
  );
}
