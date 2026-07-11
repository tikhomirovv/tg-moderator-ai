import { and, eq, gte, lte, desc, asc, inArray, ne, sql } from "drizzle-orm";
import { getDatabaseConnection } from "../connection";
import {
  UserMessage,
  CreateUserMessageRequest,
} from "../models/user-message";
import { userMessages } from "../schema";
import { toUserMessage } from "../mappers";
import { selectOldestMessageIdsToPrune } from "../../core/chat-history";

export class UserMessageRepository {
  private get db() {
    return getDatabaseConnection().getDb();
  }

  async create(messageData: CreateUserMessageRequest): Promise<UserMessage> {
    const [row] = await this.db
      .insert(userMessages)
      .values({
        botId: messageData.bot_id,
        chatId: messageData.chat_id,
        userId: messageData.user_id,
        messageId: messageData.message_id,
        text: messageData.text,
        timestamp: messageData.timestamp,
        isDeleted: false,
      })
      .returning();

    return toUserMessage(row);
  }

  async pruneOldestMessages(
    botId: string,
    chatId: number,
    userId: number,
    maxMessages: number
  ): Promise<void> {
    const rows = await this.db
      .select({ id: userMessages.id })
      .from(userMessages)
      .where(
        and(
          eq(userMessages.botId, botId),
          eq(userMessages.chatId, chatId),
          eq(userMessages.userId, userId)
        )
      )
      .orderBy(asc(userMessages.timestamp), asc(userMessages.id));

    const idsToDelete = selectOldestMessageIdsToPrune(
      rows.map((row) => row.id),
      maxMessages
    );

    if (idsToDelete.length === 0) {
      return;
    }

    await this.db
      .delete(userMessages)
      .where(inArray(userMessages.id, idsToDelete));
  }

  async findByMessageId(
    botId: string,
    chatId: number,
    messageId: number
  ): Promise<UserMessage | null> {
    const [row] = await this.db
      .select()
      .from(userMessages)
      .where(
        and(
          eq(userMessages.botId, botId),
          eq(userMessages.chatId, chatId),
          eq(userMessages.messageId, messageId)
        )
      )
      .limit(1);

    return row ? toUserMessage(row) : null;
  }

  async getRecentMessages(
    botId: string,
    chatId: number,
    userId: number,
    limit: number = 10,
    options?: { excludeMessageId?: number }
  ): Promise<UserMessage[]> {
    const conditions = [
      eq(userMessages.botId, botId),
      eq(userMessages.chatId, chatId),
      eq(userMessages.userId, userId),
    ];

    if (options?.excludeMessageId !== undefined) {
      conditions.push(ne(userMessages.messageId, options.excludeMessageId));
    }

    const rows = await this.db
      .select()
      .from(userMessages)
      .where(and(...conditions))
      .orderBy(desc(userMessages.timestamp))
      .limit(limit);

    return rows.map(toUserMessage).reverse();
  }

  async markAsDeleted(
    botId: string,
    chatId: number,
    messageId: number,
    reason: string
  ): Promise<boolean> {
    const updated = await this.db
      .update(userMessages)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
        deletedReason: reason,
      })
      .where(
        and(
          eq(userMessages.botId, botId),
          eq(userMessages.chatId, chatId),
          eq(userMessages.messageId, messageId)
        )
      )
      .returning({ id: userMessages.id });

    return updated.length > 0;
  }

  async getMessagesByDateRange(
    botId: string,
    chatId: number,
    startDate: Date,
    endDate: Date
  ): Promise<UserMessage[]> {
    const conditions = [
      eq(userMessages.botId, botId),
      gte(userMessages.timestamp, startDate),
      lte(userMessages.timestamp, endDate),
    ];

    if (chatId !== 0) {
      conditions.push(eq(userMessages.chatId, chatId));
    }

    const rows = await this.db
      .select()
      .from(userMessages)
      .where(and(...conditions))
      .orderBy(desc(userMessages.timestamp));

    return rows.map(toUserMessage);
  }

  async getDeletedMessages(
    botId: string,
    chatId: number,
    limit: number = 50
  ): Promise<UserMessage[]> {
    const rows = await this.db
      .select()
      .from(userMessages)
      .where(
        and(
          eq(userMessages.botId, botId),
          eq(userMessages.chatId, chatId),
          eq(userMessages.isDeleted, true)
        )
      )
      .orderBy(desc(userMessages.deletedAt))
      .limit(limit);

    return rows.map(toUserMessage);
  }

  async getMessageCount(
    botId: string,
    chatId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    const conditions = [
      eq(userMessages.botId, botId),
      eq(userMessages.chatId, chatId),
    ];

    if (startDate && endDate) {
      conditions.push(gte(userMessages.timestamp, startDate));
      conditions.push(lte(userMessages.timestamp, endDate));
    }

    const [result] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(userMessages)
      .where(and(...conditions));

    return result?.count ?? 0;
  }
}
