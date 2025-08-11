import { getDatabaseConnection } from "./connection";
import { logger } from "../core/logger";

export async function createIndexes() {
  try {
    const db = getDatabaseConnection().getDb();
    logger.info("Creating database indexes...");

    // Индексы для user_context
    await db
      .collection("user_context")
      .createIndex(
        { bot_id: 1, chat_id: 1, user_id: 1 },
        { unique: true, name: "user_context_unique" }
      );
    await db
      .collection("user_context")
      .createIndex(
        { last_activity: -1 },
        { name: "user_context_last_activity" }
      );
    await db
      .collection("user_context")
      .createIndex({ is_banned: 1 }, { name: "user_context_banned" });

    // Индексы для user_messages
    await db
      .collection("user_messages")
      .createIndex(
        { bot_id: 1, chat_id: 1, user_id: 1, timestamp: -1 },
        { name: "user_messages_user_timestamp" }
      );
    await db
      .collection("user_messages")
      .createIndex(
        { bot_id: 1, chat_id: 1, message_id: 1 },
        { unique: true, name: "user_messages_unique" }
      );
    await db
      .collection("user_messages")
      .createIndex({ timestamp: -1 }, { name: "user_messages_timestamp" });
    await db
      .collection("user_messages")
      .createIndex({ is_deleted: 1 }, { name: "user_messages_deleted" });

    // Индексы для moderation_actions
    await db
      .collection("moderation_actions")
      .createIndex(
        { bot_id: 1, chat_id: 1, timestamp: -1 },
        { name: "moderation_actions_chat_timestamp" }
      );
    await db
      .collection("moderation_actions")
      .createIndex(
        { bot_id: 1, chat_id: 1, user_id: 1, timestamp: -1 },
        { name: "moderation_actions_user_timestamp" }
      );
    await db
      .collection("moderation_actions")
      .createIndex({ action_type: 1 }, { name: "moderation_actions_type" });

    // Индексы для chat_statistics
    await db
      .collection("chat_statistics")
      .createIndex(
        { bot_id: 1, chat_id: 1, date: 1 },
        { unique: true, name: "chat_statistics_unique" }
      );
    await db
      .collection("chat_statistics")
      .createIndex({ date: -1 }, { name: "chat_statistics_date" });

    logger.info("Database indexes created successfully");
  } catch (error) {
    logger.error({ error: error as Error }, "Error creating database indexes");
    throw error;
  }
}
