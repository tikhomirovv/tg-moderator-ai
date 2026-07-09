import { getDatabaseConnection } from "../database/connection";
import { runMigrations } from "../database/migrate";
import { seedDatabase } from "../database/seed";
import { logger } from "../core/logger";

let isInitialized = false;

export default defineEventHandler(async () => {
  if (isInitialized) {
    return;
  }

  try {
    logger.info("Initializing database...");
    const connection = getDatabaseConnection();
    await connection.connect();
    await runMigrations(connection.getDb());
    await seedDatabase();
    isInitialized = true;
    logger.info("Database initialized successfully");
  } catch (error) {
    logger.error({ error: error as Error }, "Error initializing database");
    throw error;
  }
});
