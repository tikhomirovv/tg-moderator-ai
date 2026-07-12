import type {
  Bot,
  BotResponse,
  CreateBotRequest,
  UpdateBotRequest,
} from "../../server/database/models/bot";

export class InMemoryBotRepository {
  private bots = new Map<string, Bot>();
  private memberRoles = new Map<string, "owner" | "manager">();

  private memberKey(userId: string, botId: string) {
    return `${userId}:${botId}`;
  }

  async findAllForUser(userId: string): Promise<BotResponse[]> {
    return [...this.bots.values()]
      .filter((bot) => this.memberRoles.has(this.memberKey(userId, bot.id)))
      .map((bot) => this.toResponse(bot, userId));
  }

  async findById(id: string): Promise<BotResponse | null> {
    const bot = this.bots.get(id);
    return bot ? this.toResponse(bot) : null;
  }

  async addMember(
    userId: string,
    botId: string,
    role: "owner" | "manager"
  ): Promise<void> {
    this.memberRoles.set(this.memberKey(userId, botId), role);
  }

  async findByIdWithToken(id: string): Promise<Bot | null> {
    const bot = this.bots.get(id);
    return bot ? { ...bot, chats: bot.chats.map((chat) => ({ ...chat })) } : null;
  }

  async create(ownerUserId: string, botData: CreateBotRequest): Promise<BotResponse> {
    const now = new Date();
    const bot: Bot = {
      id: botData.id,
      name: botData.name,
      token: botData.token,
      owner_user_id: ownerUserId,
      is_active: true,
      chats: botData.chats.map((chat) => ({
        chat_id: chat.chat_id,
        name: chat.name,
        silent_mode: chat.silent_mode ?? false,
        rules_count: 0,
      })),
      created_at: now,
      updated_at: now,
    };
    this.bots.set(botData.id, bot);
    this.memberRoles.set(this.memberKey(ownerUserId, botData.id), "owner");
    return this.toResponse(bot, ownerUserId);
  }

  async update(id: string, updateData: UpdateBotRequest): Promise<BotResponse | null> {
    const bot = this.bots.get(id);
    if (!bot) {
      return null;
    }

    if (updateData.name !== undefined) {
      bot.name = updateData.name;
    }
    if (updateData.token !== undefined) {
      bot.token = updateData.token;
    }
    if (updateData.is_active !== undefined) {
      bot.is_active = updateData.is_active;
    }
    if (updateData.chats !== undefined) {
      bot.chats = updateData.chats.map((chat) => ({
        chat_id: chat.chat_id,
        name: chat.name,
        silent_mode: chat.silent_mode ?? false,
        rules_count: 0,
      }));
    }
    bot.updated_at = new Date();

    return this.toResponse(bot);
  }

  async setWebhookSecret(id: string, secret: string): Promise<void> {
    const bot = this.bots.get(id);
    if (bot) {
      bot.webhook_secret = secret;
    }
  }

  private toResponse(bot: Bot, userId?: string): BotResponse {
    const myRole = userId
      ? this.memberRoles.get(this.memberKey(userId, bot.id))
      : undefined;

    return {
      id: bot.id,
      name: bot.name,
      chats: bot.chats.map((chat) => ({ ...chat })),
      is_active: bot.is_active,
      my_role: myRole,
      created_at: bot.created_at,
      updated_at: bot.updated_at,
    };
  }
}
