import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const JOURNAL_RELATIVE_PATH = path.join("meta", "_journal.json");

/**
 * Resolve Drizzle migrations on disk.
 * Nitro bundles server code, so import.meta.url no longer sits next to migrations/.
 */
export function resolveMigrationsFolder(): string {
  const candidates = [
    path.join(process.cwd(), "server/database/migrations"),
    path.join(process.cwd(), "database/migrations"),
    path.join(path.dirname(fileURLToPath(import.meta.url)), "migrations"),
  ];

  for (const folder of candidates) {
    if (existsSync(path.join(folder, JOURNAL_RELATIVE_PATH))) {
      return folder;
    }
  }

  throw new Error(
    `Drizzle migrations not found (missing meta/_journal.json). Checked:\n${candidates
      .map((folder) => `- ${folder}`)
      .join("\n")}`
  );
}
