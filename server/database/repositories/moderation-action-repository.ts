import { and, eq, gte, lte, desc, countDistinct, sql } from "drizzle-orm";
import { getDatabaseConnection } from "../connection";
import {
  ModerationAction,
  CreateModerationActionRequest,
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
    actionType: "warning" | "delete" | "ban",
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
    actionType?: "warning" | "delete" | "ban",
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
}
