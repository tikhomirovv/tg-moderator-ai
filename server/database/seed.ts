import { logger } from "../core/logger";

export async function seedDatabase() {
  // Rules are seeded per workspace on organization creation.
  logger.info("Database seeding skipped (workspace-scoped rules)");
}
