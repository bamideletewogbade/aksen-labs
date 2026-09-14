import { sql } from 'drizzle-orm';
import {
  check,
  unique,
  type AnyPgColumn,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

const createdAt = timestamp('created_at', { withTimezone: true })
  .notNull()
  .defaultNow();
const updatedAt = timestamp('updated_at', { withTimezone: true })
  .notNull()
  .defaultNow();

export const organizations = pgTable('organizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt,
  updatedAt,
});
export const opportunities = pgTable(
  'opportunities',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id'),
    createdAt,
    updatedAt,
    name: text('name').notNull(),
    email: text('email').notNull(),
    company: text('company').notNull(),
    website: text('website'),
    industry: text('industry'),
    work: text('work').notNull(),
    channel: text('channel').notNull(),
    desiredOutcome: text('desired_outcome').notNull(),
    recommendation: text('recommendation').notNull(),
    summary: text('summary'),
    status: text('status').notNull().default('new'),
    score: integer('score').notNull().default(50),
    source: text('source').notNull().default('website_mapper'),
    consentStatus: text('consent_status').notNull().default('provided'),
    nextAction: text('next_action').notNull().default('Review opportunity'),
    followUpAt: date('follow_up_at'),
    ownerId: text('owner_id'),
  },
  (table) => [
    index('idx_opportunities_status_created').on(table.status, table.createdAt),
    index('idx_opportunities_email').on(table.email),
  ],
);
export const projects = pgTable(
  'projects',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id'),
    opportunityId: text('opportunity_id'),
    createdAt,
    updatedAt,
    name: text('name').notNull(),
    clientName: text('client_name').notNull(),
    stage: text('stage').notNull().default('discovery'),
    health: text('health').notNull().default('on_track'),
    ownerId: text('owner_id'),
    objective: text('objective').notNull(),
    nextGate: text('next_gate').notNull(),
    startDate: timestamp('start_date', { withTimezone: true }),
    targetDate: timestamp('target_date', { withTimezone: true }),
    progress: integer('progress').notNull().default(0),
    budgetCents: integer('budget_cents'),
  },
  (table) => [index('idx_projects_stage_health').on(table.stage, table.health)],
);
export const projectItems = pgTable(
  'project_items',
  {
    id: text('id').primaryKey(),
    projectId: text('project_id').notNull(),
    createdAt,
    updatedAt,
    kind: text('kind').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    status: text('status').notNull().default('open'),
    ownerId: text('owner_id'),
    dueAt: timestamp('due_at', { withTimezone: true }),
    evidence: text('evidence'),
  },
  (table) => [
    index('idx_project_items_project_status').on(table.projectId, table.status),
  ],
);
export const blogPosts = pgTable(
  'blog_posts',
  {
    id: text('id').primaryKey(),
    createdAt,
    updatedAt,
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    excerpt: text('excerpt').notNull(),
    content: text('content').notNull(),
    category: text('category').notNull(),
    status: text('status').notNull().default('draft'),
    authorName: text('author_name').notNull(),
    authorId: text('author_id'),
    featuredImage: text('featured_image'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    readingMinutes: integer('reading_minutes').notNull().default(4),
  },
  (table) => [
    index('idx_blog_posts_status_published').on(
      table.status,
      table.publishedAt,
    ),
  ],
);
export const conversations = pgTable('conversations', {
  id: text('id').primaryKey(),
  opportunityId: text('opportunity_id'),
  createdAt,
  updatedAt,
  channel: text('channel').notNull().default('web'),
  status: text('status').notNull().default('open'),
  summary: text('summary'),
  urgency: text('urgency').notNull().default('normal'),
  handoffReason: text('handoff_reason'),
});
// What was said to a lead and when. The pipeline's next_action holds one line
// that each edit overwrites, so before this there was no record of the exchange
// itself: which channel, which direction, and what was sent.
export const leadInteractions = pgTable(
  'lead_interactions',
  {
    id: text('id').primaryKey(),
    opportunityId: text('opportunity_id').notNull(),
    ownerId: text('owner_id'),
    createdAt,
    occurredAt: date('occurred_at').notNull(),
    channel: text('channel').notNull().default('other'),
    direction: text('direction').notNull().default('outbound'),
    summary: text('summary').notNull(),
    shared: text('shared'),
  },
  (table) => [
    index('idx_lead_interactions_opportunity').on(
      table.opportunityId,
      table.occurredAt,
    ),
  ],
);
export const agentRuns = pgTable(
  'agent_runs',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id'),
    createdAt,
    agentName: text('agent_name').notNull(),
    agentVersion: text('agent_version').notNull().default('v1'),
    channel: text('channel').notNull(),
    status: text('status').notNull(),
    outcome: text('outcome'),
    durationMs: integer('duration_ms'),
    costMicros: integer('cost_micros'),
    requiresApproval: boolean('requires_approval').notNull().default(false),
    trace: jsonb('trace'),
  },
  (table) => [
    index('idx_agent_runs_name_created').on(table.agentName, table.createdAt),
  ],
);
export const approvals = pgTable(
  'approvals',
  {
    id: text('id').primaryKey(),
    runId: text('run_id'),
    projectId: text('project_id'),
    createdAt,
    requestedBy: text('requested_by'),
    action: text('action').notNull(),
    context: text('context'),
    risk: text('risk').notNull().default('medium'),
    status: text('status').notNull().default('pending'),
    decidedBy: text('decided_by'),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
    entityType: text('entity_type'),
    entityId: text('entity_id'),
  },
  (table) => [
    index('idx_approvals_status_created').on(table.status, table.createdAt),
  ],
);
export const mediaAssets = pgTable(
  'media_assets',
  {
    id: text('id').primaryKey(),
    createdAt,
    createdBy: text('created_by'),
    kind: text('kind').notNull(),
    prompt: text('prompt').notNull(),
    model: text('model').notNull(),
    aspectRatio: text('aspect_ratio'),
    url: text('url').notNull(),
    referenceCount: integer('reference_count').notNull().default(0),
  },
  (table) => [index('idx_media_assets_created').on(table.createdAt)],
);
export const auditEvents = pgTable(
  'audit_events',
  {
    id: text('id').primaryKey(),
    createdAt,
    actorId: text('actor_id'),
    actorType: text('actor_type').notNull().default('system'),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    details: jsonb('details'),
  },
  (table) => [
    index('idx_audit_events_entity').on(
      table.entityType,
      table.entityId,
      table.createdAt,
    ),
  ],
);

