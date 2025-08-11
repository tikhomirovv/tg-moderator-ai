import { Collection } from "mongodb";
import { getDatabaseConnection } from "../connection";
import {
  UserContext,
  CreateUserContextRequest,
  UpdateUserContextRequest,
} from "../models/user-context";

export class UserContextRepository {
  private collection: Collection<UserContext>;

  constructor() {
    const db = getDatabaseConnection().getDb();
    this.collection = db.collection<UserContext>("user_context");
  }

  async findByUser(
    botId: string,
    chatId: number,
    userId: number
  ): Promise<UserContext | null> {
    return await this.collection.findOne({
      bot_id: botId,
      chat_id: chatId,
      user_id: userId,
    });
  }

  async create(contextData: CreateUserContextRequest): Promise<UserContext> {
    const now = new Date();
    const context: UserContext = {
      ...contextData,
      warnings_count: 0,
      is_banned: false,
      last_activity: now,
      created_at: now,
      updated_at: now,
    };

    const result = await this.collection.insertOne(context);
    return { ...context, _id: result.insertedId.toString() };
  }

  async update(
    botId: string,
    chatId: number,
    userId: number,
    updateData: UpdateUserContextRequest
  ): Promise<UserContext | null> {
    const updateDoc = {
      ...updateData,
      updated_at: new Date(),
    };

    const result = await this.collection.findOneAndUpdate(
      { bot_id: botId, chat_id: chatId, user_id: userId },
      { $set: updateDoc },
      { returnDocument: "after" }
    );

    return result;
  }

  async incrementWarnings(
    botId: string,
    chatId: number,
    userId: number
  ): Promise<UserContext | null> {
    const result = await this.collection.findOneAndUpdate(
      { bot_id: botId, chat_id: chatId, user_id: userId },
      {
        $inc: { warnings_count: 1 },
        $set: {
          last_activity: new Date(),
          updated_at: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    return result;
  }

  async banUser(
    botId: string,
    chatId: number,
    userId: number,
    ruleId: string
  ): Promise<UserContext | null> {
    const result = await this.collection.findOneAndUpdate(
      { bot_id: botId, chat_id: chatId, user_id: userId },
      {
        $set: {
          is_banned: true,
          banned_at: new Date(),
          banned_by: ruleId,
          last_activity: new Date(),
          updated_at: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    return result;
  }

  async getOrCreate(
    botId: string,
    chatId: number,
    userId: number,
    userInfo?: { username?: string; first_name?: string; last_name?: string }
  ): Promise<UserContext> {
    let context = await this.findByUser(botId, chatId, userId);

    if (!context) {
      context = await this.create({
        bot_id: botId,
        chat_id: chatId,
        user_id: userId,
        ...userInfo,
      });
    } else if (userInfo) {
      // Обновляем информацию о пользователе если она изменилась
      context =
        (await this.update(botId, chatId, userId, {
          ...userInfo,
          last_activity: new Date(),
        })) || context;
    }

    return context;
  }

  async getBannedUsers(botId: string, chatId: number): Promise<UserContext[]> {
    return await this.collection
      .find({
        bot_id: botId,
        chat_id: chatId,
        is_banned: true,
      })
      .toArray();
  }

  async getActiveUsers(
    botId: string,
    chatId: number,
    hours: number = 24
  ): Promise<UserContext[]> {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return await this.collection
      .find({
        bot_id: botId,
        chat_id: chatId,
        last_activity: { $gte: cutoffDate },
        is_banned: false,
      })
      .toArray();
  }

  async getAllUsersByBot(botId: string): Promise<UserContext[]> {
    return await this.collection.find({ bot_id: botId }).toArray();
  }
}
