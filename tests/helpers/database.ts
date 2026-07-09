import { afterAll, beforeAll, beforeEach } from "bun:test";
import { sql } from "drizzle-orm";
import {
  closeDatabase,
  getDatabaseConnection,
  initializeDatabase,
} from "../../server/database/connection";

export async function setupTestDatabase() {
  await initializeDatabase();
}

export async function teardownTestDatabase() {
  await closeDatabase();
}

export async function resetDatabase() {
  const db = getDatabaseConnection().getDb();
  await db.execute(sql`
    TRUNCATE TABLE
      chat_rules,
      chats,
      moderation_actions,
      user_messages,
      user_contexts,
      chat_statistics,
      bots,
      rules
    RESTART IDENTITY CASCADE
  `);
}

export function useTestDatabase() {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });
}
