import { sql } from 'drizzle-orm';
import {
  check,
  unique,
  type AnyPgColumn,
  boolean,
  date,
  index,
  uniqueIndex,
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
    /**
     * Makes capturing a lead safe to retry. A visitor whose connection drops
     * after the insert but before the response presses the button again, and
     * without this that is a second lead, a second notification, and a founder
     * who cannot tell which one is real. Null on rows captured before it existed.
     */
    intakeKey: text('intake_key'),
  },
  (table) => [
    index('idx_opportunities_status_created').on(table.status, table.createdAt),
    index('idx_opportunities_email').on(table.email),
    index('idx_opportunities_source_created').on(table.source, table.createdAt),
  ],
);

/**
 * Everything this business sends, queued rather than fired.
 *
 * A send used to happen inside the request that captured the lead: the visitor
 * waited for the provider, and a provider outage lost the notice with an audit
 * row as its only trace. One outage meant one silently unanswered customer,
 * which is the failure the whole enquiry loop exists to prevent.
 *
 * Rows are never deleted. A message that was never delivered is a business
 * fact, and the day somebody asks "did we ever reply to them" the answer has to
 * be in one place.
 */
export const messageOutbox = pgTable(
  'message_outbox',
  {
    id: text('id').primaryKey(),
    createdAt,
    updatedAt,
    /**
     * email today. WhatsApp and SMS become rows with a different channel, not a
     * second delivery path with its own retry rules to get wrong.
     */
    channel: text('channel').notNull().default('email'),
    /** Caller-supplied and stable, so the same event enqueued twice is one message. */
    dedupeKey: text('dedupe_key').notNull().unique(),
    recipient: text('recipient').notNull(),
    subject: text('subject').notNull(),
    body: text('body').notNull(),
    /** queued, sending, sent, abandoned. */
    status: text('status').notNull().default('queued'),
    attempts: integer('attempts').notNull().default(0),
    nextAttemptAt: timestamp('next_attempt_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastError: text('last_error'),
    providerReceipt: text('provider_receipt'),
    entityType: text('entity_type'),
    entityId: text('entity_id'),
    ownerId: text('owner_id'),
    sentAt: timestamp('sent_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_outbox_due').on(table.status, table.nextAttemptAt),
    index('idx_outbox_entity').on(table.entityType, table.entityId),
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
export const editorialSettings = pgTable('editorial_settings', {
  ownerId: text('owner_id').primaryKey(),
  enabled: boolean('enabled').notNull().default(false),
  cadence: text('cadence').notNull().default('manual'),
  runHour: integer('run_hour').notNull().default(8),
  autoDraft: boolean('auto_draft').notNull().default(false),
  lastScheduledAt: timestamp('last_scheduled_at', { withTimezone: true }),
  runningUntil: timestamp('running_until', { withTimezone: true }),
  updatedAt,
});
export const editorialRuns = pgTable(
  'editorial_runs',
  {
    id: text('id').primaryKey(),
    ownerId: text('owner_id').notNull(),
    createdAt,
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    status: text('status').notNull().default('running'),
    scheduled: boolean('scheduled').notNull().default(false),
    found: integer('found').notNull().default(0),
    model: text('model'),
    costMicros: integer('cost_micros'),
    note: text('note'),
  },
  (table) => [
    index('idx_editorial_runs_owner_created').on(
      table.ownerId,
      table.createdAt,
    ),
  ],
);
export const editorialIdeas = pgTable(
  'editorial_ideas',
  {
    id: text('id').primaryKey(),
    ownerId: text('owner_id').notNull(),
    createdAt,
    updatedAt,
    fingerprint: text('fingerprint').notNull(),
    title: text('title').notNull(),
    angle: text('angle').notNull(),
    whyNow: text('why_now').notNull(),
    category: text('category').notNull(),
    score: integer('score').notNull().default(0),
    sources: jsonb('sources').notNull().default([]),
    status: text('status').notNull().default('inbox'),
    postId: text('post_id'),
  },
  (table) => [
    unique('editorial_ideas_owner_fingerprint').on(
      table.ownerId,
      table.fingerprint,
    ),
    index('idx_editorial_ideas_owner_status_score').on(
      table.ownerId,
      table.status,
      table.score,
      table.createdAt,
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
export const mediaEpisodes = pgTable(
  'media_episodes',
  {
    id: text('id').primaryKey(),
    ownerId: text('owner_id').notNull(),
    title: text('title').notNull(),
    topic: text('topic').notNull().default(''),
    script: text('script').notNull().default(''),
    scenes: jsonb('scenes').notNull().default([]),
    sources: jsonb('sources').notNull().default([]),
    channelPosts: jsonb('channel_posts').notNull().default({}),
    proofChecks: jsonb('proof_checks').notNull().default([]),
    originEvaluationId: text('origin_evaluation_id'),
    status: text('status').notNull().default('draft'),
    aspectRatio: text('aspect_ratio').notNull().default('9:16'),
    createdAt,
    updatedAt,
  },
  (table) => [index('idx_media_episodes_owner_updated').on(table.ownerId, table.updatedAt)],
);
export const mediaJevEvaluations = pgTable(
  'media_jev_evaluations',
  {
    id: text('id').primaryKey(),
    ownerId: text('owner_id').notNull(),
    referenceUrl: text('reference_url').notNull(),
    state: jsonb('state').notNull(),
    status: text('status').notNull(),
    provider: text('provider').notNull().default('none'),
    model: text('model'),
    promptVersion: text('prompt_version').notNull(),
    answers: jsonb('answers').notNull().default({}),
    suggestion: text('suggestion'),
    selectedAngle: text('selected_angle'),
    inputTokens: integer('input_tokens'),
    outputTokens: integer('output_tokens'),
    latencyMs: integer('latency_ms'),
    costMicros: integer('cost_micros'),
    outcome: jsonb('outcome').notNull().default({}),
    createdAt,
    updatedAt,
  },
  (table) => [index('idx_media_jev_owner_created').on(table.ownerId, table.createdAt)],
);
export const mediaRenderJobs = pgTable(
  'media_render_jobs',
  {
    id: text('id').primaryKey(),
    ownerId: text('owner_id').notNull(),
    providerJobId: text('provider_job_id').notNull(),
    model: text('model').notNull(),
    prompt: text('prompt').notNull(),
    status: text('status').notNull().default('pending'),
    pollingUrl: text('polling_url').notNull(),
    outputUrl: text('output_url'),
    error: text('error'),
    costMicros: integer('cost_micros'),
    createdAt,
    updatedAt,
  },
  (table) => [
    index('idx_media_render_jobs_owner_created').on(table.ownerId, table.createdAt),
    uniqueIndex('idx_media_render_jobs_owner_provider').on(table.ownerId, table.providerJobId),
  ],
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
// People waiting on a product that has no public address yet. Until this, the
// only thing the products page could offer someone who wanted CV Forge was the
// B2B enquiry form, which asks a jobseeker what business problem they want
// solved. One row per person per product: signing up twice updates what they
// wrote rather than adding a second row to read.
export const productWaitlist = pgTable(
  'product_waitlist',
  {
    id: text('id').primaryKey(),
    createdAt,
    updatedAt,
    productSlug: text('product_slug').notNull(),
    email: text('email').notNull(),
    // Optional, and the reason a row is worth more than a count: it says what
    // the person expected the product to do before they had ever used it.
    hopedFor: text('hoped_for'),
    source: text('source').notNull().default('products_page'),
  },
  (table) => [
    unique('product_waitlist_product_email').on(table.productSlug, table.email),
    index('idx_product_waitlist_created').on(
      table.productSlug,
      table.createdAt,
    ),
  ],
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

/**
 * The public feedback board.
 *
 * Two decisions worth stating, because both are arguable.
 *
 * Nothing appears publicly until a person publishes it. A board is a page on the
 * marketing site that strangers write, and there is no moderation rota here; the
 * form says a submission is read first, usually within a day. It also gives the
 * triage agent somewhere to work before anyone sees the result.
 *
 * `voteCount` is stored rather than counted. Sorting a public list by a COUNT
 * over the votes table on every request is the kind of thing that is fine until
 * the board works, and the votes table stays the record of who voted.
 */
export const feedbackIdeas = pgTable(
  'feedback_ideas',
  {
    id: text('id').primaryKey(),
    createdAt,
    updatedAt,
    title: text('title').notNull(),
    body: text('body'),
    /** Optional. The only way to tell someone the thing they asked for shipped. */
    authorEmail: text('author_email'),
    /** open | planned | building | shipped | declined */
    status: text('status').notNull().default('open'),
    /** Why it was declined, or what shipped. A status with no reason is a shrug. */
    statusNote: text('status_note'),
    voteCount: integer('vote_count').notNull().default(0),
    published: boolean('published').notNull().default(false),
    /** Visitor hash of whoever submitted it, for tracing a flood to its source. */
    submitterKey: text('submitter_key').notNull(),
    /** Set when triage finds this is a restatement of an idea already on the
     *  board. The duplicate stays as a row so its votes can be moved. */
    mergedInto: text('merged_into').references(
      (): AnyPgColumn => feedbackIdeas.id,
    ),
    /** What the triage agent made of it. Never shown publicly, and never acted
     *  on without the approval row it raises alongside. */
    triageSummary: text('triage_summary'),
    triageSize: text('triage_size'),
    triagedAt: timestamp('triaged_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_feedback_ideas_board').on(
      table.published,
      table.status,
      table.voteCount,
    ),
    index('idx_feedback_ideas_triage').on(table.triagedAt, table.createdAt),
  ],
);

// One vote per visitor per idea. The key is the same hashed address the rate
// limiter uses, so a vote is as identifiable as a request and no more: people
// behind one office connection share it. The board says so rather than
// presenting the number as a headcount.
export const feedbackVotes = pgTable(
  'feedback_votes',
  {
    ideaId: text('idea_id')
      .notNull()
      .references(() => feedbackIdeas.id),
    voterKey: text('voter_key').notNull(),
    createdAt,
  },
  (table) => [
    unique('feedback_votes_idea_voter').on(table.ideaId, table.voterKey),
    index('idx_feedback_votes_idea').on(table.ideaId),
  ],
);

// What actually shipped. Kept apart from blog_posts, which is article-shaped:
// an entry here is short, dated, typed, and points back at the request that
// asked for it, which is the whole reason a changelog is worth publishing.
export const changelogEntries = pgTable(
  'changelog_entries',
  {
    id: text('id').primaryKey(),
    createdAt,
    updatedAt,
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    releasedOn: date('released_on').notNull(),
    /** new | improvement | fix */
    kind: text('kind').notNull().default('improvement'),
    published: boolean('published').notNull().default(false),
    /** The request this answers, when there was one. */
    ideaId: text('idea_id').references(() => feedbackIdeas.id),
  },
  (table) => [
    index('idx_changelog_published').on(table.published, table.releasedOn),
  ],
);

/**
 * Whether the triage agent runs, and how much of it is allowed per day.
 *
 * One row, id 'default'. Every other automation in here is keyed by owner
 * because a campaign belongs to somebody; there is one feedback board for the
 * company, and pretending otherwise would mean deciding whose triage settings
 * win the first time two people have them.
 *
 * On by default, with a switch. That is the pattern worth copying: the helpful
 * behaviour is the behaviour you get, and turning it off is one click rather
 * than a thing you have to discover you need to turn on.
 *
 * The ceiling counts ideas reviewed rather than runs started, because what it is
 * protecting is model spend, and one run over a flood of submissions costs the
 * same as forty runs over one each.
 */
export const feedbackTriageSettings = pgTable('feedback_triage_settings', {
  id: text('id').primaryKey(),
  enabled: boolean('enabled').notNull().default(true),
  maxPerDay: integer('max_per_day').notNull().default(40),
  lastRunAt: timestamp('last_run_at', { withTimezone: true }),
  /** What the last run did, in a sentence, for the admin to read back. */
  lastNote: text('last_note'),
  /** Held by a run in flight, so two heartbeats cannot overlap. */
  runningUntil: timestamp('running_until', { withTimezone: true }),
  updatedAt,
});
