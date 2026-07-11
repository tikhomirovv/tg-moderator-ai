-- Upgrade databases that applied pre-#42 schema (0000 + 0001_remove_severity).
-- Fresh installs already have these objects from rewritten 0000_init.sql.

ALTER TABLE "rules" ADD COLUMN IF NOT EXISTS "delete_on_violation" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "rules" ADD COLUMN IF NOT EXISTS "ban_on_violation" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "rules" ADD COLUMN IF NOT EXISTS "warnings_before_ban" integer;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rule_whitelist" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"rule_id" varchar(64) NOT NULL,
	"telegram_user_id" bigint,
	"username" varchar(255)
);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rule_whitelist" ADD CONSTRAINT "rule_whitelist_workspace_id_rule_id_rules_workspace_id_id_fk" FOREIGN KEY ("workspace_id","rule_id") REFERENCES "public"."rules"("workspace_id","id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "rule_whitelist_rule_user_unique" ON "rule_whitelist" USING btree ("rule_id","telegram_user_id") WHERE "telegram_user_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "rule_whitelist_rule_username_unique" ON "rule_whitelist" USING btree ("rule_id","username") WHERE "username" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "chats" DROP COLUMN IF EXISTS "warnings_before_ban";--> statement-breakpoint
ALTER TABLE "chats" DROP COLUMN IF EXISTS "auto_delete_violations";
