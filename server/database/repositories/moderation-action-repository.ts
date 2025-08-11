import { Collection } from "mongodb";
import { getDatabaseConnection } from "../connection";
import {
  ModerationAction,
  CreateModerationActionRequest,
} from "../models/moderation-action";

export class ModerationActionRepository {
  private collection: Collection<ModerationAction>;

  constructor() {
    const db = getDatabaseConnection().getDb();
    this.collection = db.collection<ModerationAction>("moderation_actions");
  }

  async create(
    actionData: CreateModerationActionRequest
  ): Promise<ModerationAction> {
    const now = new Date();
    const action: ModerationAction = {
      ...actionData,
      created_at: now,
    };

    const result = await this.collection.insertOne(action);
    return { ...action, _id: result.insertedId.toString() };
  }

  async getRecentActions(
    botId: string,
    chatId: number,
    limit: number = 50
  ): Promise<ModerationAction[]> {
    return await this.collection
      .find({
        bot_id: botId,
        chat_id: chatId,
      })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  }

  async getActionsByUser(
    botId: string,
    chatId: number,
    userId: number,
    limit: number = 20
  ): Promise<ModerationAction[]> {
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

  async getActionsByType(
    botId: string,
    chatId: number,
    actionType: "warning" | "delete" | "ban",
    limit: number = 50
  ): Promise<ModerationAction[]> {
    return await this.collection
      .find({
        bot_id: botId,
        chat_id: chatId,
        action_type: actionType,
      })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  }

  async getActionsByDateRange(
    botId: string,
    chatId: number,
    startDate: Date,
    endDate: Date
  ): Promise<ModerationAction[]> {
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

  async getActionCount(
    botId: string,
    chatId: number,
    actionType?: "warning" | "delete" | "ban",
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    const filter: any = { bot_id: botId, chat_id: chatId };

    if (actionType) {
      filter.action_type = actionType;
    }

    if (startDate && endDate) {
      filter.timestamp = { $gte: startDate, $lte: endDate };
    }

    return await this.collection.countDocuments(filter);
  }

  async getActionsByBot(
    botId: string,
    limit: number = 50
  ): Promise<ModerationAction[]> {
    return await this.collection
      .find({ bot_id: botId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  }

  async getUniqueUsersWithActions(
    botId: string,
    chatId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    const filter: any = { bot_id: botId, chat_id: chatId };

    if (startDate && endDate) {
      filter.timestamp = { $gte: startDate, $lte: endDate };
    }

    const result = await this.collection.distinct("user_id", filter);
    return result.length;
  }
}
