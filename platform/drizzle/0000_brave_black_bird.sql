CREATE TABLE `agent_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`client_id` text,
	`agent_name` text NOT NULL,
	`channel` text NOT NULL,
	`status` text NOT NULL,
	`outcome` text,
	`duration_ms` integer,
	`requires_approval` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `approvals` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`run_id` text NOT NULL,
	`action` text NOT NULL,
	`risk` text DEFAULT 'medium' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`name` text NOT NULL,
	`industry` text NOT NULL,
	`stage` text DEFAULT 'pilot' NOT NULL,
	`health` text DEFAULT 'on_track' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `opportunities` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`company` text NOT NULL,
	`work` text NOT NULL,
	`channel` text NOT NULL,
	`desired_outcome` text NOT NULL,
	`recommendation` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`source` text DEFAULT 'website_mapper' NOT NULL
);
