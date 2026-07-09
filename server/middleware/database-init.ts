import { getDatabaseConnection } from "../database/connection";
import { seedDatabase } from "../database/seed";
import { logger } from "../core/logger";

let isInitialized = false;

export default defineEventHandler(async () => {
  if (isInitialized) {
    return;
  }

  try {
    logger.info("Initializing database...");
    await getDatabaseConnection().connect();
    await seedDatabase();
    isInitialized = true;
    logger.info("Database initialized successfully");
  } catch (error) {
    logger.error({ error: error as Error }, "Error initializing database");
    throw error;
  }
});
