import { initializeDatabase } from "../database/connection";
import { logger } from "../core/logger";
import { setupWebhooks } from "../index";

let startupCompleted = false;

export default defineNitroPlugin(async () => {
  if (startupCompleted) {
    return;
  }

  startupCompleted = true;

  try {
    await initializeDatabase();
    logger.info("Database ready on startup");
    await setupWebhooks();
    logger.info("Startup hooks completed");
  } catch (error) {
    logger.error({ error: error as Error }, "Startup hook failed");
    throw error;
  }
});
