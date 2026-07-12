ALTER TABLE "chat_rules" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "rule_whitelist" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "chat_rules" CASCADE;--> statement-breakpoint
DROP TABLE "rule_whitelist" CASCADE;--> statement-breakpoint
TRUNCATE TABLE "rules";--> statement-breakpoint
ALTER TABLE "rules" ADD COLUMN "chat_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "rules" ADD CONSTRAINT "rules_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;
