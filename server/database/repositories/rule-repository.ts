import { eq, inArray } from "drizzle-orm";
import { getDatabaseConnection } from "../connection";
import { Rule, CreateRuleRequest, UpdateRuleRequest } from "../models/rule";
import { rules } from "../schema";
import { toRule } from "../mappers";

export class RuleRepository {
  private get db() {
    return getDatabaseConnection().getDb();
  }

  async findAll(): Promise<Rule[]> {
    const rows = await this.db.select().from(rules);
    return rows.map(toRule);
  }

  async findById(id: string): Promise<Rule | null> {
    const [row] = await this.db.select().from(rules).where(eq(rules.id, id)).limit(1);
    return row ? toRule(row) : null;
  }

  async create(ruleData: CreateRuleRequest): Promise<Rule> {
    const now = new Date();
    const [row] = await this.db
      .insert(rules)
      .values({
        id: ruleData.id,
        name: ruleData.name,
        description: ruleData.description,
        aiPrompt: ruleData.ai_prompt,
        severity: ruleData.severity,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return toRule(row);
  }

  async update(
    id: string,
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
    if (updateData.severity !== undefined) {
      updateValues.severity = updateData.severity;
    }
    if (updateData.is_active !== undefined) {
      updateValues.isActive = updateData.is_active;
    }

    const [row] = await this.db
      .update(rules)
      .set(updateValues)
      .where(eq(rules.id, id))
      .returning();

    return row ? toRule(row) : null;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = await this.db
      .delete(rules)
      .where(eq(rules.id, id))
      .returning({ id: rules.id });
    return deleted.length > 0;
  }

  async findActive(): Promise<Rule[]> {
    const rows = await this.db
      .select()
      .from(rules)
      .where(eq(rules.isActive, true));
    return rows.map(toRule);
  }

  async findByIds(ids: string[]): Promise<Rule[]> {
    if (ids.length === 0) return [];
    const rows = await this.db
      .select()
      .from(rules)
      .where(inArray(rules.id, ids));
    return rows.map(toRule);
  }
}
