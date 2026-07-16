CREATE TYPE "public"."provider_payment_status" AS ENUM('pending', 'succeeded', 'canceled', 'credited');--> statement-breakpoint
CREATE TABLE "provider_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider_payment_id" text NOT NULL,
	"bot_id" varchar(64) NOT NULL,
	"package_id" text NOT NULL,
	"amount_rub" integer NOT NULL,
	"credits" integer NOT NULL,
	"status" "provider_payment_status" DEFAULT 'pending' NOT NULL,
	"purchaser_user_id" text NOT NULL,
	"credited_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "provider_payments" ADD CONSTRAINT "provider_payments_bot_id_bots_id_fk" FOREIGN KEY ("bot_id") REFERENCES "public"."bots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_payments" ADD CONSTRAINT "provider_payments_purchaser_user_id_users_id_fk" FOREIGN KEY ("purchaser_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "provider_payments_provider_payment_id_unique" ON "provider_payments" USING btree ("provider_payment_id");--> statement-breakpoint
CREATE INDEX "provider_payments_bot_status_created" ON "provider_payments" USING btree ("bot_id","status","created_at");