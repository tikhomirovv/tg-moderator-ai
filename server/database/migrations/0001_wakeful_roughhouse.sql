CREATE TABLE "moderation_decisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"bot_id" varchar(64) NOT NULL,
	"chat_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"message_id" bigint NOT NULL,
	"message_text" text NOT NULL,
	"violation_detected" boolean NOT NULL,
	"rule_violated" varchar(64),
	"ai_confidence" real NOT NULL,
	"ai_reasoning" text NOT NULL,
	"rules_applied" jsonb NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "moderation_decisions_bot_ts" ON "moderation_decisions" USING btree ("bot_id","timestamp");--> statement-breakpoint
CREATE INDEX "moderation_decisions_bot_chat_ts" ON "moderation_decisions" USING btree ("bot_id","chat_id","timestamp");--> statement-breakpoint
CREATE INDEX "moderation_decisions_created_at" ON "moderation_decisions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "moderation_actions_created_at" ON "moderation_actions" USING btree ("created_at");