import { sql } from 'drizzle-orm';

export function paymentQuery({ id, businessId, financialId, amount, reference, date, number, actorId, auditId }: { id: string; businessId: string; financialId: string; amount: number; reference: string; date: string; number: string; actorId: string; auditId: string }) {
  return sql`WITH changed AS (
        UPDATE business_financials SET paid_minor=paid_minor+${amount},status=CASE WHEN paid_minor+${amount}=total_minor THEN 'paid' ELSE 'issued' END
        WHERE id=${financialId} AND business_id=${businessId} AND kind='invoice' AND status='issued' AND paid_minor+${amount}<=total_minor RETURNING *
      ), receipt AS (
        INSERT INTO business_financials(id,business_id,project_id,kind,number,status,currency,total_minor,details,invoice_id,payment_reference,issued_at)
        SELECT ${id},business_id,project_id,'receipt',${number},'issued',currency,${amount},details || jsonb_build_object('paymentDate',${date}::text,'invoiceNumber',number,'recordedBy',${actorId}::text),id,${reference},now() FROM changed RETURNING id
      ), logged AS (INSERT INTO audit_events(id,actor_id,actor_type,action,entity_type,entity_id) SELECT ${auditId},${actorId},'user','payment.recorded','receipt',id FROM receipt) SELECT id FROM receipt`;
}
