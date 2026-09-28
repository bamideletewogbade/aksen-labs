import { NextResponse } from 'next/server';
import { withRequestLog } from '@/lib/request-log';
import { workspaceUser } from '@/lib/workspace-access';
import {
  executePaystackAgentTool,
  paystackAgentToolSchemas,
  isPaystackConfigured,
} from '@/lib/paystack';

async function GETHandler() {
  return NextResponse.json({
    configured: isPaystackConfigured(),
    tools: paystackAgentToolSchemas,
  });
}

async function POSTHandler(request: Request) {
  try {
    await workspaceUser();
  } catch {
    return NextResponse.json(
      { error: 'Admin workspace authorization required.' },
      { status: 401 },
    );
  }

  let body: { tool?: string; args?: Record<string, unknown> };
  try {
    body = (await request.json()) as {
      tool?: string;
      args?: Record<string, unknown>;
    };
  } catch {
    return NextResponse.json(
      { error: 'A valid JSON request body is required.' },
      { status: 400 },
    );
  }

  if (!body.tool || typeof body.tool !== 'string') {
    return NextResponse.json(
      { error: 'A valid tool name is required.' },
      { status: 400 },
    );
  }

  const originUrl =
    request.headers.get('origin') ||
    process.env.SITE_URL ||
    'https://aksenlabs.com';

  const result = await executePaystackAgentTool(
    body.tool,
    body.args || {},
    { originUrl },
  );

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || 'Tool execution failed.' },
      { status: 400 },
    );
  }

  return NextResponse.json({
    success: true,
    tool: body.tool,
    data: result.data,
  });
}

export const GET = withRequestLog('/api/admin/paystack/tools', GETHandler);
export const POST = withRequestLog('/api/admin/paystack/tools', POSTHandler);
