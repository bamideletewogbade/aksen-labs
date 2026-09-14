import { UserRound } from 'lucide-react';
import { requireAdminUser } from '@/app/chatgpt-auth';
import { AdminSettings } from '@/components/admin-settings';
import { displayNameLimit, fullNameLimit } from '@/lib/workspace-settings';
import { emailConfig } from '@/lib/resend';
import { dailyResearchRuns, researchRunsUncapped } from '@/lib/scout-limits';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Settings | Aksen Workspace',
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage() {
  await requireAdminUser('/admin/settings');
  const mail = emailConfig();

  // Read, never written from here. Each of these lives in the deployment, and
  // showing where it comes from is more useful than a control that cannot
  // honestly change it.
  const deployment = [
    {
      label: 'Database',
      value: process.env.DATABASE_URL ? 'Connected' : 'Not configured',
      where: 'DATABASE_URL, set as a Worker secret',
      ok: !!process.env.DATABASE_URL,
    },
    {
      label: 'Model provider',
      value: process.env.OPENROUTER_API_KEY ? 'Key present' : 'No key',
      where: 'OPENROUTER_API_KEY, set as a Worker secret',
      ok: !!process.env.OPENROUTER_API_KEY,
    },
    {
      label: 'Outgoing email',
      value: mail.configured ? `Sending as ${mail.from}` : 'Not configured',
      where: 'RESEND_API_KEY and RESEND_FROM_EMAIL',
      ok: mail.configured,
    },
    {
      label: 'Admin sign-in',
      value: process.env.ADMIN_PASSWORD_HASH
        ? 'Password sign-in'
        : 'Header sign-in',
      where: 'ADMIN_PASSWORD_HASH, changed with scripts/configure-admin.mjs',
      ok: !!process.env.ADMIN_PASSWORD_HASH,
    },
    {
      label: 'Lead Scout allowance',
      value: researchRunsUncapped()
        ? 'Not capped'
        : `${dailyResearchRuns()} runs per day`,
      where: 'SCOUT_DAILY_RUNS, 0 removes the cap',
      ok: true,
    },
  ];

  return (
    <section className="admin-main" id="settings">
      <header className="admin-header">
        <div>
          <small>SETTINGS</small>
          <h1>Your profile and this deployment</h1>
          <p>
            Your name is yours to change here. Everything below it is set where
            the site is deployed, and is shown so you can see what is live
            without going to look for it.
          </p>
        </div>
      </header>

      <section className="admin-panel">
        <div className="panel-head">
          <div>
            <small>PROFILE</small>
            <h2>How you are addressed</h2>
          </div>
          <UserRound />
        </div>
        <AdminSettings
          displayNameLimit={displayNameLimit}
          fullNameLimit={fullNameLimit}
        />
      </section>

      <section className="admin-panel">
        <div className="panel-head">
          <div>
            <small>DEPLOYMENT</small>
            <h2>What is configured</h2>
          </div>
        </div>
        <p className="settings-intro">
          None of these can be edited from this page, and that is deliberate:
          they are secrets held by Cloudflare, and a form that appeared to
          change them would be a way to lock yourself out of the admin from
          inside the admin.
        </p>
        <dl className="settings-status">
          {deployment.map((item) => (
            <div key={item.label} data-ok={item.ok}>
              <dt>{item.label}</dt>
              <dd>
                <strong>{item.value}</strong>
                <small>{item.where}</small>
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </section>
  );
}
