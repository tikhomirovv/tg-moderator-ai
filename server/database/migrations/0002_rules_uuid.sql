-- Migrate rule ids from legacy slugs to PostgreSQL uuid; preserve references.

CREATE TABLE "_rule_id_migration" (
	"workspace_id" text NOT NULL,
	"old_id" varchar(64) NOT NULL,
	"new_id" uuid NOT NULL,
	CONSTRAINT "_rule_id_migration_pk" PRIMARY KEY("workspace_id","old_id")
);
--> statement-breakpoint
INSERT INTO "_rule_id_migration" ("workspace_id", "old_id", "new_id")
SELECT
	r."workspace_id",
	r."id",
	CASE
		WHEN r."id" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN r."id"::uuid
		ELSE gen_random_uuid()
	END
FROM "rules" r;
--> statement-breakpoint
ALTER TABLE "chat_rules" DROP CONSTRAINT "chat_rules_workspace_id_rule_id_rules_workspace_id_id_fk";
--> statement-breakpoint
ALTER TABLE "rule_whitelist" DROP CONSTRAINT "rule_whitelist_workspace_id_rule_id_rules_workspace_id_id_fk";
--> statement-breakpoint
UPDATE "rule_whitelist" rw
SET "rule_id" = m."new_id"::text
FROM "_rule_id_migration" m
WHERE rw."workspace_id" = m."workspace_id" AND rw."rule_id" = m."old_id";
--> statement-breakpoint
UPDATE "chat_rules" cr
SET "rule_id" = m."new_id"::text
FROM "_rule_id_migration" m
WHERE cr."workspace_id" = m."workspace_id" AND cr."rule_id" = m."old_id";
--> statement-breakpoint
UPDATE "moderation_actions" ma
SET "rule_violated" = m."new_id"::text
FROM "bots" b
JOIN "_rule_id_migration" m ON m."workspace_id" = b."workspace_id"
WHERE ma."bot_id" = b."id"
	AND ma."rule_violated" IS NOT NULL
	AND ma."rule_violated" = m."old_id";
--> statement-breakpoint
UPDATE "moderation_decisions" md
SET "rule_violated" = m."new_id"::text
FROM "bots" b
JOIN "_rule_id_migration" m ON m."workspace_id" = b."workspace_id"
WHERE md."bot_id" = b."id"
	AND md."rule_violated" IS NOT NULL
	AND md."rule_violated" = m."old_id";
--> statement-breakpoint
UPDATE "user_contexts" uc
SET "banned_by" = m."new_id"::text
FROM "bots" b
JOIN "_rule_id_migration" m ON m."workspace_id" = b."workspace_id"
WHERE uc."bot_id" = b."id"
	AND uc."banned_by" IS NOT NULL
	AND uc."banned_by" = m."old_id";
--> statement-breakpoint
UPDATE "rules" r
SET "id" = m."new_id"::text
FROM "_rule_id_migration" m
WHERE r."workspace_id" = m."workspace_id" AND r."id" = m."old_id";
--> statement-breakpoint
ALTER TABLE "rules" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;
--> statement-breakpoint
ALTER TABLE "rule_whitelist" ALTER COLUMN "rule_id" SET DATA TYPE uuid USING "rule_id"::uuid;
--> statement-breakpoint
ALTER TABLE "chat_rules" ALTER COLUMN "rule_id" SET DATA TYPE uuid USING "rule_id"::uuid;
--> statement-breakpoint
ALTER TABLE "moderation_actions" ALTER COLUMN "rule_violated" SET DATA TYPE uuid USING "rule_violated"::uuid;
--> statement-breakpoint
ALTER TABLE "moderation_decisions" ALTER COLUMN "rule_violated" SET DATA TYPE uuid USING "rule_violated"::uuid;
--> statement-breakpoint
ALTER TABLE "user_contexts" ALTER COLUMN "banned_by" SET DATA TYPE uuid USING "banned_by"::uuid;
--> statement-breakpoint
ALTER TABLE "chat_rules" ADD CONSTRAINT "chat_rules_workspace_id_rule_id_rules_workspace_id_id_fk" FOREIGN KEY ("workspace_id","rule_id") REFERENCES "public"."rules"("workspace_id","id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "rule_whitelist" ADD CONSTRAINT "rule_whitelist_workspace_id_rule_id_rules_workspace_id_id_fk" FOREIGN KEY ("workspace_id","rule_id") REFERENCES "public"."rules"("workspace_id","id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
DROP TABLE "_rule_id_migration";
