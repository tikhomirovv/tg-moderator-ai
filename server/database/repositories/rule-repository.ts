import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { getDatabaseConnection } from "../connection";
import { Rule, CreateRuleRequest, UpdateRuleRequest } from "../models/rule";
import { rules } from "../schema";
import { toRule } from "../mappers";

export class RuleRepository {
  private get db() {
    return getDatabaseConnection().getDb();
  }

  async findAllByChat(botId: string, chatInternalId: number): Promise<Rule[]> {
    const rows = await this.db
      .select()
      .from(rules)
      .where(and(eq(rules.botId, botId), eq(rules.chatId, chatInternalId)));

    return rows.map((row) => toRule(row));
  }

  async findById(
    id: string,
    botId: string,
    chatInternalId: number
  ): Promise<Rule | null> {
    const [row] = await this.db
      .select()
      .from(rules)
      .where(
        and(
          eq(rules.id, id),
          eq(rules.botId, botId),
          eq(rules.chatId, chatInternalId)
        )
      )
      .limit(1);

    return row ? toRule(row) : null;
  }

  async create(
    botId: string,
    chatInternalId: number,
    ruleData: CreateRuleRequest
  ): Promise<Rule> {
    const id = ruleData.id ?? randomUUID();
    const now = new Date();
    const [row] = await this.db
      .insert(rules)
      .values({
        id,
        botId,
        chatId: chatInternalId,
        name: ruleData.name,
        description: ruleData.description,
        aiPrompt: ruleData.ai_prompt,
        isActive: true,
        deleteOnViolation: ruleData.delete_on_violation ?? false,
        banOnViolation: ruleData.ban_on_violation ?? false,
        warningsBeforeBan: ruleData.warnings_before_ban ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return toRule(row);
  }

  async update(
    id: string,
    botId: string,
    chatInternalId: number,
    updateData: UpdateRuleRequest
  ): Promise<Rule | null> {
    const updateValues: Partial<typeof rules.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (updateData.name !== undefined) updateValues.name = updateData.name;
    if (updateData.description !== undefined) {
      updateValues.description = updateData.description;
    }
    if (updateData.ai_prompt !== undefined) {
      updateValues.aiPrompt = updateData.ai_prompt;
    }
    if (updateData.is_active !== undefined) {
      updateValues.isActive = updateData.is_active;
    }
    if (updateData.delete_on_violation !== undefined) {
      updateValues.deleteOnViolation = updateData.delete_on_violation;
    }
    if (updateData.ban_on_violation !== undefined) {
      updateValues.banOnViolation = updateData.ban_on_violation;
    }
    if (updateData.warnings_before_ban !== undefined) {
      updateValues.warningsBeforeBan = updateData.warnings_before_ban;
    }

    const [row] = await this.db
      .update(rules)
      .set(updateValues)
      .where(
        and(
          eq(rules.id, id),
          eq(rules.botId, botId),
          eq(rules.chatId, chatInternalId)
        )
      )
      .returning();

    return row ? toRule(row) : null;
  }

  async delete(
    id: string,
    botId: string,
    chatInternalId: number
  ): Promise<boolean> {
    const deleted = await this.db
      .delete(rules)
      .where(
        and(
          eq(rules.id, id),
          eq(rules.botId, botId),
          eq(rules.chatId, chatInternalId)
        )
      )
      .returning({ id: rules.id });
    return deleted.length > 0;
  }

  async findActiveForChat(
    botId: string,
    chatInternalId: number
  ): Promise<Rule[]> {
    const rows = await this.db
      .select()
      .from(rules)
      .where(
        and(
          eq(rules.botId, botId),
          eq(rules.chatId, chatInternalId),
          eq(rules.isActive, true)
        )
      );

    return rows.map((row) => toRule(row));
  }

  async findByIds(ids: string[], botId: string): Promise<Rule[]> {
    if (ids.length === 0) return [];
    const rows = await this.db
      .select()
      .from(rules)
      .where(and(eq(rules.botId, botId), inArray(rules.id, ids)));

    return rows.map((row) => toRule(row));
  }
}
