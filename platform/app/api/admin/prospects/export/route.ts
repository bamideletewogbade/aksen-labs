import { sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { workspaceUser } from '@/lib/workspace-access';
import { withRequestLog } from '@/lib/request-log';
import {
  EMPTY_FILTER,
  filterLeads,
  type LeadFilter,
  type StoredLead,
} from '@/lib/lead-filters';
import {
  CONTENT_TYPE,
  exportFilename,
  isExportFormat,
  toCsv,
  toPdf,
  toXlsx,
} from '@/lib/lead-export';

/**
 * Downloading the lead queue.
 *
 * The filter is rebuilt from query parameters and applied with the same
 * filterLeads the screen uses, so "export" means exactly the rows in front of
 * you. Sending the client's own list up instead would have been less code and
 * would have let anyone post a body of leads they had never been shown.
 *
 * The cap is higher than the screen's because an export is where you go when
 * there is more than you want to scroll, but it is still a cap: a Worker has a
 * memory limit and a spreadsheet is built in full before a byte is sent.
 */

const MAX_ROWS = 2000;

function filterFrom(params: URLSearchParams): LeadFilter {
  const number = (name: string, max: number) => {
    const value = Number(params.get(name));
    return Number.isFinite(value) && value > 0 ? Math.min(value, max) : 0;
  };
  return {
    ...EMPTY_FILTER,
    status: (params.get('status') || 'all') as LeadFilter['status'],
    contact: (params.get('contact') || 'any') as LeadFilter['contact'],
    minSources: number('minSources', 50),
    withinDays: number('withinDays', 3650),
    runId: (params.get('runId') || 'all').slice(0, 100),
    text: (params.get('text') || '').slice(0, 200),
  };
}

async function get(request: Request) {
  let user;
  try {
    user = await workspaceUser();
  } catch {
    return Response.json({ error: 'Admin access required.' }, { status: 403 });
  }

  const params = new URL(request.url).searchParams;
  const format = params.get('format') || 'csv';
  if (!isExportFormat(format))
    return Response.json(
      { error: 'Choose csv, xlsx or pdf.' },
      { status: 400 },
    );

  try {
    const rows = await getDb().execute(
      sql`SELECT * FROM prospect_leads
           WHERE owner_id=${user.userId}
           ORDER BY updated_at DESC
           LIMIT ${MAX_ROWS}`,
    );
    const leads = filterLeads(
      rows.rows as unknown as StoredLead[],
      filterFrom(params),
    );

    const body =
      format === 'csv'
        ? toCsv(leads)
        : format === 'xlsx'
          ? toXlsx(leads)
          : toPdf(leads);

    return new Response(body as BodyInit, {
      headers: {
        'Content-Type': CONTENT_TYPE[format],
        // attachment, so a PDF saves rather than opening in a tab the person
        // then has to save again from.
        'Content-Disposition': `attachment; filename="${exportFilename(format, leads.length)}"`,
        'Cache-Control': 'private, no-store',
        'X-Lead-Count': String(leads.length),
      },
    });
  } catch {
    return Response.json(
      {
        error: 'The export could not be built. Check the database connection.',
      },
      { status: 503 },
    );
  }
}

export const GET = withRequestLog('/api/admin/prospects/export', get);
