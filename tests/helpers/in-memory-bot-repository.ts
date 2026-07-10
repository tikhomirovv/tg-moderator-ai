import type {
  Bot,
  BotResponse,
  Chat,
  CreateBotRequest,
  UpdateBotRequest,
} from "../../server/database/models/bot";

export class InMemoryBotRepository {
  private bots = new Map<string, Bot>();

  async findAll(workspaceId: string): Promise<BotResponse[]> {
    return [...this.bots.values()]
      .filter((bot) => bot.workspace_id === workspaceId)
      .map((bot) => this.toResponse(bot));
  }

  async findById(id: string, workspaceId: string): Promise<BotResponse | null> {
    const bot = this.bots.get(id);
    if (!bot || bot.workspace_id !== workspaceId) {
      return null;
    }
    return this.toResponse(bot);
  }

  async findByIdWithToken(id: string): Promise<Bot | null> {
    const bot = this.bots.get(id);
    return bot ? { ...bot, chats: bot.chats.map((chat) => ({ ...chat })) } : null;
  }

  async create(workspaceId: string, botData: CreateBotRequest): Promise<BotResponse> {
    const now = new Date();
    const bot: Bot = {
      id: botData.id,
      name: botData.name,
      token: botData.token,
      workspace_id: workspaceId,
      is_active: true,
      chats: botData.chats.map((chat) => ({ ...chat, rules: [...chat.rules] })),
      created_at: now,
      updated_at: now,
    };
    this.bots.set(botData.id, bot);
    return this.toResponse(bot);
  }

  async update(
    id: string,
    workspaceId: string,
    updateData: UpdateBotRequest
  ): Promise<BotResponse | null> {
    const bot = this.bots.get(id);
    if (!bot || bot.workspace_id !== workspaceId) {
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
        ...chat,
        rules: [...chat.rules],
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

  private toResponse(bot: Bot): BotResponse {
    return {
      id: bot.id,
      name: bot.name,
      chats: bot.chats.map((chat) => ({ ...chat, rules: [...chat.rules] })),
      is_active: bot.is_active,
      created_at: bot.created_at,
      updated_at: bot.updated_at,
    };
  }
}

export type InMemoryBotRepositoryChat = Chat;
