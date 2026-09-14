import { sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { workspaceUser } from '@/lib/workspace-access';
import { withRequestLog } from '@/lib/request-log';
async function get() {
  try {
    await workspaceUser();
  } catch {
    return Response.json({ error: 'Admin access required.' }, { status: 403 });
  }
  const required = [
    'opportunities',
    'projects',
    'agent_runs',
    'audit_events',
    'agency_email_outbox',
    'business_workspaces',
    'workspace_demo_usage',
    'prospect_leads',
    'prospect_run_events',
    'prospect_runs',
    'prospect_campaigns',
    ...(process.env.ADMIN_PASSWORD_HASH ? ['admin_sessions'] : []),
  ];
  let tables: string[] = [];
  let database = false;
  try {
    const result = await getDb().execute(
      sql`SELECT tablename FROM pg_tables WHERE schemaname='public'`,
    );
    tables = result.rows.map((row) => String(row.tablename));
    database = true;
  } catch {
    /* Report readiness honestly without exposing connection details. */
  }
  return Response.json(
    {
      database,
      missingTables: required.filter((t) => !tables.includes(t)),
      openrouter: !!process.env.OPENROUTER_API_KEY,
      resend: !!process.env.RESEND_API_KEY && !!process.env.RESEND_FROM_EMAIL,
      adminAllowlist: !!process.env.ADMIN_EMAILS?.trim(),
      notes: [
        'AI configuration means a key is present, not a successful provider check.',
        'WhatsApp, payment verification and order fulfilment remain demos.',
        'Marketing campaigns, unsubscribe handling and delivery-event processing are not connected.',
        'Lead Scout never sends outreach. Review source evidence before contact.',
      ],
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
export const GET = withRequestLog('/api/admin/readiness', get);
