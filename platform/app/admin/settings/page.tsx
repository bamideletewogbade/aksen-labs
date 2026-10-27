import { UserRound } from 'lucide-react';
import { requireAdminUser } from '@/app/chatgpt-auth';
import { AdminSettings } from '@/components/admin-settings';
import { displayNameLimit, fullNameLimit } from '@/lib/workspace-settings';
import { emailConfig } from '@/lib/resend';
import { dailyResearchRuns, researchRunsUncapped } from '@/lib/scout-limits';
import { isPaystackConfigured, isPaystackTestMode } from '@/lib/paystack';
import { gatewayEnabled } from '@/lib/ai-routing';
import { gatewayCredits } from '@/lib/gateway-credits';
import { AiConnectionCheck } from '@/components/ai-connection-check';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Settings | Aksen Workspace',
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage() {
  await requireAdminUser('/admin/settings');
  const mail = emailConfig();
  const credits = await gatewayCredits();

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
      label: 'Vercel AI Gateway',
      value: gatewayEnabled()
        ? 'Key present, used first for chat, search and Jev'
        : process.env.AI_GATEWAY_API_KEY
          ? 'Key present, switched off by AI_PROVIDER=openrouter'
          : 'No key, OpenRouter only',
      where: 'AI_GATEWAY_API_KEY, set as a Worker secret',
      ok: gatewayEnabled(),
    },
    {
      // Optional while the gateway carries the calls; without it a refused
      // gateway call has nowhere to go, and image and video jobs stop.
      label: 'OpenRouter (backup, images, video)',
      value: process.env.OPENROUTER_API_KEY
        ? 'Key present'
        : gatewayEnabled()
          ? 'No key, so no backup route and no image or video jobs'
          : 'No key',
      where: 'OPENROUTER_API_KEY, set as a Worker secret',
      ok: !!process.env.OPENROUTER_API_KEY || gatewayEnabled(),
    },
    {
      label: 'Outgoing email',
      value: mail.configured ? `Sending as ${mail.from}` : 'Not configured',
      where: 'RESEND_API_KEY and RESEND_FROM_EMAIL',
      ok: mail.configured,
    },
    {
      label: 'Payments (Paystack)',
      value: isPaystackConfigured()
        ? `Connected (${isPaystackTestMode() ? 'Test mode' : 'Live mode'} · MoMo / Cards)`
        : 'Not configured',
      where: 'PAYSTACK_SECRET_KEY, set in environment',
      ok: isPaystackConfigured(),
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
            Change how you are addressed. Deployment settings are shown
            read-only.
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

      <section className="admin-panel settings-ai">
        <div className="panel-head">
          <div>
            <small>AI</small>
            <h2>Connection and credits</h2>
          </div>
        </div>
        <p>
          {credits.status === 'available'
            ? `Vercel AI Gateway: USD ${credits.balance.toFixed(4)} available. Total reported usage: USD ${credits.totalUsed.toFixed(4)}. This balance is shared by applications using the same Vercel team.`
            : credits.status === 'not-configured'
              ? 'Vercel AI Gateway is not configured.'
              : 'The Vercel credit balance could not be checked. This does not confirm a zero balance.'}
        </p>
        <p>
          A balance check does not verify model access. Run a small test below
          to check a response.
        </p>
        <AiConnectionCheck />
      </section>

      <section className="admin-panel">
        <div className="panel-head">
          <div>
            <small>DEPLOYMENT</small>
            <h2>What is configured</h2>
          </div>
        </div>
        <p className="settings-intro">
          Read-only on purpose: these are Cloudflare secrets, and editing them
          here could lock you out of the admin.
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
