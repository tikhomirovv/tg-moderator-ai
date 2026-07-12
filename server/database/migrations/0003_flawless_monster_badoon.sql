CREATE TYPE "public"."chat_health_status" AS ENUM('ok', 'degraded', 'unhealthy');--> statement-breakpoint
CREATE TABLE "chat_activation_pending" (
	"id" serial PRIMARY KEY NOT NULL,
	"bot_id" varchar(64) NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"result_chat_id" integer,
	"completed_at" timestamp with time zone,
	"failed_code" text,
	"failed_message" text
);
--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "photo_file_id" text;--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "telegram_username" text;--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "health_status" "chat_health_status";--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "health_message" text;--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "health_checked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "chat_activation_pending" ADD CONSTRAINT "chat_activation_pending_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_activation_pending" ADD CONSTRAINT "chat_activation_pending_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_activation_pending" ADD CONSTRAINT "chat_activation_pending_result_chat_id_chats_id_fk" FOREIGN KEY ("result_chat_id") REFERENCES "public"."chats"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_activation_pending_bot_user_created_idx" ON "chat_activation_pending" USING btree ("bot_id","user_id","created_at");