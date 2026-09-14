import { withRequestLog } from '@/lib/request-log';
import { NextResponse } from 'next/server';
import { workspaceUser } from '@/lib/workspace-access';
import { getDb } from '@/db';
import { leadProjectQuery } from '@/lib/lead-project';
async function POSTHandler(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await workspaceUser();
  } catch {
    return NextResponse.json(
      { error: 'Admin access required.' },
      { status: 403 },
    );
  }
  if (
    request.headers.get('origin') &&
    request.headers.get('origin') !== new URL(request.url).origin
  )
    return NextResponse.json(
      { error: 'Invalid request origin.' },
      { status: 403 },
    );
  try {
    const { id } = await params;
    const result = await getDb().execute(leadProjectQuery(id, user.userId));
    if (!result.rows.length)
      return NextResponse.json(
        {
          error:
            'Mark an agreed engagement as won first, or ask its project owner to open the existing project.',
        },
        { status: 409 },
      );
    return NextResponse.json({ id: result.rows[0].id });
  } catch {
    return NextResponse.json(
      { error: 'Could not create the project. Please retry.' },
      { status: 503 },
    );
  }
}

export const POST = withRequestLog(
  '/api/admin/opportunities/[id]/project',
  POSTHandler,
);
