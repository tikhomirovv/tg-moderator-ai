import { sql } from "drizzle-orm";
import { getDatabaseConnection } from "../database/connection";
import { logger } from "./logger";
import {
  moderationRetentionCutoff,
  USER_MESSAGES_PER_SCOPE,
} from "./retention-policy";
import { ModerationActionRepository } from "../database/repositories/moderation-action-repository";
import { ModerationDecisionRepository } from "../database/repositories/moderation-decision-repository";
import { UserMessageRepository } from "../database/repositories/user-message-repository";

export const RETENTION_LOCK_KEYS = {
  userMessages: 59_001,
  moderationActions: 59_002,
  moderationDecisions: 59_003,
} as const;

type CleanupResult = {
  deleted: number;
  skipped: boolean;
};

async function withAdvisoryLock(
  lockKey: number,
  run: () => Promise<number>
): Promise<CleanupResult> {
  const db = getDatabaseConnection().getDb();

  const lockResult = await db.execute<{ acquired: boolean }>(
    sql`SELECT pg_try_advisory_lock(${lockKey}) AS acquired`
  );
  const acquired = lockResult[0]?.acquired === true;

  if (!acquired) {
    logger.info({ lockKey }, "Retention cleanup skipped — advisory lock held");
    return { deleted: 0, skipped: true };
  }

  try {
    const deleted = await run();
    return { deleted, skipped: false };
  } finally {
    await db.execute(sql`SELECT pg_advisory_unlock(${lockKey})`);
  }
}

export async function cleanupUserMessagesRetention(): Promise<CleanupResult> {
  return withAdvisoryLock(RETENTION_LOCK_KEYS.userMessages, async () => {
    const repo = new UserMessageRepository();
    const deleted = await repo.deleteExcessPerScope(USER_MESSAGES_PER_SCOPE);
    logger.info({ deleted, table: "user_messages" }, "Retention cleanup finished");
    return deleted;
  });
}

export async function cleanupModerationActionsRetention(): Promise<CleanupResult> {
  return withAdvisoryLock(RETENTION_LOCK_KEYS.moderationActions, async () => {
    const repo = new ModerationActionRepository();
    const deleted = await repo.deleteOlderThan(moderationRetentionCutoff());
    logger.info(
      { deleted, table: "moderation_actions" },
      "Retention cleanup finished"
    );
    return deleted;
  });
}

export async function cleanupModerationDecisionsRetention(): Promise<CleanupResult> {
  return withAdvisoryLock(RETENTION_LOCK_KEYS.moderationDecisions, async () => {
    const repo = new ModerationDecisionRepository();
    const deleted = await repo.deleteOlderThan(moderationRetentionCutoff());
    logger.info(
      { deleted, table: "moderation_decisions" },
      "Retention cleanup finished"
    );
    return deleted;
  });
}
