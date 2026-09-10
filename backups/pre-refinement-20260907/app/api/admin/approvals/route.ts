import { NextResponse } from 'next/server';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDb } from '@/db';
import { approvalDecisionQuery } from '@/lib/approval-decision';

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  const allowlist = (process.env.ADMIN_EMAILS || '').split(',').map((v) => v.trim().toLowerCase()).filter(Boolean);
  if (allowlist.length && !allowlist.includes(user.email.toLowerCase())) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: 'A valid decision is required.' }, { status: 400 });
  const id = typeof body.id === 'string' ? body.id : '';
  const decision = body.decision === 'approved' || body.decision === 'rejected' ? body.decision : '';
  if (!id || !decision) return NextResponse.json({ error: 'An approval id and decision are required.' }, { status: 400 });

  try {
    const result = await getDb().execute(approvalDecisionQuery(id, decision, user.userId));
    const updated = result.rows[0];
    if (!updated) return NextResponse.json({ error: 'This request is no longer pending, or its draft is unavailable. Reload and review it again.' }, { status: 409 });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'The decision could not be completed. No partial publication was saved. Please retry.' }, { status: 503 });
  }
}
