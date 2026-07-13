import { and, eq, gte, lte, desc, countDistinct, sql, inArray, lt } from "drizzle-orm";
import { getDatabaseConnection } from "../connection";
import {
  ModerationAction,
  CreateModerationActionRequest,
  type ModerationActionType,
} from "../models/moderation-action";
import { moderationActions } from "../schema";
import { toModerationAction } from "../mappers";

export class ModerationActionRepository {
  private get db() {
    return getDatabaseConnection().getDb();
  }

  async create(
    actionData: CreateModerationActionRequest
  ): Promise<ModerationAction> {
    const [row] = await this.db
      .insert(moderationActions)
      .values({
        botId: actionData.bot_id,
        chatId: actionData.chat_id,
        userId: actionData.user_id,
        messageId: actionData.message_id,
        actionType: actionData.action_type,
        ruleViolated: actionData.rule_violated,
        aiConfidence: actionData.ai_confidence,
        aiReasoning: actionData.ai_reasoning,
        timestamp: actionData.timestamp,
        moderatorBotId: actionData.moderator_bot_id,
      })
      .returning();

    return toModerationAction(row);
  }

  async getRecentActions(
    botId: string,
    chatId: number,
    limit: number = 50
  ): Promise<ModerationAction[]> {
    const rows = await this.db
      .select()
      .from(moderationActions)
      .where(
        and(
          eq(moderationActions.botId, botId),
          eq(moderationActions.chatId, chatId)
        )
      )
      .orderBy(desc(moderationActions.timestamp))
      .limit(limit);

    return rows.map(toModerationAction);
  }

  async getActionsByUser(
    botId: string,
    chatId: number,
    userId: number,
    limit: number = 20
  ): Promise<ModerationAction[]> {
    const rows = await this.db
      .select()
      .from(moderationActions)
      .where(
        and(
          eq(moderationActions.botId, botId),
          eq(moderationActions.chatId, chatId),
          eq(moderationActions.userId, userId)
        )
      )
      .orderBy(desc(moderationActions.timestamp))
      .limit(limit);

    return rows.map(toModerationAction);
  }

  async getActionsByType(
    botId: string,
    chatId: number,
    actionType: ModerationActionType,
    limit: number = 50
  ): Promise<ModerationAction[]> {
    const rows = await this.db
      .select()
      .from(moderationActions)
      .where(
        and(
          eq(moderationActions.botId, botId),
          eq(moderationActions.chatId, chatId),
          eq(moderationActions.actionType, actionType)
        )
      )
      .orderBy(desc(moderationActions.timestamp))
      .limit(limit);

    return rows.map(toModerationAction);
  }

  async getActionsByDateRange(
    botId: string,
    chatId: number,
    startDate: Date,
    endDate: Date
  ): Promise<ModerationAction[]> {
    const conditions = [
      eq(moderationActions.botId, botId),
      gte(moderationActions.timestamp, startDate),
      lte(moderationActions.timestamp, endDate),
    ];

    if (chatId !== 0) {
      conditions.push(eq(moderationActions.chatId, chatId));
    }

    const rows = await this.db
      .select()
      .from(moderationActions)
      .where(and(...conditions))
      .orderBy(desc(moderationActions.timestamp));

    return rows.map(toModerationAction);
  }

  async getActionCount(
    botId: string,
    chatId: number,
    actionType?: ModerationActionType,
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    const conditions = [
      eq(moderationActions.botId, botId),
      eq(moderationActions.chatId, chatId),
    ];

    if (actionType) {
      conditions.push(eq(moderationActions.actionType, actionType));
    }
    if (startDate && endDate) {
      conditions.push(gte(moderationActions.timestamp, startDate));
      conditions.push(lte(moderationActions.timestamp, endDate));
    }

    const [result] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(moderationActions)
      .where(and(...conditions));

    return result?.count ?? 0;
  }

  async getActionsByBot(
    botId: string,
    limit: number = 50
  ): Promise<ModerationAction[]> {
    const rows = await this.db
      .select()
      .from(moderationActions)
      .where(eq(moderationActions.botId, botId))
      .orderBy(desc(moderationActions.timestamp))
      .limit(limit);

    return rows.map(toModerationAction);
  }

  async getUniqueUsersWithActions(
    botId: string,
    chatId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    const conditions = [
      eq(moderationActions.botId, botId),
      eq(moderationActions.chatId, chatId),
    ];

    if (startDate && endDate) {
      conditions.push(gte(moderationActions.timestamp, startDate));
      conditions.push(lte(moderationActions.timestamp, endDate));
    }

    const [result] = await this.db
      .select({ count: countDistinct(moderationActions.userId) })
      .from(moderationActions)
      .where(and(...conditions));

    return Number(result?.count ?? 0);
  }

  async getRecentByBotIds(
    botIds: string[],
    limit: number = 20
  ): Promise<ModerationAction[]> {
    if (botIds.length === 0) {
      return [];
    }

    const rows = await this.db
      .select()
      .from(moderationActions)
      .where(inArray(moderationActions.botId, botIds))
      .orderBy(desc(moderationActions.timestamp))
      .limit(limit);

    return rows.map(toModerationAction);
  }

  async getActionBreakdownByBotIds(
    botIds: string[],
    startDate: Date,
    endDate: Date
  ): Promise<{ warning: number; delete: number; ban: number }> {
    if (botIds.length === 0) {
      return { warning: 0, delete: 0, ban: 0 };
    }

    const rows = await this.db
      .select({
        action_type: moderationActions.actionType,
        count: sql<number>`count(*)::int`,
      })
      .from(moderationActions)
      .where(
        and(
          inArray(moderationActions.botId, botIds),
          gte(moderationActions.timestamp, startDate),
          lte(moderationActions.timestamp, endDate)
        )
      )
      .groupBy(moderationActions.actionType);

    const breakdown = { warning: 0, delete: 0, ban: 0 };
    for (const row of rows) {
      if (
        row.action_type === "warning" ||
        row.action_type === "delete" ||
        row.action_type === "ban"
      ) {
        breakdown[row.action_type] = row.count;
      }
    }
    return breakdown;
  }

  async deleteOlderThan(cutoff: Date): Promise<number> {
    const deleted = await this.db
      .delete(moderationActions)
      .where(lt(moderationActions.createdAt, cutoff))
      .returning({ id: moderationActions.id });

    return deleted.length;
  }
}
