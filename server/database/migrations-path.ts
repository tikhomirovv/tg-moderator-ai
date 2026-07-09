import { existsSync } from "node:fs";
import path from "node:path";

/** Drizzle migrations live in repo root — never next to bundled Nitro output. */
export const MIGRATIONS_DIR = "server/database/migrations";

export function resolveMigrationsFolder(): string {
  const folder = path.join(process.cwd(), MIGRATIONS_DIR);

  if (!existsSync(path.join(folder, "meta/_journal.json"))) {
    throw new Error(
      `Drizzle migrations not found at ${folder}. Run from project root or execute: bun run db:migrate`
    );
  }

  return folder;
}
