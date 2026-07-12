import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { getDatabaseConnection } from "../connection";
import { Rule, CreateRuleRequest, UpdateRuleRequest } from "../models/rule";
import { rules, ruleWhitelist } from "../schema";
import { toRule } from "../mappers";
import { normalizeWhitelistEntry } from "../../core/rule-whitelist";

function normalizeWhitelistInput(entries: string[] | undefined): string[] {
  if (!entries?.length) {
    return [];
  }

  const normalized = entries
    .map(normalizeWhitelistEntry)
    .filter((entry): entry is string => entry !== null);

  return [...new Set(normalized)];
}

export class RuleRepository {
  private get db() {
    return getDatabaseConnection().getDb();
  }

  private async loadWhitelistForRules(
    botId: string,
    ruleIds: string[]
  ): Promise<Map<string, string[]>> {
    const result = new Map<string, string[]>();
    if (ruleIds.length === 0) {
      return result;
    }

    const rows = await this.db
      .select()
      .from(ruleWhitelist)
      .where(
        and(
          eq(ruleWhitelist.botId, botId),
          inArray(ruleWhitelist.ruleId, ruleIds)
        )
      );

    for (const row of rows) {
      const existing = result.get(row.ruleId) ?? [];
      existing.push(row.entry);
      result.set(row.ruleId, existing);
    }

    return result;
  }

  private async replaceWhitelist(
    botId: string,
    ruleId: string,
    entries: string[] | undefined
  ): Promise<void> {
    await this.db
      .delete(ruleWhitelist)
      .where(
        and(eq(ruleWhitelist.botId, botId), eq(ruleWhitelist.ruleId, ruleId))
      );

    const normalized = normalizeWhitelistInput(entries);
    if (normalized.length === 0) {
      return;
    }

    await this.db.insert(ruleWhitelist).values(
      normalized.map((entry) => ({
        botId,
        ruleId,
        entry,
      }))
    );
  }

  async findAll(botId: string): Promise<Rule[]> {
    const rows = await this.db
      .select()
      .from(rules)
      .where(eq(rules.botId, botId));

    const whitelistByRuleId = await this.loadWhitelistForRules(
      botId,
      rows.map((row) => row.id)
    );

    return rows.map((row) =>
      toRule(row, whitelistByRuleId.get(row.id) ?? [])
    );
  }

  async findById(id: string, botId: string): Promise<Rule | null> {
    const [row] = await this.db
      .select()
      .from(rules)
      .where(and(eq(rules.id, id), eq(rules.botId, botId)))
      .limit(1);

    if (!row) {
      return null;
    }

    const whitelistByRuleId = await this.loadWhitelistForRules(botId, [
      row.id,
    ]);

    return toRule(row, whitelistByRuleId.get(row.id) ?? []);
  }

  async create(botId: string, ruleData: CreateRuleRequest): Promise<Rule> {
    const id = ruleData.id ?? randomUUID();
    const now = new Date();
    const [row] = await this.db
      .insert(rules)
      .values({
        id,
        botId,
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

    await this.replaceWhitelist(botId, id, ruleData.whitelist);

    const whitelistByRuleId = await this.loadWhitelistForRules(botId, [id]);

    return toRule(row, whitelistByRuleId.get(id) ?? []);
  }

  async update(
    id: string,
    botId: string,
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
      .where(and(eq(rules.id, id), eq(rules.botId, botId)))
      .returning();

    if (!row) {
      return null;
    }

    if (updateData.whitelist !== undefined) {
      await this.replaceWhitelist(botId, id, updateData.whitelist);
    }

    const whitelistByRuleId = await this.loadWhitelistForRules(botId, [id]);

    return toRule(row, whitelistByRuleId.get(id) ?? []);
  }

  async delete(id: string, botId: string): Promise<boolean> {
    const deleted = await this.db
      .delete(rules)
      .where(and(eq(rules.id, id), eq(rules.botId, botId)))
      .returning({ id: rules.id });
    return deleted.length > 0;
  }

  async findActive(botId: string): Promise<Rule[]> {
    const rows = await this.db
      .select()
      .from(rules)
      .where(and(eq(rules.botId, botId), eq(rules.isActive, true)));

    const whitelistByRuleId = await this.loadWhitelistForRules(
      botId,
      rows.map((row) => row.id)
    );

    return rows.map((row) =>
      toRule(row, whitelistByRuleId.get(row.id) ?? [])
    );
  }

  async findByIds(ids: string[], botId: string): Promise<Rule[]> {
    if (ids.length === 0) return [];
    const rows = await this.db
      .select()
      .from(rules)
      .where(and(eq(rules.botId, botId), inArray(rules.id, ids)));

    const whitelistByRuleId = await this.loadWhitelistForRules(
      botId,
      rows.map((row) => row.id)
    );

    return rows.map((row) =>
      toRule(row, whitelistByRuleId.get(row.id) ?? [])
    );
  }

  async getWhitelistByRuleIds(
    botId: string,
    ruleIds: string[]
  ): Promise<Map<string, string[]>> {
    return this.loadWhitelistForRules(botId, ruleIds);
  }
}
