import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { resolveMigrationsFolder } from "../server/database/migrations-path";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const sql = postgres(connectionString, {
  max: 1,
  // Postgres NOTICE on repeated migrate (schema/table already exists) — not actionable.
  onnotice: () => {},
});

const db = drizzle(sql);

try {
  await migrate(db, { migrationsFolder: resolveMigrationsFolder() });
  console.log("Migrations applied successfully");
} finally {
  await sql.end({ timeout: 5 });
}
