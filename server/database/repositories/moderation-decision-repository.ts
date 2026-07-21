import { and, desc, eq, lt, sql } from "drizzle-orm";
import { getDatabaseConnection } from "../connection";
import {
  CreateModerationDecisionRequest,
  ModerationDecision,
} from "../models/moderation-decision";
import { moderationDecisions } from "../schema";
import { toModerationDecision } from "../mappers";

export type ListDecisionsOptions = {
  page: number;
  limit: number;
};

export type PaginatedDecisions = {
  items: ModerationDecision[];
  total: number;
};

export class ModerationDecisionRepository {
  private get db() {
    return getDatabaseConnection().getDb();
  }

  async create(
    data: CreateModerationDecisionRequest
  ): Promise<ModerationDecision> {
    const [row] = await this.db
      .insert(moderationDecisions)
      .values({
        botId: data.bot_id,
        chatId: data.chat_id,
        userId: data.user_id,
        messageId: data.message_id,
        messageText: data.message_text,
        violationDetected: data.violation_detected,
        ruleViolated: data.rule_violated,
        aiConfidence: data.ai_confidence,
        aiReasoning: data.ai_reasoning,
        rulesApplied: data.rules_applied,
        timestamp: data.timestamp,
      })
      .returning();

    return toModerationDecision(row);
  }

  async listByBot(
    botId: string,
    options: ListDecisionsOptions
  ): Promise<PaginatedDecisions> {
    const page = Math.max(1, options.page);
    const limit = Math.min(100, Math.max(1, options.limit));
    const offset = (page - 1) * limit;

    const where = eq(moderationDecisions.botId, botId);

    const [countRow] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(moderationDecisions)
      .where(where);

    const rows = await this.db
      .select()
      .from(moderationDecisions)
      .where(where)
      .orderBy(desc(moderationDecisions.timestamp), desc(moderationDecisions.id))
      .limit(limit)
      .offset(offset);

    return {
      items: rows.map(toModerationDecision),
      total: countRow?.count ?? 0,
    };
  }

  async deleteOlderThan(cutoff: Date): Promise<number> {
    const deleted = await this.db
      .delete(moderationDecisions)
      .where(lt(moderationDecisions.createdAt, cutoff))
      .returning({ id: moderationDecisions.id });

    return deleted.length;
  }
}
