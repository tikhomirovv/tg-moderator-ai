import { eq, inArray, and, gte, lte, desc, sql, countDistinct } from "drizzle-orm";
import { getDatabaseConnection } from "../connection";
import {
  Bot,
  CreateBotRequest,
  UpdateBotRequest,
  BotResponse,
  Chat,
} from "../models/bot";
import { bots, chats, chatRules } from "../schema";
import { toBot, toBotResponse, toChat } from "../mappers";

export class BotRepository {
  private get db() {
    return getDatabaseConnection().getDb();
  }

  private async loadChatsForBot(botId: string): Promise<Chat[]> {
    const chatRows = await this.db
      .select()
      .from(chats)
      .where(eq(chats.botId, botId));

    if (chatRows.length === 0) {
      return [];
    }

    const chatIds = chatRows.map((chat) => chat.id);
    const ruleRows = await this.db
      .select()
      .from(chatRules)
      .where(inArray(chatRules.chatId, chatIds));

    const rulesByChatId = new Map<number, string[]>();
    for (const row of ruleRows) {
      const existing = rulesByChatId.get(row.chatId) ?? [];
      existing.push(row.ruleId);
      rulesByChatId.set(row.chatId, existing);
    }

    return chatRows.map((row) => toChat(row, rulesByChatId.get(row.id) ?? []));
  }

  private async replaceChats(botId: string, chatList: Chat[]): Promise<void> {
    await this.db.delete(chats).where(eq(chats.botId, botId));

    for (const chat of chatList) {
      const [inserted] = await this.db
        .insert(chats)
        .values({
          botId,
          chatId: chat.chat_id,
          name: chat.name,
          warningsBeforeBan: chat.warnings_before_ban,
          autoDeleteViolations: chat.auto_delete_violations,
          silentMode: chat.silent_mode ?? false,
        })
        .returning({ id: chats.id });

      if (chat.rules.length > 0) {
        await this.db.insert(chatRules).values(
          chat.rules.map((ruleId) => ({
            chatId: inserted.id,
            ruleId,
          }))
        );
      }
    }
  }

  async findAll(workspaceId: string): Promise<BotResponse[]> {
    const botRows = await this.db
      .select()
      .from(bots)
      .where(eq(bots.workspaceId, workspaceId));
    const result: BotResponse[] = [];

    for (const row of botRows) {
      const chatList = await this.loadChatsForBot(row.id);
      result.push(toBotResponse(row, chatList));
    }

    return result;
  }

  async findById(id: string, workspaceId: string): Promise<BotResponse | null> {
    const [row] = await this.db
      .select()
      .from(bots)
      .where(and(eq(bots.id, id), eq(bots.workspaceId, workspaceId)))
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
    workspaceId: string,
    botData: CreateBotRequest
  ): Promise<BotResponse> {
    const now = new Date();
    const [row] = await this.db
      .insert(bots)
      .values({
        id: botData.id,
        workspaceId,
        name: botData.name,
        token: botData.token,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    await this.replaceChats(botData.id, botData.chats);
    const chatList = await this.loadChatsForBot(botData.id);
    return toBotResponse(row, chatList);
  }

  async update(
    id: string,
    workspaceId: string,
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

    const [row] = await this.db
      .update(bots)
      .set(updateValues)
      .where(and(eq(bots.id, id), eq(bots.workspaceId, workspaceId)))
      .returning();

    if (!row) return null;

    if (chatList !== undefined) {
      await this.replaceChats(id, chatList);
    }

    const loadedChats = await this.loadChatsForBot(id);
    return toBotResponse(row, loadedChats);
  }

  async delete(id: string, workspaceId: string): Promise<boolean> {
    const deleted = await this.db
      .delete(bots)
      .where(and(eq(bots.id, id), eq(bots.workspaceId, workspaceId)))
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
