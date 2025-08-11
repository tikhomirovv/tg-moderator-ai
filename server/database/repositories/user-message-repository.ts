import { Collection } from "mongodb";
import { getDatabaseConnection } from "../connection";
import {
  UserMessage,
  CreateUserMessageRequest,
  UpdateUserMessageRequest,
} from "../models/user-message";

export class UserMessageRepository {
  private collection: Collection<UserMessage>;

  constructor() {
    const db = getDatabaseConnection().getDb();
    this.collection = db.collection<UserMessage>("user_messages");
  }

  async create(messageData: CreateUserMessageRequest): Promise<UserMessage> {
    const now = new Date();
    const message: UserMessage = {
      ...messageData,
      is_deleted: false,
      created_at: now,
    };

    const result = await this.collection.insertOne(message);
    return { ...message, _id: result.insertedId.toString() };
  }

  async findByMessageId(
    botId: string,
    chatId: number,
    messageId: number
  ): Promise<UserMessage | null> {
    return await this.collection.findOne({
      bot_id: botId,
      chat_id: chatId,
      message_id: messageId,
    });
  }

  async getRecentMessages(
    botId: string,
    chatId: number,
    userId: number,
    limit: number = 10
  ): Promise<UserMessage[]> {
    return await this.collection
      .find({
        bot_id: botId,
        chat_id: chatId,
        user_id: userId,
      })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  }

  async markAsDeleted(
    botId: string,
    chatId: number,
    messageId: number,
    reason: string
  ): Promise<boolean> {
    const result = await this.collection.updateOne(
      { bot_id: botId, chat_id: chatId, message_id: messageId },
      {
        $set: {
          is_deleted: true,
          deleted_at: new Date(),
          deleted_reason: reason,
        },
      }
    );

    return result.modifiedCount > 0;
  }

  async getMessagesByDateRange(
    botId: string,
    chatId: number,
    startDate: Date,
    endDate: Date
  ): Promise<UserMessage[]> {
    const filter: any = {
      bot_id: botId,
      timestamp: { $gte: startDate, $lte: endDate },
    };

    // Если chatId не 0, добавляем фильтр по чату
    if (chatId !== 0) {
      filter.chat_id = chatId;
    }

    return await this.collection.find(filter).sort({ timestamp: -1 }).toArray();
  }

  async getDeletedMessages(
    botId: string,
    chatId: number,
    limit: number = 50
  ): Promise<UserMessage[]> {
    return await this.collection
      .find({
        bot_id: botId,
        chat_id: chatId,
        is_deleted: true,
      })
      .sort({ deleted_at: -1 })
      .limit(limit)
      .toArray();
  }

  async getMessageCount(
    botId: string,
    chatId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    const filter: any = { bot_id: botId, chat_id: chatId };

    if (startDate && endDate) {
      filter.timestamp = { $gte: startDate, $lte: endDate };
    }

    return await this.collection.countDocuments(filter);
  }
}
