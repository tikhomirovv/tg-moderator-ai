import { and, eq, gte, lte, asc, sql } from "drizzle-orm";
import { getDatabaseConnection } from "../connection";
import {
  ChatStatistics,
  CreateChatStatisticsRequest,
  UpdateChatStatisticsRequest,
} from "../models/chat-statistics";
import { chatStatistics } from "../schema";
import { toChatStatistics, toDateKey } from "../mappers";

export class ChatStatisticsRepository {
  private get db() {
    return getDatabaseConnection().getDb();
  }

  async findByDate(
    botId: string,
    chatId: number,
    date: Date
  ): Promise<ChatStatistics | null> {
    const [row] = await this.db
      .select()
      .from(chatStatistics)
      .where(
        and(
          eq(chatStatistics.botId, botId),
          eq(chatStatistics.chatId, chatId),
          eq(chatStatistics.date, toDateKey(date))
        )
      )
      .limit(1);

    return row ? toChatStatistics(row) : null;
  }

  async create(
    statsData: CreateChatStatisticsRequest
  ): Promise<ChatStatistics> {
    const now = new Date();
    const [row] = await this.db
      .insert(chatStatistics)
      .values({
        botId: statsData.bot_id,
        chatId: statsData.chat_id,
        date: toDateKey(statsData.date),
        messagesProcessed: statsData.messages_processed ?? 0,
        warningsIssued: statsData.warnings_issued ?? 0,
        messagesDeleted: statsData.messages_deleted ?? 0,
        usersBanned: statsData.users_banned ?? 0,
        uniqueUsers: statsData.unique_users ?? 0,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return toChatStatistics(row);
  }

  async update(
    botId: string,
    chatId: number,
    date: Date,
    updateData: UpdateChatStatisticsRequest
  ): Promise<ChatStatistics | null> {
    const updateValues: Partial<typeof chatStatistics.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (updateData.messages_processed !== undefined) {
      updateValues.messagesProcessed = updateData.messages_processed;
    }
    if (updateData.warnings_issued !== undefined) {
      updateValues.warningsIssued = updateData.warnings_issued;
    }
    if (updateData.messages_deleted !== undefined) {
      updateValues.messagesDeleted = updateData.messages_deleted;
    }
    if (updateData.users_banned !== undefined) {
      updateValues.usersBanned = updateData.users_banned;
    }
    if (updateData.unique_users !== undefined) {
      updateValues.uniqueUsers = updateData.unique_users;
    }

    const [row] = await this.db
      .update(chatStatistics)
      .set(updateValues)
      .where(
        and(
          eq(chatStatistics.botId, botId),
          eq(chatStatistics.chatId, chatId),
          eq(chatStatistics.date, toDateKey(date))
        )
      )
      .returning();

    return row ? toChatStatistics(row) : null;
  }

  async incrementField(
    botId: string,
    chatId: number,
    date: Date,
    field: keyof UpdateChatStatisticsRequest
  ): Promise<void> {
    const dateKey = toDateKey(date);
    const now = new Date();

    const increment = async (
      values: Partial<typeof chatStatistics.$inferInsert>
    ) => {
      const updated = await this.db
        .update(chatStatistics)
        .set({ ...values, updatedAt: now })
        .where(
          and(
            eq(chatStatistics.botId, botId),
            eq(chatStatistics.chatId, chatId),
            eq(chatStatistics.date, dateKey)
          )
        )
        .returning({ id: chatStatistics.id });

      return updated.length > 0;
    };

    let updated = false;

    switch (field) {
      case "messages_processed":
        updated = await increment({
          messagesProcessed: sql`${chatStatistics.messagesProcessed} + 1`,
        });
        break;
      case "warnings_issued":
        updated = await increment({
          warningsIssued: sql`${chatStatistics.warningsIssued} + 1`,
        });
        break;
      case "messages_deleted":
        updated = await increment({
          messagesDeleted: sql`${chatStatistics.messagesDeleted} + 1`,
        });
        break;
      case "users_banned":
        updated = await increment({
          usersBanned: sql`${chatStatistics.usersBanned} + 1`,
        });
        break;
      case "unique_users":
        updated = await increment({
          uniqueUsers: sql`${chatStatistics.uniqueUsers} + 1`,
        });
        break;
    }

    if (!updated) {
      await this.create({
        bot_id: botId,
        chat_id: chatId,
        date,
        messages_processed: field === "messages_processed" ? 1 : 0,
        warnings_issued: field === "warnings_issued" ? 1 : 0,
        messages_deleted: field === "messages_deleted" ? 1 : 0,
        users_banned: field === "users_banned" ? 1 : 0,
        unique_users: field === "unique_users" ? 1 : 0,
      });
    }
  }

  async getStatisticsByDateRange(
    botId: string,
    chatId: number,
    startDate: Date,
    endDate: Date
  ): Promise<ChatStatistics[]> {
    const rows = await this.db
      .select()
      .from(chatStatistics)
      .where(
        and(
          eq(chatStatistics.botId, botId),
          eq(chatStatistics.chatId, chatId),
          gte(chatStatistics.date, toDateKey(startDate)),
          lte(chatStatistics.date, toDateKey(endDate))
        )
      )
      .orderBy(asc(chatStatistics.date));

    return rows.map(toChatStatistics);
  }

  async getAggregatedStatistics(
    botId: string,
    chatId: number,
    startDate: Date,
    endDate: Date
  ): Promise<{
    total_messages_processed: number;
    total_warnings_issued: number;
    total_messages_deleted: number;
    total_users_banned: number;
    max_unique_users: number;
    days_count: number;
  }> {
    const [result] = await this.db
      .select({
        total_messages_processed: sql<number>`coalesce(sum(${chatStatistics.messagesProcessed}), 0)::int`,
        total_warnings_issued: sql<number>`coalesce(sum(${chatStatistics.warningsIssued}), 0)::int`,
        total_messages_deleted: sql<number>`coalesce(sum(${chatStatistics.messagesDeleted}), 0)::int`,
        total_users_banned: sql<number>`coalesce(sum(${chatStatistics.usersBanned}), 0)::int`,
        max_unique_users: sql<number>`coalesce(max(${chatStatistics.uniqueUsers}), 0)::int`,
        days_count: sql<number>`count(*)::int`,
      })
      .from(chatStatistics)
      .where(
        and(
          eq(chatStatistics.botId, botId),
          eq(chatStatistics.chatId, chatId),
          gte(chatStatistics.date, toDateKey(startDate)),
          lte(chatStatistics.date, toDateKey(endDate))
        )
      );

    return (
      result ?? {
        total_messages_processed: 0,
        total_warnings_issued: 0,
        total_messages_deleted: 0,
        total_users_banned: 0,
        max_unique_users: 0,
        days_count: 0,
      }
    );
  }
}
