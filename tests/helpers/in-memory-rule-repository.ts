import type {
  CreateRuleRequest,
  Rule,
  UpdateRuleRequest,
} from "../../server/database/models/rule";

function ruleKey(botId: string, id: string) {
  return `${botId}:${id}`;
}

export class InMemoryRuleRepository {
  private rules = new Map<string, Rule>();

  async findAll(botId: string): Promise<Rule[]> {
    return [...this.rules.entries()]
      .filter(([key]) => key.startsWith(`${botId}:`))
      .map(([, rule]) => ({ ...rule, whitelist: [...rule.whitelist] }));
  }

  async findById(id: string, botId: string): Promise<Rule | null> {
    const rule = this.rules.get(ruleKey(botId, id));
    return rule ? { ...rule, whitelist: [...rule.whitelist] } : null;
  }

  async create(botId: string, ruleData: CreateRuleRequest): Promise<Rule> {
    const now = new Date();
    const rule: Rule = {
      id: ruleData.id ?? crypto.randomUUID(),
      name: ruleData.name,
      description: ruleData.description,
      ai_prompt: ruleData.ai_prompt,
      is_active: true,
      delete_on_violation: ruleData.delete_on_violation ?? false,
      ban_on_violation: ruleData.ban_on_violation ?? false,
      warnings_before_ban: ruleData.warnings_before_ban ?? null,
      whitelist: [...(ruleData.whitelist ?? [])],
      created_at: now,
      updated_at: now,
    };
    this.rules.set(ruleKey(botId, rule.id), rule);
    return { ...rule, whitelist: [...rule.whitelist] };
  }

  async update(
    id: string,
    botId: string,
    updateData: UpdateRuleRequest
  ): Promise<Rule | null> {
    const existing = this.rules.get(ruleKey(botId, id));
    if (!existing) {
      return null;
    }

    const updated: Rule = {
      ...existing,
      name: updateData.name ?? existing.name,
      description: updateData.description ?? existing.description,
      ai_prompt: updateData.ai_prompt ?? existing.ai_prompt,
      is_active: updateData.is_active ?? existing.is_active,
      delete_on_violation:
        updateData.delete_on_violation ?? existing.delete_on_violation,
      ban_on_violation: updateData.ban_on_violation ?? existing.ban_on_violation,
      warnings_before_ban:
        updateData.warnings_before_ban ?? existing.warnings_before_ban,
      whitelist:
        updateData.whitelist !== undefined
          ? [...updateData.whitelist]
          : [...existing.whitelist],
      updated_at: new Date(),
    };

    this.rules.set(ruleKey(botId, id), updated);
    return { ...updated, whitelist: [...updated.whitelist] };
  }

  async delete(id: string, botId: string): Promise<boolean> {
    return this.rules.delete(ruleKey(botId, id));
  }

  async findActive(botId: string): Promise<Rule[]> {
    const rules = await this.findAll(botId);
    return rules.filter((rule) => rule.is_active);
  }

  async findByIds(ids: string[], botId: string): Promise<Rule[]> {
    const rules: Rule[] = [];
    for (const id of ids) {
      const rule = await this.findById(id, botId);
      if (rule) {
        rules.push(rule);
      }
    }
    return rules;
  }
}
