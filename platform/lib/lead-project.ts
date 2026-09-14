import { sql } from 'drizzle-orm';
export function leadProjectQuery(leadId: string, ownerId: string) {
  const id = `lead-${leadId}`;
  return sql`WITH created AS (
 INSERT INTO projects(id,opportunity_id,name,client_name,objective,next_gate,owner_id)
 SELECT ${id},id,left(company || ' — implementation',160),company,left(work,500),'Confirm signed scope, kickoff owner and initial payment requirements',${ownerId}
 FROM opportunities WHERE id=${leadId} AND status='won'
 ON CONFLICT(id) DO NOTHING RETURNING id
 ), logged AS (
 INSERT INTO audit_events(id,actor_id,actor_type,action,entity_type,entity_id)
 SELECT ${crypto.randomUUID()},${ownerId},'user','project.created_from_enquiry','project',id FROM created
 ) SELECT id FROM created UNION ALL SELECT id FROM projects WHERE id=${id} AND owner_id=${ownerId} AND NOT EXISTS(SELECT 1 FROM created)`;
}
