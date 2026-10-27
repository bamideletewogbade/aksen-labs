import { sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { workspaceUser } from '@/lib/workspace-access';
import { withRequestLog } from '@/lib/request-log';
import { boundedJson } from '@/lib/bounded-json';
import { chatComplete } from '@/lib/openrouter';
import { gatewayMapperWriterModels } from '@/lib/ai-routing';
import {
  outreachEvidence,
  outreachPrompt,
  parseOutreach,
  type OutreachBrief,
} from '@/lib/prospect-outreach';
import { emailConfig } from '@/lib/resend';
import { promoteProspectQuery } from '@/lib/prospecting';
import type { Prospect } from '@/lib/prospect-evidence';

async function handle(request: Request) {
  let user;
  try {
    user = await workspaceUser();
  } catch {
    return Response.json({ error: 'Admin access required.' }, { status: 403 });
  }
  if (
    request.method === 'POST' &&
    request.headers.get('origin') !== new URL(request.url).origin
  )
    return Response.json({ error: 'Invalid request origin.' }, { status: 403 });
  let body: Record<string, unknown> = {};
  if (request.method === 'POST') {
    try {
      body = (await boundedJson(request, 16000)) as Record<string, unknown>;
    } catch {
      return Response.json(
        { error: 'Send a valid, bounded request.' },
        { status: 400 },
      );
    }
    if (!body || typeof body !== 'object' || Array.isArray(body))
      return Response.json({ error: 'Invalid request.' }, { status: 400 });
  }
  const leadId = (
    typeof body.leadId === 'string'
      ? body.leadId
      : new URL(request.url).searchParams.get('leadId') || ''
  ).slice(0, 100);
  const db = getDb();
  try {
    const leadResult = await db.execute(
      sql`SELECT id,company,data,status,opportunity_id FROM prospect_leads WHERE id=${leadId} AND owner_id=${user.userId}`,
    );
    const lead = leadResult.rows[0];
    if (!lead)
      return Response.json({ error: 'Prospect unavailable.' }, { status: 404 });
    let opportunityId =
      typeof lead.opportunity_id === 'string' ? lead.opportunity_id : '';
    const read = async () => {
      const result = await db.execute(
        sql`SELECT p.*,e.status AS email_status FROM prospect_outreach p LEFT JOIN agency_email_outbox e ON e.id=p.outbox_id AND e.owner_id=p.owner_id WHERE p.lead_id=${leadId} AND p.owner_id=${user.userId}`,
      );
      return result.rows[0] || null;
    };
    let record = await read();
    if (request.method === 'GET')
      return Response.json(
        { record, sendingConfigured: emailConfig().configured, opportunityId },
        { headers: { 'Cache-Control': 'private, no-store' } },
      );
    if (!['shortlisted', 'promoted'].includes(String(lead.status)))
      return Response.json(
        { error: 'Shortlist and review this prospect first.' },
        { status: 409 },
      );
    if (body.action === 'prepare') {
      if (record)
        return Response.json({
          record,
          sendingConfigured: emailConfig().configured,
          opportunityId,
        });
      let evidence: Prospect;
      try {
        evidence = outreachEvidence(lead.data as Prospect);
      } catch (error) {
        return Response.json(
          { error: (error as Error).message },
          { status: 422 },
        );
      }
      const recipient = evidence.contacts
        .find((c) => c.kind === 'email')!
        .value.toLowerCase();
      const stopped = await db.execute(
        sql`SELECT email FROM email_suppressions WHERE email=${recipient}`,
      );
      if (stopped.rows.length)
        return Response.json(
          { error: 'This address asked not to be contacted.' },
          { status: 409 },
        );
      const bucket = `outreach-${user.userId}-${new Date().toISOString().slice(0, 13)}`;
      const quota = await db.execute(
        sql`INSERT INTO workspace_demo_usage(bucket,requests) VALUES(${bucket},1) ON CONFLICT(bucket) DO UPDATE SET requests=workspace_demo_usage.requests+1 WHERE workspace_demo_usage.requests<10 RETURNING requests`,
      );
      if (!quota.rows.length)
        return Response.json(
          { error: 'Ten outreach briefs per hour are allowed.' },
          { status: 429 },
        );
      const result = await chatComplete({
        profile: 'drafting',
        json: true,
        gatewayModels: gatewayMapperWriterModels(),
        maxTokens: 1800,
        timeoutMs: 45000,
        messages: [
          { role: 'system', content: outreachPrompt },
          { role: 'user', content: JSON.stringify(evidence) },
        ],
      });
      let brief: OutreachBrief;
      try {
        brief = parseOutreach(JSON.parse(result.content), evidence);
      } catch {
        return Response.json(
          {
            error:
              'The AI brief failed source validation. Nothing was saved or sent.',
          },
          { status: 502 },
        );
      }
      await db.execute(
        sql`INSERT INTO prospect_outreach(id,owner_id,lead_id,brief,model) VALUES(${crypto.randomUUID()},${user.userId},${leadId},${JSON.stringify(brief)}::jsonb,${result.model}) ON CONFLICT(owner_id,lead_id) DO NOTHING`,
      );
    } else if (body.action === 'save') {
      if (!record)
        return Response.json(
          { error: 'Prepare the brief first.' },
          { status: 409 },
        );
      if (record.outbox_id)
        return Response.json({
          record,
          sendingConfigured: emailConfig().configured,
          opportunityId,
        });
      const subject =
        typeof body.subject === 'string' ? body.subject.trim() : '';
      const content =
        typeof body.content === 'string' ? body.content.trim() : '';
      const note =
        typeof body.relationshipNote === 'string'
          ? body.relationshipNote.trim()
          : '';
      if (
        body.reviewed !== true ||
        !subject ||
        subject.length > 180 ||
        /[\r\n]/.test(subject) ||
        !content ||
        content.length > 4000 ||
        !note ||
        note.length > 1000
      )
        return Response.json(
          {
            error:
              'Review the evidence, recipient, subject, message and reason for contact.',
          },
          { status: 400 },
        );
      const brief = record.brief as OutreachBrief;
      const currentEvidence = outreachEvidence(lead.data as Prospect);
      if (
        !currentEvidence.contacts.some(
          (c) =>
            c.kind === 'email' && c.value.toLowerCase() === brief.recipient,
        )
      )
        return Response.json(
          { error: 'Contact evidence changed. Review this prospect again.' },
          { status: 409 },
        );
      const outboxId = crypto.randomUUID();
      const provenance = `${note}\nProspect: ${brief.company}\nPossible issue (not confirmed): ${brief.hypothesis}\nSources: ${brief.observations.map((o) => o.source).join(', ')}`;
      // Lock one brief and insert/link in a single statement. Repeated clicks
      // cannot create multiple drafts or send anything.
      await db.execute(
        sql`WITH eligible AS (SELECT id FROM prospect_outreach WHERE id=${record.id} AND owner_id=${user.userId} AND outbox_id IS NULL AND NOT EXISTS(SELECT 1 FROM email_suppressions WHERE email=${brief.recipient}) FOR UPDATE), saved AS (INSERT INTO agency_email_outbox(id,owner_id,recipient,recipient_name,subject,body,purpose,relationship_note,batch_id) SELECT ${outboxId},${user.userId},${brief.recipient},${brief.company},${subject},${content},'outreach',${provenance},${outboxId} FROM eligible RETURNING id) UPDATE prospect_outreach SET outbox_id=saved.id,updated_at=now() FROM saved WHERE prospect_outreach.id=${record.id} AND prospect_outreach.owner_id=${user.userId}`,
      );
      record = await read();
      if (!record?.outbox_id)
        return Response.json(
          {
            error:
              'The draft was not saved. Check whether the contact is suppressed.',
          },
          { status: 409 },
        );
    } else if (body.action === 'response') {
      if (
        !record?.outbox_id ||
        !['sent', 'uncertain'].includes(String(record.email_status))
      )
        return Response.json(
          { error: 'Record an email response only after a send attempt.' },
          { status: 409 },
        );
      const status = typeof body.status === 'string' ? body.status : '';
      const note =
        typeof body.note === 'string' ? body.note.trim().slice(0, 2000) : '';
      const next =
        typeof body.nextAction === 'string'
          ? body.nextAction.trim().slice(0, 500)
          : '';
      const date =
        typeof body.followupDate === 'string' ? body.followupDate : '';
      if (
        !['interested', 'not_now', 'not_interested', 'do_not_contact'].includes(
          status,
        ) ||
        !note ||
        (['interested', 'not_now'].includes(status) && !next) ||
        (date &&
          (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
            !Number.isFinite(Date.parse(date))))
      )
        return Response.json(
          {
            error:
              'Record the actual response and a next action. Use a valid follow-up date.',
          },
          { status: 400 },
        );
      const recipient = (record.brief as OutreachBrief).recipient;
      const nextAction = status === 'do_not_contact' ? 'Do not contact' : next;
      const followUp = status === 'do_not_contact' ? null : date || null;
      await db.execute(
        sql`WITH stopped AS (INSERT INTO email_suppressions(email,added_by) SELECT ${recipient},${user.userId} WHERE ${status}='do_not_contact' ON CONFLICT(email) DO NOTHING) UPDATE prospect_outreach SET response_status=${status},response_note=${note},next_action=${nextAction},followup_date=${followUp}::date,updated_at=now() WHERE id=${record.id} AND owner_id=${user.userId}`,
      );
      // The reply is where outreach stops and sales starts. Follow-ups are
      // worked from Enquiries and Today, so a reply recorded only here was a
      // date nobody would see. An interested reply to a shortlisted prospect is
      // the point it becomes an enquiry; a person recorded it, so this is their
      // decision, carried out with the same query as "Move to Enquiries".
      if (
        !opportunityId &&
        status === 'interested' &&
        String(lead.status) === 'shortlisted'
      ) {
        const promoted = await db.execute(
          promoteProspectQuery(leadId, user.userId),
        );
        const created = promoted.rows[0]?.entity_id;
        opportunityId = typeof created === 'string' ? created : '';
      }
      if (opportunityId)
        await db.execute(
          sql`UPDATE opportunities SET next_action=${nextAction},follow_up_at=${followUp}::date,updated_at=now() WHERE id=${opportunityId} AND owner_id=${user.userId}`,
        );
    } else
      return Response.json({ error: 'Unsupported action.' }, { status: 400 });
    return Response.json({
      record: await read(),
      sendingConfigured: emailConfig().configured,
      opportunityId,
    });
  } catch {
    return Response.json(
      {
        error:
          'Outreach could not complete. Check AI activity and that the outreach migration is installed. No email was sent by this action.',
      },
      { status: 503 },
    );
  }
}
export const GET = withRequestLog('/api/admin/prospects/outreach', handle);
export const POST = withRequestLog('/api/admin/prospects/outreach', handle);
