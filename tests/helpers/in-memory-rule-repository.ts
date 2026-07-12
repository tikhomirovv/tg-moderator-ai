import type {
  CreateRuleRequest,
  Rule,
  UpdateRuleRequest,
} from "../../server/database/models/rule";

function ruleKey(botId: string, chatInternalId: number, id: string) {
  return `${botId}:${chatInternalId}:${id}`;
}

export class InMemoryRuleRepository {
  private rules = new Map<string, Rule>();

  async findAllByChat(botId: string, chatInternalId: number): Promise<Rule[]> {
    return [...this.rules.entries()]
      .filter(([key]) => key.startsWith(`${botId}:${chatInternalId}:`))
      .map(([, rule]) => ({ ...rule }));
  }

  async findById(
    id: string,
    botId: string,
    chatInternalId: number
  ): Promise<Rule | null> {
    const rule = this.rules.get(ruleKey(botId, chatInternalId, id));
    return rule ? { ...rule } : null;
  }

  async create(
    botId: string,
    chatInternalId: number,
    ruleData: CreateRuleRequest
  ): Promise<Rule> {
    const now = new Date();
    const rule: Rule = {
      id: ruleData.id ?? crypto.randomUUID(),
      chat_id: chatInternalId,
      name: ruleData.name,
      description: ruleData.description,
      ai_prompt: ruleData.ai_prompt,
      is_active: true,
      delete_on_violation: ruleData.delete_on_violation ?? false,
      ban_on_violation: ruleData.ban_on_violation ?? false,
      warnings_before_ban: ruleData.warnings_before_ban ?? null,
      created_at: now,
      updated_at: now,
    };
    this.rules.set(ruleKey(botId, chatInternalId, rule.id), rule);
    return { ...rule };
  }

  async update(
    id: string,
    botId: string,
    chatInternalId: number,
    updateData: UpdateRuleRequest
  ): Promise<Rule | null> {
    const existing = this.rules.get(ruleKey(botId, chatInternalId, id));
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
      updated_at: new Date(),
    };

    this.rules.set(ruleKey(botId, chatInternalId, id), updated);
    return { ...updated };
  }

  async delete(
    id: string,
    botId: string,
    chatInternalId: number
  ): Promise<boolean> {
    return this.rules.delete(ruleKey(botId, chatInternalId, id));
  }

  async findActiveForChat(
    botId: string,
    chatInternalId: number
  ): Promise<Rule[]> {
    const rules = await this.findAllByChat(botId, chatInternalId);
    return rules.filter((rule) => rule.is_active);
  }

  async findByIds(ids: string[], botId: string): Promise<Rule[]> {
    const rules: Rule[] = [];
    for (const [key, rule] of this.rules.entries()) {
      if (!key.startsWith(`${botId}:`)) {
        continue;
      }
      if (ids.includes(rule.id)) {
        rules.push({ ...rule });
      }
    }
    return rules;
  }
}
