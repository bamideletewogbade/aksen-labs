import { NextResponse } from 'next/server';
import { withRequestLog } from '@/lib/request-log';
import { checkSpecification, type Specification, type Scenario } from '@/lib/order-demo';
import { initializePaystackCheckout, isPaystackConfigured } from '@/lib/paystack';
import { logAgentRun } from '@/lib/agent-runs';

async function POSTHandler(request: Request) {
  if (!isPaystackConfigured()) {
    return NextResponse.json(
      { error: 'Paystack is not configured. Add PAYSTACK_SECRET_KEY to the environment.' },
      { status: 503 },
    );
  }

  let body: { spec?: Specification; scenario?: Scenario; email?: string };
  try {
    body = (await request.json()) as {
      spec?: Specification;
      scenario?: Scenario;
      email?: string;
    };
  } catch {
    return NextResponse.json(
      { error: 'A valid JSON request body is required.' },
      { status: 400 },
    );
  }

  if (!body.spec) {
    return NextResponse.json(
      { error: 'Order specifications are required.' },
      { status: 400 },
    );
  }

  const check = checkSpecification(body.spec);
  if (check.issues.length > 0 || !check.totalPesewas) {
    return NextResponse.json(
      { error: 'Cannot checkout with invalid or incomplete specifications.' },
      { status: 400 },
    );
  }

  const origin =
    request.headers.get('origin') ||
    process.env.SITE_URL ||
    'http://localhost:3000';

  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  const reference = `ORDER-DEMO-${Date.now()}-${randomSuffix}`;
  const callbackUrl = `${origin}/order-demo?stage=paid&reference=${encodeURIComponent(reference)}&paystack=success`;

  const email =
    typeof body.email === 'string' && body.email.includes('@')
      ? body.email.trim()
      : 'demo-customer@aksenlabs.com';

  const checkoutResult = await initializePaystackCheckout({
    email,
    amountMinor: check.totalPesewas,
    currency: 'GHS',
    reference,
    callbackUrl,
    metadata: {
      type: 'order_demo',
      scenario: body.scenario || 'complete',
      spec: body.spec,
      purpose: 'Cedar Home Demo Order Checkout',
    },
    channels: ['card', 'mobile_money', 'bank_transfer', 'qr'],
  });

  if (!checkoutResult.success || !checkoutResult.authorizationUrl) {
    return NextResponse.json(
      { error: checkoutResult.message || 'Could not initialize Paystack checkout.' },
      { status: 502 },
    );
  }

  await logAgentRun({
    agentName: 'Order demo checkout',
    channel: 'order_demo',
    status: 'success',
    outcome: `Paystack checkout initialized: ${reference} (${check.totalPesewas} pesewas)`,
    durationMs: 0,
    trace: {
      reference,
      scenario: body.scenario,
      amountMinor: check.totalPesewas,
      currency: 'GHS',
    },
  });

  return NextResponse.json({
    success: true,
    authorizationUrl: checkoutResult.authorizationUrl,
    accessCode: checkoutResult.accessCode,
    reference,
  });
}

export const POST = withRequestLog('/api/order-demo/checkout', POSTHandler);
