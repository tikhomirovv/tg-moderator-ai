CREATE TYPE "public"."action_type" AS ENUM('warning', 'delete', 'ban');--> statement-breakpoint
CREATE TYPE "public"."severity" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TABLE "bots" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"token" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_rules" (
	"chat_id" integer NOT NULL,
	"rule_id" varchar(64) NOT NULL,
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
	"warnings_before_ban" integer DEFAULT 3 NOT NULL,
	"auto_delete_violations" boolean DEFAULT true NOT NULL,
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
	"rule_violated" varchar(64),
	"ai_confidence" real NOT NULL,
	"ai_reasoning" text NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"moderator_bot_id" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rules" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"ai_prompt" text NOT NULL,
	"severity" "severity" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
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
	"banned_by" varchar(64),
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
ALTER TABLE "chat_rules" ADD CONSTRAINT "chat_rules_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_rules" ADD CONSTRAINT "chat_rules_rule_id_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."rules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "chat_statistics_unique" ON "chat_statistics" USING btree ("bot_id","chat_id","date");--> statement-breakpoint
CREATE INDEX "chat_statistics_date" ON "chat_statistics" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "chats_bot_chat_unique" ON "chats" USING btree ("bot_id","chat_id");--> statement-breakpoint
CREATE INDEX "moderation_actions_bot_chat_ts" ON "moderation_actions" USING btree ("bot_id","chat_id","timestamp");--> statement-breakpoint
CREATE INDEX "moderation_actions_bot_user_ts" ON "moderation_actions" USING btree ("bot_id","chat_id","user_id","timestamp");--> statement-breakpoint
CREATE INDEX "moderation_actions_type" ON "moderation_actions" USING btree ("action_type");--> statement-breakpoint
CREATE UNIQUE INDEX "user_contexts_unique" ON "user_contexts" USING btree ("bot_id","chat_id","user_id");--> statement-breakpoint
CREATE INDEX "user_contexts_last_activity" ON "user_contexts" USING btree ("last_activity");--> statement-breakpoint
CREATE INDEX "user_contexts_banned" ON "user_contexts" USING btree ("is_banned");--> statement-breakpoint
CREATE UNIQUE INDEX "user_messages_unique" ON "user_messages" USING btree ("bot_id","chat_id","message_id");--> statement-breakpoint
CREATE INDEX "user_messages_user_ts" ON "user_messages" USING btree ("bot_id","chat_id","user_id","timestamp");--> statement-breakpoint
CREATE INDEX "user_messages_ts" ON "user_messages" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "user_messages_deleted" ON "user_messages" USING btree ("is_deleted");