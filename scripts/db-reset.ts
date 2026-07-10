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
  onnotice: () => {},
});

try {
  // public — app tables; drizzle — migration journal (survives public DROP otherwise).
  await sql.unsafe(
    "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;"
  );
  await sql.unsafe("DROP SCHEMA IF EXISTS drizzle CASCADE;");

  const db = drizzle(sql);
  await migrate(db, { migrationsFolder: resolveMigrationsFolder() });
  console.log("Database reset and migrations applied");
} finally {
  await sql.end({ timeout: 5 });
}
