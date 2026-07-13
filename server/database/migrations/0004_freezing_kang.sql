-- Remove orphan rows before adding bot_id FK constraints (dev leftovers from pre-cascade deletes).
DELETE FROM "moderation_actions" WHERE "bot_id" NOT IN (SELECT "id" FROM "bots");--> statement-breakpoint
DELETE FROM "moderation_decisions" WHERE "bot_id" NOT IN (SELECT "id" FROM "bots");--> statement-breakpoint
DELETE FROM "user_contexts" WHERE "bot_id" NOT IN (SELECT "id" FROM "bots");--> statement-breakpoint
DELETE FROM "user_messages" WHERE "bot_id" NOT IN (SELECT "id" FROM "bots");--> statement-breakpoint
DELETE FROM "chat_statistics" WHERE "bot_id" NOT IN (SELECT "id" FROM "bots");--> statement-breakpoint
ALTER TABLE "chat_statistics" ADD CONSTRAINT "chat_statistics_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_decisions" ADD CONSTRAINT "moderation_decisions_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_contexts" ADD CONSTRAINT "user_contexts_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_messages" ADD CONSTRAINT "user_messages_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE cascade ON UPDATE no action;
