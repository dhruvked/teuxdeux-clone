CREATE SCHEMA IF NOT EXISTS "TD_TODO";
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_type t
		JOIN pg_namespace n ON n.oid = t.typnamespace
		WHERE t.typname = 'cadence' AND n.nspname = 'TD_TODO'
	) THEN
		CREATE TYPE "TD_TODO"."cadence" AS ENUM('daily', 'weekly', 'monthly');
	END IF;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "TD_TODO"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "TD_TODO"."tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"date" date,
	"completed_at" timestamp,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "TD_TODO"."recurring_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"cadence" "TD_TODO"."cadence" NOT NULL,
	"days_of_week" integer[] DEFAULT '{}',
	"day_of_month" integer,
	"starts_on" date NOT NULL,
	"ends_on" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.table_constraints
		WHERE constraint_schema = 'TD_TODO' AND constraint_name = 'recurring_rules_user_id_users_id_fk'
	) THEN
		ALTER TABLE "TD_TODO"."recurring_rules"
		ADD CONSTRAINT "recurring_rules_user_id_users_id_fk"
		FOREIGN KEY ("user_id") REFERENCES "TD_TODO"."users"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.table_constraints
		WHERE constraint_schema = 'TD_TODO' AND constraint_name = 'tasks_user_id_users_id_fk'
	) THEN
		ALTER TABLE "TD_TODO"."tasks"
		ADD CONSTRAINT "tasks_user_id_users_id_fk"
		FOREIGN KEY ("user_id") REFERENCES "TD_TODO"."users"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
