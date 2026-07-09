import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { logger } from "../core/logger";
import * as schema from "./schema";
import * as authSchema from "./auth-schema";
import { runMigrations } from "./migrate";

export type Database = PostgresJsDatabase<typeof schema>;

export interface DatabaseConnection {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getDb(): Database;
  isConnected(): boolean;
}

export class PostgresConnection implements DatabaseConnection {
  private client: ReturnType<typeof postgres> | null = null;
  private db: Database | null = null;
  private connectionString: string;

  constructor(connectionString: string) {
    this.connectionString = connectionString;
  }

  async connect(): Promise<void> {
    if (this.client) {
      return;
    }

    try {
      this.client = postgres(this.connectionString, { max: 10 });
      this.db = drizzle(this.client, { schema: { ...schema, ...authSchema } });
      logger.info("Connected to PostgreSQL");
    } catch (error) {
      logger.error({ error: error as Error }, "Failed to connect to PostgreSQL");
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.end({ timeout: 5 });
      this.client = null;
      this.db = null;
      logger.info("Disconnected from PostgreSQL");
    }
  }

  getDb(): Database {
    if (!this.db) {
      throw new Error("Database not connected");
    }
    return this.db;
  }

  isConnected(): boolean {
    return this.client !== null && this.db !== null;
  }
}

let dbConnection: DatabaseConnection | null = null;

function getConnectionString(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  try {
    const config = useRuntimeConfig();
    if (config.databaseUrl) {
      return config.databaseUrl;
    }
  } catch {
    // Outside Nuxt runtime (e.g. bun test)
  }

  return "postgresql://tgmoderator:tgmoderator@localhost:5432/tgmoderator";
}

export function getDatabaseConnection(): DatabaseConnection {
  if (!dbConnection) {
    dbConnection = new PostgresConnection(getConnectionString());
  }
  return dbConnection;
}

export async function initializeDatabase(): Promise<void> {
  const connection = getDatabaseConnection();
  await connection.connect();
  await runMigrations(connection.getDb());
}

export async function closeDatabase(): Promise<void> {
  if (dbConnection) {
    await dbConnection.disconnect();
    dbConnection = null;
  }
}
