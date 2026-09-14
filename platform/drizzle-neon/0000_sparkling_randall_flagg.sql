CREATE TABLE "agent_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"agent_name" text NOT NULL,
	"agent_version" text DEFAULT 'v1' NOT NULL,
	"channel" text NOT NULL,
	"status" text NOT NULL,
	"outcome" text,
	"duration_ms" integer,
	"cost_micros" integer,
	"requires_approval" boolean DEFAULT false NOT NULL,
	"trace" jsonb
);
--> statement-breakpoint
CREATE TABLE "approvals" (
	"id" text PRIMARY KEY NOT NULL,
	"run_id" text,
	"project_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"requested_by" text,
	"action" text NOT NULL,
	"context" text,
	"risk" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"decided_by" text,
	"decided_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_id" text,
	"actor_type" text DEFAULT 'system' NOT NULL,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"details" jsonb
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"excerpt" text NOT NULL,
	"content" text NOT NULL,
	"category" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"author_name" text NOT NULL,
	"author_id" text,
	"featured_image" text,
	"published_at" timestamp with time zone,
	"reading_minutes" integer DEFAULT 4 NOT NULL,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" text PRIMARY KEY NOT NULL,
	"opportunity_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"channel" text DEFAULT 'web' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"summary" text,
	"urgency" text DEFAULT 'normal' NOT NULL,
	"handoff_reason" text
);
--> statement-breakpoint
CREATE TABLE "opportunities" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"company" text NOT NULL,
	"website" text,
	"industry" text,
	"work" text NOT NULL,
	"channel" text NOT NULL,
	"desired_outcome" text NOT NULL,
	"recommendation" text NOT NULL,
	"summary" text,
	"status" text DEFAULT 'new' NOT NULL,
	"score" integer DEFAULT 50 NOT NULL,
	"source" text DEFAULT 'website_mapper' NOT NULL,
	"consent_status" text DEFAULT 'provided' NOT NULL,
	"next_action" text DEFAULT 'Review opportunity' NOT NULL,
	"owner_id" text
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "project_items" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'open' NOT NULL,
	"owner_id" text,
	"due_at" timestamp with time zone,
	"evidence" text
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text,
	"opportunity_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"name" text NOT NULL,
	"client_name" text NOT NULL,
	"stage" text DEFAULT 'discovery' NOT NULL,
	"health" text DEFAULT 'on_track' NOT NULL,
	"owner_id" text,
	"objective" text NOT NULL,
	"next_gate" text NOT NULL,
	"start_date" timestamp with time zone,
	"target_date" timestamp with time zone,
	"progress" integer DEFAULT 0 NOT NULL,
	"budget_cents" integer
);
--> statement-breakpoint
CREATE INDEX "idx_agent_runs_name_created" ON "agent_runs" USING btree ("agent_name","created_at");--> statement-breakpoint
CREATE INDEX "idx_approvals_status_created" ON "approvals" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "idx_audit_events_entity" ON "audit_events" USING btree ("entity_type","entity_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_blog_posts_status_published" ON "blog_posts" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "idx_opportunities_status_created" ON "opportunities" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "idx_opportunities_email" ON "opportunities" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_project_items_project_status" ON "project_items" USING btree ("project_id","status");--> statement-breakpoint
CREATE INDEX "idx_projects_stage_health" ON "projects" USING btree ("stage","health");