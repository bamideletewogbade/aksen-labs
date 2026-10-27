import { sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { companyName } from '@/lib/company-name';
import {
  dateOnly,
  type DailyLead,
  type DailyProject,
  type OpenInvoice,
} from '@/lib/daily-work';

export type MoneyTotal = {
  currency: string;
  collected: number;
  outstanding: number;
  invoiceCount: number;
};

// Only issued receipts count. Drafts and void records cannot increase the
// amount the workspace says was collected. Currencies are never combined.
export async function moneyOverview(owner: string) {
  const db = getDb();
  const [totals, invoices] = await Promise.all([
    db.execute(sql`
      SELECT f.currency,
        coalesce(sum(f.total_minor) FILTER (WHERE f.kind='receipt' AND f.status='issued'),0)::bigint AS collected,
        coalesce(sum(f.total_minor-f.paid_minor) FILTER (WHERE f.kind='invoice' AND f.status='issued' AND f.total_minor>f.paid_minor),0)::bigint AS outstanding,
        count(*) FILTER (WHERE f.kind='invoice' AND f.status='issued' AND f.total_minor>f.paid_minor)::int AS invoice_count
      FROM business_financials f JOIN business_workspaces b ON b.id=f.business_id
      WHERE b.owner_id=${owner} AND f.status IN ('issued','paid')
      GROUP BY f.currency ORDER BY f.currency`),
    db.execute(sql`
      SELECT f.id,f.business_id,b.name AS client,f.number,f.currency,
        f.total_minor-f.paid_minor AS balance,f.details->>'dueDate' AS due_date,
        count(*) OVER()::int AS full_count
      FROM business_financials f JOIN business_workspaces b ON b.id=f.business_id
      WHERE b.owner_id=${owner} AND f.kind='invoice' AND f.status='issued' AND f.total_minor>f.paid_minor
      ORDER BY nullif(f.details->>'dueDate','') ASC NULLS LAST, f.created_at ASC, f.id LIMIT 100`),
  ]);
  return {
    totals: totals.rows.map(
      (r): MoneyTotal => ({
        currency: String(r.currency),
        collected: Number(r.collected),
        outstanding: Number(r.outstanding),
        invoiceCount: Number(r.invoice_count),
      }),
    ),
    invoices: invoices.rows.map(
      (r): OpenInvoice => ({
        id: String(r.id),
        businessId: String(r.business_id),
        client: String(r.client),
        number: String(r.number),
        currency: String(r.currency),
        balance: Number(r.balance),
        dueDate: dateOnly(r.due_date),
      }),
    ),
    invoiceCount: Number(invoices.rows[0]?.full_count ?? 0),
  };
}
export async function dailyWork(owner: string, today: string) {
  const db = getDb();
  const [leads, projects, money] = await Promise.all([
    db.execute(sql`
      SELECT id,company,name,status,next_action,follow_up_at::text,
        count(*) OVER()::int AS full_count,
        count(*) FILTER (WHERE follow_up_at <= ${today}::date) OVER()::int AS due_count
      FROM opportunities
      WHERE (owner_id=${owner} OR owner_id IS NULL) AND status IN ('new','qualified','proposal')
      ORDER BY follow_up_at ASC NULLS LAST, created_at ASC, id LIMIT 500`),
    db.execute(sql`
      SELECT p.id,p.name,p.stage,p.health,p.progress,p.next_gate,
        count(*) FILTER (WHERE i.status='blocked')::int AS blocked,
        to_char(min(i.due_at) FILTER (WHERE i.status IN ('open','blocked')), 'YYYY-MM-DD') AS due_at,
        count(*) OVER()::int AS full_count
      FROM projects p LEFT JOIN project_items i ON i.project_id=p.id
      WHERE p.owner_id=${owner} AND p.stage IN ('discovery','delivery','accepted')
      GROUP BY p.id,p.name,p.stage,p.health,p.progress,p.next_gate,p.updated_at
      ORDER BY CASE p.health WHEN 'at_risk' THEN 0 ELSE 1 END,
        min(i.due_at) FILTER (WHERE i.status IN ('open','blocked')) ASC NULLS LAST, p.updated_at ASC,p.id LIMIT 500`),
    moneyOverview(owner),
  ]);
  return {
    leads: leads.rows.map(
      (r): DailyLead => ({
        id: String(r.id),
        name: companyName(String(r.company)) || String(r.name),
        status: String(r.status),
        nextAction: typeof r.next_action === 'string' ? r.next_action : '',
        followUpAt: dateOnly(r.follow_up_at),
      }),
    ),
    projects: projects.rows.map(
      (r): DailyProject => ({
        id: String(r.id),
        name: String(r.name),
        stage: String(r.stage),
        health: String(r.health),
        progress: Number(r.progress),
        nextGate: typeof r.next_gate === 'string' ? r.next_gate : '',
        blocked: Number(r.blocked),
        dueAt: dateOnly(r.due_at),
      }),
    ),
    leadCount: Number(leads.rows[0]?.full_count ?? 0),
    followUpCount: Number(leads.rows[0]?.due_count ?? 0),
    projectCount: Number(projects.rows[0]?.full_count ?? 0),
    money,
  };
}
