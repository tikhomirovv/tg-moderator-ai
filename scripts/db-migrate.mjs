import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const migrationsFolder = path.join(process.cwd(), "server/database/migrations");

if (!existsSync(path.join(migrationsFolder, "meta/_journal.json"))) {
  console.error(`Drizzle migrations not found at ${migrationsFolder}`);
  process.exit(1);
}

const sql = postgres(connectionString, {
  max: 1,
  onnotice: () => {},
});

const db = drizzle(sql);

try {
  await migrate(db, { migrationsFolder });
  console.log("Migrations applied successfully");
} finally {
  await sql.end({ timeout: 5 });
}
