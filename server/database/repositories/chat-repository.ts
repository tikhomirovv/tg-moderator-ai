import { and, eq } from "drizzle-orm";
import { getDatabaseConnection } from "../connection";
import { chats } from "../schema";
import type { ChatHealthStatus } from "../models/bot";

export type BotChatRow = typeof chats.$inferSelect;

export type UpsertActivatedChatInput = {
  botId: string;
  telegramChatId: number;
  name: string;
  silentMode?: boolean;
  photoFileId?: string | null;
  telegramUsername?: string | null;
  healthStatus: ChatHealthStatus;
  healthMessage: string | null;
  healthCheckedAt: Date;
};

export class ChatRepository {
  private get db() {
    return getDatabaseConnection().getDb();
  }

  async findByTelegramChatId(
    botId: string,
    telegramChatId: number
  ): Promise<BotChatRow | null> {
    const [row] = await this.db
      .select()
      .from(chats)
      .where(and(eq(chats.botId, botId), eq(chats.chatId, telegramChatId)))
      .limit(1);

    return row ?? null;
  }

  async findByRowId(
    botId: string,
    chatRowId: number
  ): Promise<BotChatRow | null> {
    const [row] = await this.db
      .select()
      .from(chats)
      .where(and(eq(chats.botId, botId), eq(chats.id, chatRowId)))
      .limit(1);

    return row ?? null;
  }

  async upsertActivatedChat(
    input: UpsertActivatedChatInput
  ): Promise<BotChatRow> {
    const existing = await this.findByTelegramChatId(
      input.botId,
      input.telegramChatId
    );

    if (existing) {
      const [row] = await this.db
        .update(chats)
        .set({
          name: input.name,
          photoFileId: input.photoFileId ?? null,
          telegramUsername: input.telegramUsername ?? null,
          healthStatus: input.healthStatus,
          healthMessage: input.healthMessage,
          healthCheckedAt: input.healthCheckedAt,
        })
        .where(eq(chats.id, existing.id))
        .returning();

      return row;
    }

    const [row] = await this.db
      .insert(chats)
      .values({
        botId: input.botId,
        chatId: input.telegramChatId,
        name: input.name,
        silentMode: input.silentMode ?? false,
        photoFileId: input.photoFileId ?? null,
        telegramUsername: input.telegramUsername ?? null,
        healthStatus: input.healthStatus,
        healthMessage: input.healthMessage,
        healthCheckedAt: input.healthCheckedAt,
      })
      .returning();

    return row;
  }

  async updateHealth(
    botId: string,
    telegramChatId: number,
    health: {
      healthStatus: ChatHealthStatus;
      healthMessage: string | null;
      healthCheckedAt: Date;
      photoFileId?: string | null;
      telegramUsername?: string | null;
      name?: string;
    }
  ): Promise<BotChatRow | null> {
    const existing = await this.findByTelegramChatId(botId, telegramChatId);
    if (!existing) {
      return null;
    }

    const [row] = await this.db
      .update(chats)
      .set({
        healthStatus: health.healthStatus,
        healthMessage: health.healthMessage,
        healthCheckedAt: health.healthCheckedAt,
        ...(health.photoFileId !== undefined
          ? { photoFileId: health.photoFileId }
          : {}),
        ...(health.telegramUsername !== undefined
          ? { telegramUsername: health.telegramUsername }
          : {}),
        ...(health.name !== undefined ? { name: health.name } : {}),
      })
      .where(eq(chats.id, existing.id))
      .returning();

    return row ?? null;
  }
}
