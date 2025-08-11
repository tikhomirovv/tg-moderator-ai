import { initializeBots } from "../../index";
import { logger } from "../../core/logger";

export default defineEventHandler(async (event) => {
  try {
    logger.info("Reloading all bots from database...");

    // Переинициализируем всех ботов
    await initializeBots();

    return {
      success: true,
      message: "Bots reloaded successfully",
    };
  } catch (error) {
    logger.error({ error: error as Error }, "Error reloading bots");
    throw createError({
      statusCode: 500,
      statusMessage: "Error reloading bots",
    });
  }
});
