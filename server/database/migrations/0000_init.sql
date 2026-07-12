CREATE TYPE "public"."action_type" AS ENUM('warning', 'delete', 'ban');--> statement-breakpoint
CREATE TYPE "public"."bot_member_role" AS ENUM('owner', 'manager');--> statement-breakpoint
CREATE TABLE "bot_access_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"bot_id" varchar(64) NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "bot_members" (
	"bot_id" varchar(64) NOT NULL,
	"user_id" text NOT NULL,
	"role" "bot_member_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bot_members_bot_id_user_id_pk" PRIMARY KEY("bot_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "bots" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"owner_user_id" text NOT NULL,
	"name" text NOT NULL,
	"token" text,
	"webhook_secret" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_rules" (
	"chat_id" integer NOT NULL,
	"bot_id" varchar(64) NOT NULL,
	"rule_id" uuid NOT NULL,
	CONSTRAINT "chat_rules_chat_id_rule_id_pk" PRIMARY KEY("chat_id","rule_id")
);
--> statement-breakpoint
CREATE TABLE "chat_statistics" (
	"id" serial PRIMARY KEY NOT NULL,
	"bot_id" varchar(64) NOT NULL,
	"chat_id" bigint NOT NULL,
	"date" date NOT NULL,
	"messages_processed" integer DEFAULT 0 NOT NULL,
	"warnings_issued" integer DEFAULT 0 NOT NULL,
	"messages_deleted" integer DEFAULT 0 NOT NULL,
	"users_banned" integer DEFAULT 0 NOT NULL,
	"unique_users" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chats" (
	"id" serial PRIMARY KEY NOT NULL,
	"bot_id" varchar(64) NOT NULL,
	"chat_id" bigint NOT NULL,
	"name" text NOT NULL,
	"silent_mode" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moderation_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"bot_id" varchar(64) NOT NULL,
	"chat_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"message_id" bigint NOT NULL,
	"action_type" "action_type" NOT NULL,
	"rule_violated" uuid,
	"ai_confidence" real NOT NULL,
	"ai_reasoning" text NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"moderator_bot_id" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moderation_decisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"bot_id" varchar(64) NOT NULL,
	"chat_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"message_id" bigint NOT NULL,
	"message_text" text NOT NULL,
	"violation_detected" boolean NOT NULL,
	"rule_violated" uuid,
	"ai_confidence" real NOT NULL,
	"ai_reasoning" text NOT NULL,
	"rules_applied" jsonb NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rule_whitelist" (
	"id" serial PRIMARY KEY NOT NULL,
	"bot_id" varchar(64) NOT NULL,
	"rule_id" uuid NOT NULL,
	"entry" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rules" (
	"id" uuid NOT NULL,
	"bot_id" varchar(64) NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"ai_prompt" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"delete_on_violation" boolean DEFAULT false NOT NULL,
	"ban_on_violation" boolean DEFAULT false NOT NULL,
	"warnings_before_ban" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rules_bot_id_id_pk" PRIMARY KEY("bot_id","id")
);
--> statement-breakpoint
CREATE TABLE "user_contexts" (
	"id" serial PRIMARY KEY NOT NULL,
	"bot_id" varchar(64) NOT NULL,
	"chat_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"username" varchar(255),
	"first_name" varchar(255),
	"last_name" varchar(255),
	"warnings_count" integer DEFAULT 0 NOT NULL,
	"is_banned" boolean DEFAULT false NOT NULL,
	"banned_at" timestamp with time zone,
	"banned_by" uuid,
	"last_activity" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"bot_id" varchar(64) NOT NULL,
	"chat_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"message_id" bigint NOT NULL,
	"text" text NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"deleted_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"telegram_id" bigint NOT NULL,
	"username" text,
	"name" text NOT NULL,
	"photo_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bot_access_codes" ADD CONSTRAINT "bot_access_codes_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_members" ADD CONSTRAINT "bot_members_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bot_members" ADD CONSTRAINT "bot_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bots" ADD CONSTRAINT "bots_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_rules" ADD CONSTRAINT "chat_rules_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_rules" ADD CONSTRAINT "chat_rules_bot_id_rule_id_rules_bot_id_id_fk" FOREIGN KEY ("bot_id","rule_id") REFERENCES "public"."rules"("bot_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rule_whitelist" ADD CONSTRAINT "rule_whitelist_bot_id_rule_id_rules_bot_id_id_fk" FOREIGN KEY ("bot_id","rule_id") REFERENCES "public"."rules"("bot_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rules" ADD CONSTRAINT "rules_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bot_access_codes_code_unique" ON "bot_access_codes" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "chat_statistics_unique" ON "chat_statistics" USING btree ("bot_id","chat_id","date");--> statement-breakpoint
CREATE INDEX "chat_statistics_date" ON "chat_statistics" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "chats_bot_chat_unique" ON "chats" USING btree ("bot_id","chat_id");--> statement-breakpoint
CREATE INDEX "moderation_actions_bot_chat_ts" ON "moderation_actions" USING btree ("bot_id","chat_id","timestamp");--> statement-breakpoint
CREATE INDEX "moderation_actions_bot_user_ts" ON "moderation_actions" USING btree ("bot_id","chat_id","user_id","timestamp");--> statement-breakpoint
CREATE INDEX "moderation_actions_type" ON "moderation_actions" USING btree ("action_type");--> statement-breakpoint
CREATE INDEX "moderation_actions_created_at" ON "moderation_actions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "moderation_decisions_bot_ts" ON "moderation_decisions" USING btree ("bot_id","timestamp");--> statement-breakpoint
CREATE INDEX "moderation_decisions_bot_chat_ts" ON "moderation_decisions" USING btree ("bot_id","chat_id","timestamp");--> statement-breakpoint
CREATE INDEX "moderation_decisions_created_at" ON "moderation_decisions" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "rule_whitelist_rule_entry_unique" ON "rule_whitelist" USING btree ("rule_id","entry");--> statement-breakpoint
CREATE UNIQUE INDEX "user_contexts_unique" ON "user_contexts" USING btree ("bot_id","chat_id","user_id");--> statement-breakpoint
CREATE INDEX "user_contexts_last_activity" ON "user_contexts" USING btree ("last_activity");--> statement-breakpoint
CREATE INDEX "user_contexts_banned" ON "user_contexts" USING btree ("is_banned");--> statement-breakpoint
CREATE UNIQUE INDEX "user_messages_unique" ON "user_messages" USING btree ("bot_id","chat_id","message_id");--> statement-breakpoint
CREATE INDEX "user_messages_user_ts" ON "user_messages" USING btree ("bot_id","chat_id","user_id","timestamp");--> statement-breakpoint
CREATE INDEX "user_messages_ts" ON "user_messages" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "user_messages_deleted" ON "user_messages" USING btree ("is_deleted");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_unique" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_telegram_id_unique" ON "users" USING btree ("telegram_id");