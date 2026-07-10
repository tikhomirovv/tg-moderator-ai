import type {
  CreateRuleRequest,
  Rule,
  UpdateRuleRequest,
} from "../../server/database/models/rule";

function ruleKey(workspaceId: string, id: string) {
  return `${workspaceId}:${id}`;
}

export class InMemoryRuleRepository {
  private rules = new Map<string, Rule>();

  async findAll(workspaceId: string): Promise<Rule[]> {
    return [...this.rules.entries()]
      .filter(([key]) => key.startsWith(`${workspaceId}:`))
      .map(([, rule]) => rule);
  }

  async findById(id: string, workspaceId: string): Promise<Rule | null> {
    return this.rules.get(ruleKey(workspaceId, id)) ?? null;
  }

  async create(workspaceId: string, ruleData: CreateRuleRequest): Promise<Rule> {
    const now = new Date();
    const rule: Rule = {
      id: ruleData.id,
      name: ruleData.name,
      description: ruleData.description,
      ai_prompt: ruleData.ai_prompt,
      severity: ruleData.severity,
      is_active: true,
      created_at: now,
      updated_at: now,
    };
    this.rules.set(ruleKey(workspaceId, rule.id), rule);
    return rule;
  }

  async update(
    id: string,
    workspaceId: string,
    updateData: UpdateRuleRequest
  ): Promise<Rule | null> {
    const existing = this.rules.get(ruleKey(workspaceId, id));
    if (!existing) {
      return null;
    }

    const updated: Rule = {
      ...existing,
      name: updateData.name ?? existing.name,
      description: updateData.description ?? existing.description,
      ai_prompt: updateData.ai_prompt ?? existing.ai_prompt,
      severity: updateData.severity ?? existing.severity,
      is_active: updateData.is_active ?? existing.is_active,
      updated_at: new Date(),
    };
    this.rules.set(ruleKey(workspaceId, id), updated);
    return updated;
  }

  async findActive(workspaceId: string): Promise<Rule[]> {
    const rules = await this.findAll(workspaceId);
    return rules.filter((rule) => rule.is_active);
  }
}
