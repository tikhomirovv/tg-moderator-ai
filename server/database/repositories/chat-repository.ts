import { and, eq } from "drizzle-orm";
import { getDatabaseConnection } from "../connection";
import { chats } from "../schema";

export type BotChatRow = typeof chats.$inferSelect;

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
}
