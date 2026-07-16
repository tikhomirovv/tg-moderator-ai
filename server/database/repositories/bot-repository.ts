import { eq, inArray, and, sql } from "drizzle-orm";
import { getDatabaseConnection } from "../connection";
import {
  Bot,
  CreateBotInput,
  UpdateBotRequest,
  BotResponse,
  Chat,
} from "../models/bot";
import { bots, chats, rules } from "../schema";
import { toBot, toBotResponse, toChat } from "../mappers";
import { BotMemberRepository } from "./bot-member-repository";

type IncomingChat = {
  chat_id: number;
  name: string;
  silent_mode?: boolean;
};

export class BotRepository {
  private get db() {
    return getDatabaseConnection().getDb();
  }

  private async loadRuleCountsByInternalChatId(
    botId: string,
    internalChatIds: number[]
  ): Promise<Map<number, number>> {
    const counts = new Map<number, number>();
    if (internalChatIds.length === 0) {
      return counts;
    }

    const rows = await this.db
      .select({
        chatId: rules.chatId,
        count: sql<number>`count(*)::int`,
      })
      .from(rules)
      .where(
        and(eq(rules.botId, botId), inArray(rules.chatId, internalChatIds))
      )
      .groupBy(rules.chatId);

    for (const row of rows) {
      counts.set(row.chatId, row.count);
    }

    return counts;
  }

  private async loadChatsForBot(botId: string): Promise<Chat[]> {
    const chatRows = await this.db
      .select()
      .from(chats)
      .where(eq(chats.botId, botId));

    if (chatRows.length === 0) {
      return [];
    }

    const ruleCounts = await this.loadRuleCountsByInternalChatId(
      botId,
      chatRows.map((chat) => chat.id)
    );

    return chatRows.map((row) =>
      toChat(row, ruleCounts.get(row.id) ?? 0)
    );
  }

  private async syncChats(botId: string, chatList: IncomingChat[]): Promise<void> {
    const existing = await this.db
      .select()
      .from(chats)
      .where(eq(chats.botId, botId));

    const existingByTelegramId = new Map(
      existing.map((chat) => [chat.chatId, chat])
    );
    const incomingIds = new Set(chatList.map((chat) => chat.chat_id));

    for (const chat of existing) {
      if (!incomingIds.has(chat.chatId)) {
        await this.db.delete(chats).where(eq(chats.id, chat.id));
      }
    }

    for (const chat of chatList) {
      const found = existingByTelegramId.get(chat.chat_id);
      if (found) {
        await this.db
          .update(chats)
          .set({
            name: chat.name,
            silentMode: chat.silent_mode ?? false,
          })
          .where(eq(chats.id, found.id));
      } else {
        await this.db.insert(chats).values({
          botId,
          chatId: chat.chat_id,
          name: chat.name,
          silentMode: chat.silent_mode ?? false,
        });
      }
    }
  }

  async findAllForUser(userId: string): Promise<BotResponse[]> {
    const memberRepo = new BotMemberRepository();
    const memberships = await memberRepo.findBotsWithRolesForUser(userId);
    const result: BotResponse[] = [];

    for (const { bot: row, role } of memberships) {
      const chatList = await this.loadChatsForBot(row.id);
      result.push({
        ...toBotResponse(row, chatList),
        my_role: role as BotResponse["my_role"],
      });
    }

    return result;
  }

  async findById(id: string): Promise<BotResponse | null> {
    const [row] = await this.db
      .select()
      .from(bots)
      .where(eq(bots.id, id))
      .limit(1);
    if (!row) return null;

    const chatList = await this.loadChatsForBot(row.id);
    return toBotResponse(row, chatList);
  }

  async findByIdWithToken(id: string): Promise<Bot | null> {
    const [row] = await this.db.select().from(bots).where(eq(bots.id, id)).limit(1);
    if (!row) return null;

    const chatList = await this.loadChatsForBot(row.id);
    return toBot(row, chatList);
  }

