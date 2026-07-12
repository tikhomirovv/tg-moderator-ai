CREATE TABLE "login_bot_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"telegram_id" bigint NOT NULL,
	"username" text,
	"name" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "login_bot_tokens_token_unique" ON "login_bot_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "login_bot_tokens_telegram_created_idx" ON "login_bot_tokens" USING btree ("telegram_id","created_at");