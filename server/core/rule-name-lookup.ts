import { RuleRepository } from "../database/repositories/rule-repository";

export type RuleNameLookup = Pick<RuleRepository, "findByIds">;

/** Resolve rule ids to display names across one or more bots. */
export async function loadRuleNameMap(
  entries: Array<{ botId: string; ruleId: string | null | undefined }>,
  deps?: { ruleRepo?: RuleNameLookup }
): Promise<Map<string, string>> {
  const byBot = new Map<string, Set<string>>();

  for (const entry of entries) {
    if (!entry.ruleId) {
      continue;
    }
    const ids = byBot.get(entry.botId) ?? new Set<string>();
    ids.add(entry.ruleId);
    byBot.set(entry.botId, ids);
  }

  const names = new Map<string, string>();
  if (byBot.size === 0) {
    return names;
  }

  const ruleRepo = deps?.ruleRepo ?? new RuleRepository();
  for (const [botId, ruleIds] of byBot) {
    const rules = await ruleRepo.findByIds([...ruleIds], botId);
    for (const rule of rules) {
      names.set(rule.id, rule.name);
    }
  }

  return names;
}

export function resolveRuleName(
  ruleId: string | null | undefined,
  names: Map<string, string>
): string | null {
  if (!ruleId) {
    return null;
  }

  return names.get(ruleId) ?? null;
}

export function enrichWithRuleName<
  T extends { rule_violated?: string | null },
>(item: T, names: Map<string, string>): T & { rule_name: string | null } {
  return {
    ...item,
    rule_name: resolveRuleName(item.rule_violated, names),
  };
}