export const businessWorkspaces = pgTable(
  'business_workspaces',
  {
    id: text('id').primaryKey(),
    ownerId: text('owner_id').notNull(),
    name: text('name').notNull(),
    stage: text('stage').notNull().default('prospect'),
    currency: text('currency').notNull().default('NGN'),
    context: text('context').notNull().default(''),
    createdAt,
  },
  (table) => [
    index('business_workspaces_owner').on(table.ownerId, table.createdAt),
  ],
);
export const businessDocuments = pgTable(
  'business_documents',
  {
    id: text('id').primaryKey(),
    businessId: text('business_id')
      .notNull()
      .references(() => businessWorkspaces.id),
    projectId: text('project_id').references(() => projects.id),
    title: text('title').notNull(),
    kind: text('kind').notNull(),
    content: text('content').notNull().default(''),
    evidenceStatus: text('evidence_status').notNull().default('unverified'),
    filename: text('filename'),
    fileBase64: text('file_base64'),
    mimeType: text('mime_type'),
    sourceIds: jsonb('source_ids').notNull().default([]),
    createdAt,
  },
  (table) => [
    index('business_documents_business').on(table.businessId, table.createdAt),
  ],
);
export const businessFinancials = pgTable(
  'business_financials',
  {
    id: text('id').primaryKey(),
    businessId: text('business_id')
      .notNull()
      .references(() => businessWorkspaces.id),
    projectId: text('project_id').references(() => projects.id),
    kind: text('kind').notNull(),
    number: text('number').notNull().unique(),
    status: text('status').notNull().default('draft'),
    currency: text('currency').notNull(),
    totalMinor: integer('total_minor').notNull(),
    paidMinor: integer('paid_minor').notNull().default(0),
    details: jsonb('details').notNull(),
    invoiceId: text('invoice_id').references(
      (): AnyPgColumn => businessFinancials.id,
    ),
    paymentReference: text('payment_reference'),
    issuedAt: timestamp('issued_at', { withTimezone: true }),
    createdAt,
  },
  (table) => [
    index('business_financials_business').on(table.businessId, table.createdAt),
    unique('business_financials_invoice_id_payment_reference_key').on(
      table.invoiceId,
      table.paymentReference,
    ),
    check(
      'business_financials_kind_check',
      sql`${table.kind} IN ('proforma','invoice','receipt')`,
    ),
    check(
      'business_financials_status_check',
      sql`${table.status} IN ('draft','issued','paid','void')`,
    ),
    check(
      'business_financials_currency_check',
      sql`${table.currency} IN ('NGN','GHS','USD','GBP','EUR')`,
    ),
    check(
      'business_financials_total_minor_check',
      sql`${table.totalMinor} > 0`,
    ),
    check(
      'business_financials_paid_minor_check',
      sql`${table.paidMinor} >= 0 AND ${table.paidMinor} <= ${table.totalMinor}`,
    ),
  ],
);
export const workspaceDemoUsage = pgTable(
  'workspace_demo_usage',
  {
    bucket: text('bucket').primaryKey(),
    requests: integer('requests').notNull(),
  },
  (table) => [
    check('workspace_demo_usage_requests_check', sql`${table.requests} > 0`),
  ],
);

// Folio accounts. The first end-user sign-in on the platform, separate from admin_sessions:
// these are members of the public, authenticated by emailed magic link, never by password.
export const folioUsers = pgTable('folio_users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  createdAt,
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const folioLoginTokens = pgTable(
  'folio_login_tokens',
  {
    tokenHash: text('token_hash').primaryKey(),
    email: text('email').notNull(),
    createdAt,
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_folio_login_tokens_email').on(table.email, table.createdAt),
    index('idx_folio_login_tokens_expiry').on(table.expiresAt),
  ],
);
export const folioSessions = pgTable(
  'folio_sessions',
  {
    tokenHash: text('token_hash').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => folioUsers.id),
    createdAt,
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => [index('idx_folio_sessions_expiry').on(table.expiresAt)],
);
export const folioCvs = pgTable(
  'folio_cvs',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => folioUsers.id),
    label: text('label').notNull(),
    data: jsonb('data').notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [index('idx_folio_cvs_user').on(table.userId, table.updatedAt)],
);
