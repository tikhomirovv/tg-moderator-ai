import { migrate } from "drizzle-orm/postgres-js/migrator";
import type { Database } from "./connection";
import { resolveMigrationsFolder } from "./migrations-path";

export async function runMigrations(db: Database): Promise<void> {
  await migrate(db, { migrationsFolder: resolveMigrationsFolder() });
}
