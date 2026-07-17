CREATE TYPE "public"."referrer_status" AS ENUM('pending', 'claimed', 'skipped_zero');--> statement-breakpoint
ALTER TYPE "public"."credit_transaction_type" ADD VALUE 'referral_bonus';--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" serial PRIMARY KEY NOT NULL,
	"referrer_user_id" text NOT NULL,
	"referee_user_id" text NOT NULL,
	"provider_payment_id" text NOT NULL,
	"base_credits" integer NOT NULL,
	"referee_bonus_credits" integer NOT NULL,
	"referrer_bonus_credits" integer NOT NULL,
	"referee_bot_id" varchar(64),
	"referrer_status" "referrer_status" NOT NULL,
	"referrer_claimed_bot_id" varchar(64),
	"referral_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"claimed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "provider_payments" ADD COLUMN "referral_code" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "referral_code" text;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_user_id_users_id_fk" FOREIGN KEY ("referrer_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referee_user_id_users_id_fk" FOREIGN KEY ("referee_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referee_bot_id_bots_id_fk" FOREIGN KEY ("referee_bot_id") REFERENCES "public"."bots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_claimed_bot_id_bots_id_fk" FOREIGN KEY ("referrer_claimed_bot_id") REFERENCES "public"."bots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "referrals_referee_user_unique" ON "referrals" USING btree ("referee_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "referrals_provider_payment_unique" ON "referrals" USING btree ("provider_payment_id");--> statement-breakpoint
CREATE INDEX "referrals_referrer_status" ON "referrals" USING btree ("referrer_user_id","referrer_status");--> statement-breakpoint
CREATE UNIQUE INDEX "users_referral_code_unique" ON "users" USING btree ("referral_code");