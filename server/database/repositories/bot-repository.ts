import { Collection } from "mongodb";
import { getDatabaseConnection } from "../connection";
import {
  Bot,
  CreateBotRequest,
  UpdateBotRequest,
  BotResponse,
} from "../models/bot";

export class BotRepository {
  private collection: Collection<Bot>;

  constructor() {
    const db = getDatabaseConnection().getDb();
    this.collection = db.collection<Bot>("bots");
  }

  async findAll(): Promise<BotResponse[]> {
    const bots = await this.collection.find({}).toArray();
    // Скрываем токены в API ответах
    return bots.map((bot) => {
      const { token, ...botWithoutToken } = bot;
      return botWithoutToken as BotResponse;
    });
  }

  async findById(id: string): Promise<BotResponse | null> {
    const bot = await this.collection.findOne({ id });
    if (!bot) return null;

    // Скрываем токен в API ответе
    const { token, ...botWithoutToken } = bot;
    return botWithoutToken as BotResponse;
  }

  // Метод для получения бота с токеном (для внутреннего использования)
  async findByIdWithToken(id: string): Promise<Bot | null> {
    return await this.collection.findOne({ id });
  }

  async create(botData: CreateBotRequest): Promise<BotResponse> {
    const now = new Date();
    const bot: Bot = {
      ...botData,
      is_active: true,
      created_at: now,
      updated_at: now,
    };

    const result = await this.collection.insertOne(bot);
    const createdBot = { ...bot, _id: result.insertedId };

    // Скрываем токен в ответе
    const { token, ...botWithoutToken } = createdBot;
    return botWithoutToken as BotResponse;
  }

  async update(
    id: string,
    updateData: UpdateBotRequest
  ): Promise<BotResponse | null> {
    const updateDoc = {
      ...updateData,
      updated_at: new Date(),
    };

    const result = await this.collection.findOneAndUpdate(
      { id },
      { $set: updateDoc },
      { returnDocument: "after" }
    );

    if (!result) return null;

    // Скрываем токен в ответе
    const { token, ...botWithoutToken } = result;
    return botWithoutToken as BotResponse;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.collection.deleteOne({ id });
    return result.deletedCount > 0;
  }

  async findActive(): Promise<Bot[]> {
    // Возвращаем полные данные для инициализации ботов
    return await this.collection.find({ is_active: true }).toArray();
  }

  // Метод для получения токенов активных ботов
  async getActiveBotTokens(): Promise<Array<{ botId: string; token: string }>> {
    const activeBots = await this.collection
      .find({
        is_active: true,
        token: { $exists: true, $ne: "" },
      })
      .toArray();

    return activeBots.map((bot) => ({
      botId: bot.id,
      token: bot.token!,
    }));
  }
}
