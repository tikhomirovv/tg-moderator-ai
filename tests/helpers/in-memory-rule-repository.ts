import type {
  CreateRuleRequest,
  Rule,
  UpdateRuleRequest,
} from "../../server/database/models/rule";
import { randomUUID } from "node:crypto";
import { normalizeWhitelistEntry } from "../../server/core/rule-whitelist";

function ruleKey(workspaceId: string, id: string) {
  return `${workspaceId}:${id}`;
}

export class InMemoryRuleRepository {
  private rules = new Map<string, Rule>();
  private whitelist = new Map<string, string[]>();

  async findAll(workspaceId: string): Promise<Rule[]> {
    return [...this.rules.entries()]
      .filter(([key]) => key.startsWith(`${workspaceId}:`))
      .map(([, rule]) => ({
        ...rule,
        whitelist: [...(this.whitelist.get(rule.id) ?? [])],
      }));
  }

  async findById(id: string, workspaceId: string): Promise<Rule | null> {
    const rule = this.rules.get(ruleKey(workspaceId, id));
    if (!rule) {
      return null;
    }
    return {
      ...rule,
      whitelist: [...(this.whitelist.get(id) ?? [])],
    };
  }

  private storeWhitelist(ruleId: string, entries: string[] = []) {
    const stored = [
      ...new Set(
        entries
          .map(normalizeWhitelistEntry)
          .filter((entry): entry is string => entry !== null)
      ),
    ];
    this.whitelist.set(ruleId, stored);
  }

  async create(workspaceId: string, ruleData: CreateRuleRequest): Promise<Rule> {
    const now = new Date();
    const id = ruleData.id ?? randomUUID();
    const rule: Rule = {
      id,
      name: ruleData.name,
      description: ruleData.description,
      ai_prompt: ruleData.ai_prompt,
      is_active: true,
      delete_on_violation: ruleData.delete_on_violation ?? false,
      ban_on_violation: ruleData.ban_on_violation ?? false,
      warnings_before_ban: ruleData.warnings_before_ban ?? null,
      whitelist: [],
      created_at: now,
      updated_at: now,
    };
    this.storeWhitelist(id, ruleData.whitelist);
    rule.whitelist = [...(this.whitelist.get(id) ?? [])];
    this.rules.set(ruleKey(workspaceId, rule.id), rule);
    return { ...rule };
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
      is_active: updateData.is_active ?? existing.is_active,
      delete_on_violation:
        updateData.delete_on_violation ?? existing.delete_on_violation,
      ban_on_violation:
        updateData.ban_on_violation ?? existing.ban_on_violation,
      warnings_before_ban:
        updateData.warnings_before_ban !== undefined
          ? updateData.warnings_before_ban
          : existing.warnings_before_ban,
      updated_at: new Date(),
      whitelist: existing.whitelist,
    };

    if (updateData.whitelist !== undefined) {
      this.storeWhitelist(id, updateData.whitelist);
      updated.whitelist = [...(this.whitelist.get(id) ?? [])];
    }

    this.rules.set(ruleKey(workspaceId, id), updated);
    return { ...updated, whitelist: [...updated.whitelist] };
  }

  async delete(id: string, workspaceId: string): Promise<boolean> {
    const deleted = this.rules.delete(ruleKey(workspaceId, id));
    if (deleted) {
      this.whitelist.delete(id);
    }
    return deleted;
  }

  async findActive(workspaceId: string): Promise<Rule[]> {
    const rules = await this.findAll(workspaceId);
    return rules.filter((rule) => rule.is_active);
  }

  async findByIds(ids: string[], workspaceId: string): Promise<Rule[]> {
    const found: Rule[] = [];
    for (const id of ids) {
      const rule = await this.findById(id, workspaceId);
      if (rule) {
        found.push(rule);
      }
    }
    return found;
  }
}
