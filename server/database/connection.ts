import { MongoClient, Db } from "mongodb";
import { logger } from "../core/logger";

// Абстракция для работы с базой данных
export interface DatabaseConnection {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getDb(): Db;
  isConnected(): boolean;
}

// MongoDB реализация
export class MongoDBConnection implements DatabaseConnection {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private connectionString: string;

  constructor(connectionString: string) {
    this.connectionString = connectionString;
  }

  async connect(): Promise<void> {
    try {
      this.client = new MongoClient(this.connectionString);
      await this.client.connect();
      this.db = this.client.db();

      logger.info("Connected to MongoDB");
    } catch (error) {
      logger.error({ error: error as Error }, "Failed to connect to MongoDB");
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      logger.info("Disconnected from MongoDB");
    }
  }

  getDb(): Db {
    if (!this.db) {
      throw new Error("Database not connected");
    }
    return this.db;
  }

  isConnected(): boolean {
    return this.client !== null && this.db !== null;
  }
}

// Глобальный экземпляр подключения
let dbConnection: DatabaseConnection | null = null;

export function getDatabaseConnection(): DatabaseConnection {
  if (!dbConnection) {
    const config = useRuntimeConfig();
    const connectionString =
      config.mongodbUri || "mongodb://localhost:27017/tg-moderator";
    dbConnection = new MongoDBConnection(connectionString);
  }
  return dbConnection;
}

export async function initializeDatabase(): Promise<void> {
  const connection = getDatabaseConnection();
  await connection.connect();
}

export async function closeDatabase(): Promise<void> {
  if (dbConnection) {
    await dbConnection.disconnect();
    dbConnection = null;
  }
}
