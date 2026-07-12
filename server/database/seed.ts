import { logger } from "../core/logger";

export async function seedDatabase() {
  logger.info("Database seeding skipped (rules are created per bot via templates)");
}
