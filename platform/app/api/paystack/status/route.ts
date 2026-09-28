import { NextResponse } from 'next/server';
import { withRequestLog } from '@/lib/request-log';
import { getPaystackAccountStatus } from '@/lib/paystack';
import { requireAdminUser } from '@/app/chatgpt-auth';

async function GETHandler(request: Request) {
  try {
    await requireAdminUser('/admin/settings');
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const status = await getPaystackAccountStatus();
  const origin =
    request.headers.get('origin') ||
    process.env.SITE_URL ||
    new URL(request.url).origin;
  const webhookUrl = `${origin}/api/paystack/webhook`;

  return NextResponse.json({
    ...status,
    webhookUrl,
  });
}

export const GET = withRequestLog('/api/paystack/status', GETHandler);
