import { getDatabaseConnection } from "../database/connection";
import { seedDatabase } from "../database/seed";
import { createIndexes } from "../database/create-indexes";
import { logger } from "../core/logger";

let isInitialized = false;

export default defineEventHandler(async (event) => {
  if (isInitialized) {
    return;
  }

  try {
    logger.info("Initializing database...");

    // Подключаемся к базе данных
    await getDatabaseConnection().connect();

    // Создаем индексы
    await createIndexes();

    // Заполняем начальными данными
    await seedDatabase();

    isInitialized = true;
    logger.info("Database initialized successfully");
  } catch (error) {
    logger.error({ error: error as Error }, "Error initializing database");
    throw error;
  }
});
