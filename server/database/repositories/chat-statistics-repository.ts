import { Collection } from "mongodb";
import { getDatabaseConnection } from "../connection";
import {
  ChatStatistics,
  CreateChatStatisticsRequest,
  UpdateChatStatisticsRequest,
} from "../models/chat-statistics";

export class ChatStatisticsRepository {
  private collection: Collection<ChatStatistics>;

  constructor() {
    const db = getDatabaseConnection().getDb();
    this.collection = db.collection<ChatStatistics>("chat_statistics");
  }

  async findByDate(
    botId: string,
    chatId: number,
    date: Date
  ): Promise<ChatStatistics | null> {
    const dateKey = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    return await this.collection.findOne({
      bot_id: botId,
      chat_id: chatId,
      date: dateKey,
    });
  }

  async create(
    statsData: CreateChatStatisticsRequest
  ): Promise<ChatStatistics> {
    const now = new Date();
    const stats: ChatStatistics = {
      ...statsData,
      messages_processed: statsData.messages_processed || 0,
      warnings_issued: statsData.warnings_issued || 0,
      messages_deleted: statsData.messages_deleted || 0,
      users_banned: statsData.users_banned || 0,
      unique_users: statsData.unique_users || 0,
      created_at: now,
      updated_at: now,
    };

    const result = await this.collection.insertOne(stats);
    return { ...stats, _id: result.insertedId.toString() };
  }

  async update(
    botId: string,
    chatId: number,
    date: Date,
    updateData: UpdateChatStatisticsRequest
  ): Promise<ChatStatistics | null> {
    const dateKey = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const updateDoc = {
      ...updateData,
      updated_at: new Date(),
    };

    const result = await this.collection.findOneAndUpdate(
      { bot_id: botId, chat_id: chatId, date: dateKey },
      { $set: updateDoc },
      { returnDocument: "after" }
    );

    return result;
  }

  async incrementField(
    botId: string,
    chatId: number,
    date: Date,
    field: keyof UpdateChatStatisticsRequest
  ): Promise<void> {
    const dateKey = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    // Сначала пытаемся обновить существующую запись
    const result = await this.collection.updateOne(
      { bot_id: botId, chat_id: chatId, date: dateKey },
      {
        $inc: { [field]: 1 },
        $set: { updated_at: new Date() },
      }
    );

    // Если записи нет, создаем новую
    if (result.matchedCount === 0) {
      const initialStats: any = {
        messages_processed: 0,
        warnings_issued: 0,
        messages_deleted: 0,
        users_banned: 0,
        unique_users: 0,
      };
      initialStats[field] = 1;

      await this.create({
        bot_id: botId,
        chat_id: chatId,
        date: dateKey,
        ...initialStats,
      });
    }
  }

  async getStatisticsByDateRange(
    botId: string,
    chatId: number,
    startDate: Date,
    endDate: Date
  ): Promise<ChatStatistics[]> {
    return await this.collection
      .find({
        bot_id: botId,
        chat_id: chatId,
        date: { $gte: startDate, $lte: endDate },
      })
      .sort({ date: 1 })
      .toArray();
  }

  async getAggregatedStatistics(
    botId: string,
    chatId: number,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    const pipeline = [
      {
        $match: {
          bot_id: botId,
          chat_id: chatId,
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          total_messages_processed: { $sum: "$messages_processed" },
          total_warnings_issued: { $sum: "$warnings_issued" },
          total_messages_deleted: { $sum: "$messages_deleted" },
          total_users_banned: { $sum: "$users_banned" },
          max_unique_users: { $max: "$unique_users" },
          days_count: { $sum: 1 },
        },
      },
    ];

    const result = await this.collection.aggregate(pipeline).toArray();
    return (
      result[0] || {
        total_messages_processed: 0,
        total_warnings_issued: 0,
        total_messages_deleted: 0,
        total_users_banned: 0,
        max_unique_users: 0,
        days_count: 0,
      }
    );
  }
}
