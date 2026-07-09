import { afterAll, beforeAll, beforeEach } from "bun:test";
import { sql } from "drizzle-orm";
import {
  closeDatabase,
  getDatabaseConnection,
  initializeDatabase,
} from "../../server/database/connection";
import { organization } from "../../server/database/auth-schema";

export const TEST_WORKSPACE_ID = "test-workspace";

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
      rules,
      invitation,
      member,
      session,
      account,
      verification,
      organization,
      "user"
    RESTART IDENTITY CASCADE
  `);
}

export async function seedTestWorkspace() {
  const db = getDatabaseConnection().getDb();
  const now = new Date();

  await db
    .insert(organization)
    .values({
      id: TEST_WORKSPACE_ID,
      name: "Test Workspace",
      slug: "test-workspace",
      createdAt: now,
    })
    .onConflictDoNothing();
}

export function useTestDatabase() {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await resetDatabase();
    await seedTestWorkspace();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });
}
