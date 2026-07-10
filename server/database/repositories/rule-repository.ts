import { and, eq, inArray } from "drizzle-orm";
import { getDatabaseConnection } from "../connection";
import { Rule, CreateRuleRequest, UpdateRuleRequest } from "../models/rule";
import { rules } from "../schema";
import { toRule } from "../mappers";

export class RuleRepository {
  private get db() {
    return getDatabaseConnection().getDb();
  }

  async findAll(workspaceId: string): Promise<Rule[]> {
    const rows = await this.db
      .select()
      .from(rules)
      .where(eq(rules.workspaceId, workspaceId));
    return rows.map(toRule);
  }

  async findById(id: string, workspaceId: string): Promise<Rule | null> {
    const [row] = await this.db
      .select()
      .from(rules)
      .where(and(eq(rules.id, id), eq(rules.workspaceId, workspaceId)))
      .limit(1);
    return row ? toRule(row) : null;
  }

  async create(
    workspaceId: string,
    ruleData: CreateRuleRequest
  ): Promise<Rule> {
    const now = new Date();
    const [row] = await this.db
      .insert(rules)
      .values({
        id: ruleData.id,
        workspaceId,
        name: ruleData.name,
        description: ruleData.description,
        aiPrompt: ruleData.ai_prompt,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return toRule(row);
  }

  async update(
    id: string,
    workspaceId: string,
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

    const [row] = await this.db
      .update(rules)
      .set(updateValues)
      .where(and(eq(rules.id, id), eq(rules.workspaceId, workspaceId)))
      .returning();

    return row ? toRule(row) : null;
  }

  async delete(id: string, workspaceId: string): Promise<boolean> {
    const deleted = await this.db
      .delete(rules)
      .where(and(eq(rules.id, id), eq(rules.workspaceId, workspaceId)))
      .returning({ id: rules.id });
    return deleted.length > 0;
  }

  async findActive(workspaceId: string): Promise<Rule[]> {
    const rows = await this.db
      .select()
      .from(rules)
      .where(
        and(eq(rules.workspaceId, workspaceId), eq(rules.isActive, true))
      );
    return rows.map(toRule);
  }

  async findByIds(ids: string[], workspaceId: string): Promise<Rule[]> {
    if (ids.length === 0) return [];
    const rows = await this.db
      .select()
      .from(rules)
      .where(
        and(eq(rules.workspaceId, workspaceId), inArray(rules.id, ids))
      );
    return rows.map(toRule);
  }
}
