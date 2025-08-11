import { initializeDatabase } from "../database/connection";
import { seedDatabase } from "../database/seed";
import { logger } from "../core/logger";

let isInitialized = false;

export default defineEventHandler(async (event) => {
  // Инициализируем БД только один раз
  if (isInitialized) {
    return;
  }

  logger.info("Initializing database...");

  try {
    // Инициализируем подключение к БД
    await initializeDatabase();

    // Заполняем БД начальными данными
    await seedDatabase();

    logger.info("Database initialized successfully");
    isInitialized = true;
  } catch (error) {
    logger.error({ error: error as Error }, "Failed to initialize database");
  }
});
