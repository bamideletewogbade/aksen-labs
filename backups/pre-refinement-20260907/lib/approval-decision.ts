import { sql } from 'drizzle-orm';

/** One statement: a failed publication or audit write leaves the approval pending. */
export function approvalDecisionQuery(id: string, decision: 'approved' | 'rejected', actorId: string) {
  return sql`
    WITH pending AS (
      SELECT id, entity_type, entity_id FROM approvals
      WHERE id = ${id} AND status = 'pending' FOR UPDATE
    ), published AS (
      UPDATE blog_posts AS post
      SET status = 'published', published_at = now(), updated_at = now()
      FROM pending
      WHERE ${decision} = 'approved' AND pending.entity_type = 'blog_post'
        AND post.id = pending.entity_id AND post.status = 'draft'
      RETURNING post.id
    ), decided AS (
      UPDATE approvals AS approval
      SET status = ${decision}, decided_by = ${actorId}, decided_at = now()
      FROM pending
      WHERE approval.id = pending.id AND (
        ${decision} = 'rejected' OR pending.entity_type IS DISTINCT FROM 'blog_post'
        OR EXISTS (SELECT 1 FROM published)
      )
      RETURNING approval.id, approval.status, approval.entity_type, approval.entity_id
    ), decision_audit AS (
      INSERT INTO audit_events (id, actor_id, actor_type, action, entity_type, entity_id)
      SELECT ${crypto.randomUUID()}, ${actorId}, 'user', ${`approval.${decision}`}, 'approval', id FROM decided
    ), publication_audit AS (
      INSERT INTO audit_events (id, actor_id, actor_type, action, entity_type, entity_id, details)
      SELECT ${crypto.randomUUID()}, ${actorId}, 'user', 'post.published', 'blog_post', id,
        jsonb_build_object('viaApproval', ${id}::text) FROM published
    )
    SELECT id, status, CASE WHEN entity_type = 'blog_post' AND status = 'approved'
      THEN 'published' ELSE NULL END AS "carriedOut" FROM decided
  `;
}