  async create(
    ownerUserId: string,
    botData: CreateBotInput
  ): Promise<BotResponse> {
    const now = new Date();
    const [row] = await this.db
      .insert(bots)
      .values({
        id: botData.id,
        ownerUserId,
        name: botData.name,
        token: botData.token,
        photoFileId: botData.photo_file_id ?? null,
        telegramBotId: botData.telegram_bot_id ?? null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    const memberRepo = new BotMemberRepository();
    await memberRepo.addMember(botData.id, ownerUserId, "owner");

    await this.syncChats(botData.id, botData.chats ?? []);
    const chatList = await this.loadChatsForBot(botData.id);
    return {
      ...toBotResponse(row, chatList),
      my_role: "owner",
    };
  }

  async update(
    id: string,
    updateData: UpdateBotRequest
  ): Promise<BotResponse | null> {
    const { chats: chatList, ...botFields } = updateData;
    const updateValues: Partial<typeof bots.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (botFields.name !== undefined) updateValues.name = botFields.name;
    if (botFields.token !== undefined) updateValues.token = botFields.token;
    if (botFields.is_active !== undefined) {
      updateValues.isActive = botFields.is_active;
    }
    if (botFields.warning_message_template !== undefined) {
      updateValues.warningMessageTemplate = botFields.warning_message_template;
    }
    if (botFields.ban_message_template !== undefined) {
      updateValues.banMessageTemplate = botFields.ban_message_template;
    }

    const [row] = await this.db
      .update(bots)
      .set(updateValues)
      .where(eq(bots.id, id))
      .returning();

    if (!row) return null;

    if (chatList !== undefined) {
      await this.syncChats(id, chatList);
    }

    const loadedChats = await this.loadChatsForBot(id);
    return toBotResponse(row, loadedChats);
  }

  async updateAvatarMetadata(
    id: string,
    data: {
      photoFileId?: string | null;
      telegramBotId?: number | null;
    }
  ): Promise<void> {
    const updateValues: Partial<typeof bots.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (data.photoFileId !== undefined) {
      updateValues.photoFileId = data.photoFileId;
    }
    if (data.telegramBotId !== undefined) {
      updateValues.telegramBotId = data.telegramBotId;
    }

    await this.db.update(bots).set(updateValues).where(eq(bots.id, id));
  }

  async findWebhookSecret(id: string): Promise<string | null> {
    const [row] = await this.db
      .select({ webhookSecret: bots.webhookSecret })
      .from(bots)
      .where(eq(bots.id, id))
      .limit(1);

    return row?.webhookSecret ?? null;
  }

  async setWebhookSecret(id: string, secret: string): Promise<void> {
    await this.db
      .update(bots)
      .set({
        webhookSecret: secret,
        updatedAt: new Date(),
      })
      .where(eq(bots.id, id));
  }

  async getCreditBalance(id: string): Promise<number> {
    const [row] = await this.db
      .select({ creditBalance: bots.creditBalance })
      .from(bots)
      .where(eq(bots.id, id))
      .limit(1);

    return row?.creditBalance ?? 0;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await this.db
      .delete(bots)
      .where(eq(bots.id, id))
      .returning({ id: bots.id });
    return deleted.length > 0;
  }

  async findActive(): Promise<Bot[]> {
    const botRows = await this.db
      .select()
      .from(bots)
      .where(eq(bots.isActive, true));

    const result: Bot[] = [];
    for (const row of botRows) {
      const chatList = await this.loadChatsForBot(row.id);
      result.push(toBot(row, chatList));
    }
    return result;
  }

  async getActiveBotTokens(): Promise<Array<{ botId: string; token: string }>> {
    const activeBots = await this.db
      .select()
      .from(bots)
      .where(and(eq(bots.isActive, true), sql`${bots.token} IS NOT NULL AND ${bots.token} <> ''`));

    return activeBots
      .filter((bot) => bot.token)
      .map((bot) => ({
        botId: bot.id,
        token: bot.token!,
      }));
  }
}
