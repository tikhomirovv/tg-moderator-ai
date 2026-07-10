import { getDatabaseConnection } from "../database/connection";
import { seedDatabase } from "../database/seed";
import { logger } from "../core/logger";

let isInitialized = false;

export default defineEventHandler(async () => {
  if (isInitialized) {
    return;
  }

  try {
    const connection = getDatabaseConnection();
    if (!connection.isConnected()) {
      await connection.connect();
      logger.info("Database connection ready");
    }

    await seedDatabase();
    isInitialized = true;
  } catch (error) {
    logger.error({ error: error as Error }, "Error initializing database");
    throw error;
  }
});
