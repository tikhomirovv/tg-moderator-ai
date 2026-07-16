CREATE TYPE "public"."credit_transaction_type" AS ENUM('grant_signup', 'purchase', 'debit_moderation', 'admin_adjust', 'reconcile_fix');--> statement-breakpoint
CREATE TABLE "credit_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"bot_id" varchar(64) NOT NULL,
	"type" "credit_transaction_type" NOT NULL,
	"amount" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"chat_id" bigint,
	"reference" text,
	"actor_user_id" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instance_settings" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"llm_api_key_encrypted" text,
	"llm_base_url" text,
	"llm_model" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "llm_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"bot_id" varchar(64) NOT NULL,
	"chat_id" bigint NOT NULL,
	"message_id" bigint NOT NULL,
	"model" text NOT NULL,
	"prompt_tokens" integer DEFAULT 0 NOT NULL,
	"completion_tokens" integer DEFAULT 0 NOT NULL,
	"estimated_cost_rub" real DEFAULT 0 NOT NULL,
	"success" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bots" ADD COLUMN "credit_balance" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_messages" ADD COLUMN "is_moderated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "llm_usage" ADD CONSTRAINT "llm_usage_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "credit_transactions_bot_created" ON "credit_transactions" USING btree ("bot_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "credit_transactions_debit_idempotency" ON "credit_transactions" USING btree ("bot_id","chat_id","reference") WHERE type = 'debit_moderation';--> statement-breakpoint
CREATE INDEX "llm_usage_bot_created" ON "llm_usage" USING btree ("bot_id","created_at");--> statement-breakpoint
CREATE INDEX "llm_usage_bot_chat_message" ON "llm_usage" USING btree ("bot_id","chat_id","message_id");--> statement-breakpoint
CREATE INDEX "user_messages_moderated_ts" ON "user_messages" USING btree ("bot_id","is_moderated","timestamp");